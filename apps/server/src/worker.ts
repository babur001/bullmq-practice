import { connection } from "@/connection";
import { Worker } from "bullmq";

export const worker = new Worker(
  "greeting",
  async (job) => {
    await new Promise((res, rej) => {
      setTimeout(() => {
        console.log(job.id);

        res("success");
      }, 1200);
    });
    return { greeted: true };
  },
  { connection: connection, concurrency: 1 },
);

worker.on("completed", (job) => console.log(`✅ job ${job.id} done`));
worker.on("failed", (job, err) => console.log(`❌ job ${job?.id}:`, err.message));

// Ansers to questions
// Why did the jobs survive while the worker was off?
// Cause the data is stored in redis, so until the redis is off all of the jobs that we have produced and sent are stored in redis
// What do you think job.id is for?
// For tracking the order of jobs and identify from each other
// If you started a second worker, who would process the jobs?
// I have tested, the order is random but sequantial. 2 workers does not take 1 task simultaneously
