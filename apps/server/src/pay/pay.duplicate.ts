import { payments_queue } from "@/pay/pay.queue";
import { QueueEvents } from "bullmq";

const qEvents = new QueueEvents("payments");
// PART B
// await payments_queue.add("charge", { saleId: "17", amount: 1000 });
// await payments_queue.add("charge", { saleId: "18", amount: 1001 });

// console.log("Queue:", await payments_queue.getJobCounts());

// PART C
const job = await payments_queue.add(
  "charge",
  { saleId: "21", amount: 1, fail: true },
  { attempts: 10 },
);

console.log(await payments_queue.getJobCounts());

try {
  const log = await job.waitUntilFinished(qEvents);
} catch (error) {
  console.log(error);

  console.log(await payments_queue.getJobCounts());
}

// Only once since first time lock still works and next attempt just fails to set lock key
// If no lock the double charge happens

// PART D
/**

Bullmq sets expiry time for jobs execution, if there is no answer from worker for longer period
bullmq thinks that job failed, and retires it with another worker, thus making run 2 parallel workers to run, and thus it is best-effor lease

TO makee it mutex we need a locking in other storage like redis Nx key or some disk based storage


What real event makes the lock expire while the work is still running?:
Maybe some nodejs event happened and is blocking CPU usage, or crash happened, or even the worker is down for some time

Why does that mean the consumer-side idempotency guard — not the lock — is what actually protects you?:
IN consumer side in next iteration we check is this job before was run by another worker, maybe because that worker there might be still running it and not yet finished it

*/
