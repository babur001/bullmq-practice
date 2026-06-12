import { flakyQueue } from "@/flaky/flaky.queue";
import { QueueEvents } from "bullmq";

const qEvents = new QueueEvents("flaky");

await flakyQueue.add(
  "flaky-job",
  { data: "Babur" },
  { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
);

const job = await flakyQueue.add(
  "flaky-job-fails-always",
  { data: "Babur", alwaysFail: true },
  { attempts: 1, backoff: { type: "fixed", delay: 2000 } },
);

try {
  const result = await job.waitUntilFinished(qEvents);

  console.log(result);
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
  }
}
