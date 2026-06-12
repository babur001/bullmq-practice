import { connection } from "@/connection";
import { Worker } from "bullmq";

const worker = new Worker(
  "flaky",
  async (job) => {
    if (job.data.alwaysFail) {
      throw new Error("Test Babur");
    }

    console.log(job.data);

    return { ok: true };
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
