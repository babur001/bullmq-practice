import { connection } from "@/connection";
import { Queue, Worker } from "bullmq";
import { d, db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";
import type { ISagaPayload } from "@/lesson-9/create-sale";

interface SagaJob {
  step: t.TSagaStep;
  outbox_id: number;
  orderId: string;
}

const sagaForward = new Queue("saga-orders", { connection });
// const sagaCompensate = new Queue("saga-orders", { connection });

const relayOnce = async () => {
  const saga_outbox_rows = await db
    .select()
    .from(t.saga_outbox)
    .where(d.eq(t.outbox.published, false))
    .limit(1);

  for (const saga_row of saga_outbox_rows) {
    const data = saga_row.payload as ISagaPayload;

    await sagaForward.add(
      "saga-outbox",
      {
        step: saga_row.step,
        outbox_id: saga_row.id,
        orderId: saga_row.orderId,
      } satisfies SagaJob,
      { jobId: `saga_outbox_${saga_row.id}`, attempts: 10 },
    );

    await db
      .update(t.saga_outbox)
      .set({ published: true })
      .where(d.eq(t.saga_outbox.id, saga_row.id));

    console.log(`ADDED_TO_SAGA_QUEUE:`, saga_row.id, saga_row.id);
  }
};

const payHandler = async () => {
  if (false) throw new Error("FAILED_TEST");
  return new Promise((res) => setTimeout(res, 1000));
};

new Worker(
  "saga-orders",
  async (job) => {
    const data = job.data as SagaJob;

    switch (data.step) {
      case "authorize":
        await payHandler();
        await db
          .insert(t.saga_outbox)
          .values({ step: "ship", payload: { ...data }, orderId: data.orderId });

        console.log(` ✔ authorized payment (HOLD placed) → ship`);

        break;

      default:
        break;
    }
  },
  { connection },
);

// Here also, when job is added, immediately before job even starts handling payment, job is re-added, i think we need more grace period here instead of bashing the queue with duplicate jobs where they are already running
setInterval(relayOnce, 1000);
