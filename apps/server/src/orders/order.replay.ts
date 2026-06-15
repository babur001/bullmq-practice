import { orders_dlq_queue } from "@/orders/order.dlq";
import { order_queue } from "@/orders/order.queue";

// Waiting dlq's jobs
const failed = await orders_dlq_queue.getJobs();

// Part C
for (const job of failed) {
  // if i not stored the data i would lose the replay logic, just would have the error logs. Solution would be going directly to orders queue and fetch failed jobs and merge the, by job.id
  await order_queue.add(job.name, { ...job.data, valid: true });
  await job.remove();
}

process.exit(0);

// Part D
// No, the main reason of failing is not the workers are not working,
// but primary cause is mainly in broken data or broken service code. How much we try there is high chance
// that the job will fail again
// thus will enter loop
// So to avoid it better to put a grace retry count with graceful delays between them
