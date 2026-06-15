import { s_queue } from "@/scale/s.queue";

await Promise.all(
  new Array(10).fill("").map((_, idx) => {
    return s_queue.add("job", { data: idx + 1 });
  }),
);

process.exit(0);
