import { orders_dlq_queue } from "@/orders/order.dlq";

// Waiting dlq's jobs
const failed = await orders_dlq_queue.getJobs();

// All are in waiting, since there is no worker to work on this. Humans will review dlqs
console.log(await orders_dlq_queue.getJobCounts());

for (const j of failed) {
  if (j) {
    console.log(j.id, j.data.failedReason, j.data);
  }
}

process.exit(0);
