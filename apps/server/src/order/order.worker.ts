import { connection } from "@/connection";
import { Worker } from "bullmq";
import { shipping_queue } from "@/order/shipping.worker";
import { notification_queue } from "@/order/notification.worker";
import { warehouse_queue } from "@/order/warehouse.worker";
import { ledger } from "@/order/ledger";

const chargeCard = async ({
  sale_id,
  total_sum,
}: {
  sale_id: string;
  total_sum: string;
}) => {
  new Promise((res) => setTimeout(res, 1000));

  // Here i would use the db instead of redis and store idompotent key there. Same i would use for all workers (shipping, notifications and warehouse)
  // Or is it a bad idea? Since anyways i need some storage to keep track of that idempotency
  const charged = await ledger.charge(sale_id, total_sum);

  if (!charged) {
    console.log("CHARGED: ", sale_id, " TOTAL_SUM: ", total_sum);

    return { success: true, total_charged: total_sum };
  } else {
    return {
      success: true,
      total_charged: charged,
      dedup: true, // for debugging
    };
  }
};

new Worker(
  "orders",
  async (job) => {
    const { sale_id, total_sum } = job.data;

    const charged = await chargeCard({ sale_id, total_sum });
    console.log(charged);

    await shipping_queue.add(
      "sale",
      { sale_id, total_sum },
      { jobId: `sale_${sale_id}` },
    );
    await notification_queue.add(
      "sale",
      { sale_id, total_sum },
      { jobId: `sale_${sale_id}` },
    );
    await warehouse_queue.add(
      "sale",
      { sale_id, total_sum },
      { jobId: `sale_${sale_id}` },
    );

    if (job.attemptsMade < 4) throw new Error("SERVER IS DOWN...");
  },
  { connection },
);
