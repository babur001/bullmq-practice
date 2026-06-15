import { connection } from "@/connection";
import { orders_dlq_queue } from "@/orders/order.dlq";
import { Worker } from "bullmq";

const worker = new Worker(
  "orders",
  async (job) => {
    const { id, amount, valid } = job.data;

    if (!valid) throw new Error(`Invalid order ${id}`);
    console.log("success");

    return { charged: true };
  },
  { connection: connection },
);

worker.on("failed", async (job) => {
  if (!job) return;

  const attempts = 3;
  // (3 * default_retry_count) in total DLQ's if this check omitted
  console.log(job.attemptsMade);

  if (job.attemptsMade >= attempts) {
    console.log(`■■■ Failed ${job.id} @ ${Date.now() % 100000}`);

    await orders_dlq_queue.add("failed-order", {
      originalJobId: job.id,
      failedReason: job.failedReason,
      data: job.data,
    });
  }
});
