import { connection } from "@/bullmq/connection";
import { notification_queue } from "@/bullmq/order/notification.worker";
import { shipping_queue } from "@/bullmq/order/shipping.worker";
import * as t from "@learn-broker/db/schema/index";
import { d, db } from "@learn-broker/db";
import { Worker } from "bullmq";

const pay_queue = new Worker(
  "payments",
  async (job) => {
    const data: {
      sale_id: string;
      outbox_id: number;
      products: { product_id: number; quantity: number }[];
      total_sum: number;
    } = job.data;

    console.log("HANLDING PAYMENT...");

    // FAKE PAYMENT INTEGRATION (sale_id by passing in job.data as idempotency key)
    await new Promise((res) => setTimeout(res, 1000));

    console.log("PAYMENT SUCCESSFULL");

    await db
      .update(t.outbox)
      .set({ published: true })
      .where(d.eq(t.outbox.id, data.outbox_id));

    // Here i would have inserted to db, or did as you said implemented Temporal
    await shipping_queue.add("ship", data, { jobId: `shipping_${data.sale_id}` });
    await notification_queue.add("notify", data, {
      jobId: `notification_${data.sale_id}`,
    });

    return { charged: true };
  },
  { connection: connection },
);

pay_queue.on("failed", (job) => {
  if (!job) return;

  console.log(job.failedReason);

  console.log("FAILED: ", job.id, job.data);
});
