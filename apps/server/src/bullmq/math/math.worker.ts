import { connection } from "@/bullmq/math/redis-connection";
import { Worker } from "bullmq";

export const worker = new Worker(
  "math",
  async (job) => {
    const { a, b } = job.data;

    if (job.attemptsMade < 2) {
      throw new Error(`Test babur ${job.attemptsMade}`);
    }

    return { sum: a + b };
  },
  { connection: connection },
);

worker.on("completed", (job) =>
  console.log(`✅ ${job.id} done after ${job.attemptsMade} attempt(s)`),
);

worker.on("failed", (job, err) =>
  console.log(
    `❌ ${job?.id} gave up after ${job?.attemptsMade} attempt(s): ${err.message}`,
  ),
);
