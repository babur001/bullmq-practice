import { signFile } from "@/safe-file-signing";
import crypto from "node:crypto";
import path from "node:path";

export const verifyFileSign = ({
  computedHash,
  expectedHash,
}: {
  computedHash: string;
  expectedHash: string;
}): boolean => {
  const computed = Buffer.from(computedHash, "base64url");
  const expected = Buffer.from(expectedHash, "base64url");

  if (computed.length !== expected.length) return false;

  return crypto.timingSafeEqual(computed, expected);
};
