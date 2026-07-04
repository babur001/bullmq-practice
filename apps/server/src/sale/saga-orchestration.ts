import { connection } from "@/connection";
import { saga_backward_queue } from "@/sale/saga-queues";
import type { ISagaJob } from "@/sale/type";
import { d, db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";
import type { TSagaStep } from "@learn-broker/db/schema/index";
import { Job, UnrecoverableError, Worker } from "bullmq";

const advance = async (params: { sale_id: string; step: TSagaStep }) => {
  return await db.transaction(async (tx) => {
    await tx.update(t.orders).set({ status: "in_payment" });
    await tx.insert(t.saga_outbox).values({
      sale_id: params.sale_id,
      step: params.step,
    });
  });
};

const authorizePayment = async (sale_id: string) => {
  if (Date.now() % 2 === 0) throw new Error("❌ - failed authorize payment");

  return new Promise((res) => setTimeout(res, 1000));
};

const reserveWarehouse = async (sale_id: string) => {
  if (Date.now() % 2 === 0) throw new Error("❌ - failed reserve");

  return new Promise((res) => setTimeout(res, 300));
};

const handleShipping = async (sale_id: string) => {
  if (Date.now() % 2 === 0) throw new Error("❌ - failed shipping validation");

  return new Promise((res) => setTimeout(res, 300));
};

const handlePaymentCapture = async (sale_id: string) => {
  if (Date.now() % 2 === 0) throw new Error("❌ - failed payment capture");

  return new Promise((res) => setTimeout(res, 300));
};

const finalize = async (sale_id: string) => {
  await db
    .update(t.orders)
    .set({ status: "completed" })
    .where(d.eq(t.orders.id, sale_id));
};

const sagaMachine = async (job: Job<ISagaJob>) => {
  if (job.data.step === "payment_authorize") {
    console.log(`[$PAYMENT_AUTHORIZE]: handling...`);

    await authorizePayment(job.data.sale_id);
    await advance({ sale_id: job.data.sale_id, step: "warehouse" });

    console.log(`[$PAYMENT_AUTHORIZE]: ✅ → reserve`);

    return;
  }

  if (job.data.step === "warehouse") {
    console.log(`[$WAREHOUSE]: reserving...`);

    await reserveWarehouse(job.data.sale_id);
    await advance({ sale_id: job.data.sale_id, step: "shipping" });

    console.log(`[$WAREHOUSE]: ✅ → ship`);
  }

  if (job.data.step === "shipping") {
    console.log(`[$SHIPPING]: handling...`);

    await handleShipping(job.data.sale_id);
    await advance({ sale_id: job.data.sale_id, step: "payment_capture" });

    console.log(`[$SHIPPING]: ✅ → payment_capture`);
  }

  if (job.data.step === "payment_capture") {
    console.log(`[$PAYMENT_CAPTURE]: handling...`);

    await handlePaymentCapture(job.data.sale_id);
    await advance({ sale_id: job.data.sale_id, step: "finalize" });

    console.log(`[$PAYMENT_CAPTURE]: ✅ → finalize`);
  }

  if (job.data.step === "finalize") {
    console.log(`[FINALIZING]: handling...`);

    await finalize(job.data.sale_id);

    console.log(`---SALE ✅---`);
  }
};

const sagaBackwardMachine = async (job: Job<ISagaJob>) => {
  console.log(job.data, job.id);
};

const saga_forward_worker = new Worker("SAGA_FORWARD_QUEUE", sagaMachine, { connection });
const saga_backward_worker = new Worker("SAGA_BACKWARD_QUEUE", sagaBackwardMachine, {
  connection,
});

saga_forward_worker.on("failed", async (job, err) => {
  if (!job) return;

  console.log("❌FAILED JOB❌", job.data.step);

  if (err instanceof UnrecoverableError) {
    await saga_backward_queue.add("compensate", { sale_id: job.data.sale_id });
  }
});
