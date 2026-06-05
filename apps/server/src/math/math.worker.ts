import { connection } from "@/math/redis-connection";
import { Worker } from "bullmq";

export const worker = new Worker(
  "math",
  async (job) => {
    console.log("job.data", job.data);

    const { a, b } = job.data;

    await new Promise((res) =>
      setTimeout(() => {
        res("success");
      }, 1500),
    );

    return { sum: a + b };
  },
  { connection: connection },
);

worker.on("completed", (job) => {
  console.log(`Job completed:`, job.id);
});

worker.on("failed", (job, err) => {
  console.log(`Job failed: ${job?.id}`, err.message);
});
