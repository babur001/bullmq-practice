import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const signFile = ({
  filePath,
  toPath,
  algorithm = "sha256",
  secret,
}: {
  filePath: string;
  toPath: string;
  algorithm?: string;
  secret: string;
}): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const hmac = crypto.createHmac(algorithm, secret);
    const stream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(toPath, { flags: "w", encoding: "utf8" });

    let count = 0;
    stream.on("data", (data) => {
      count += 1;

      writeStream.write(data);
    });
    stream.on("error", reject);
    stream.on("end", () => {
      resolve(hmac.digest("base64url"));
    });
  });
};

console.time("file");

await signFile({
  filePath: path.join("/Users/saburov/Desktop", "large-folder.zip"),
  toPath: path.join(process.cwd(), "large.zip"),
  secret: "babur",
});

console.timeEnd("file");
