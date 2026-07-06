import { connection } from "@/bullmq/connection";
import type { ISagaJob } from "@/bullmq/sale/type";
import { d, db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";
import { Job, UnrecoverableError, Worker } from "bullmq";

const advance = async (params: {
  sale_id: string;
  step: t.TSagaForwardStep | t.TSagaBackwardStep;
}) => {
  return await db.transaction(async (tx) => {
    await tx
      .update(t.orders)
      .set({ status: "pending", step: "forward" })
      .where(d.eq(t.orders.id, params.sale_id));
    await tx.insert(t.saga_outbox).values({
      sale_id: params.sale_id,
      step: params.step,
    });
  });
};

const authorizePayment = async (sale_id: string) => {
  const result = await connection.set(
    `payment_${sale_id}`,
    "1",
    "EX",
    1000 * 60 * 5,
    "NX",
    "GET",
  );
  if (result) {
    await new Promise((res) => setTimeout(res, 1000));
    return { charged: true, skipped: false };
  } else {
    return { charged: true, skipped: true };
  }
};

const reserveWarehouse = async (sale_id: string) => {
  const [sale] = await db
    .select()
    .from(t.orders)
    .where(d.eq(t.orders.id, sale_id))
    .limit(1);

  if (!sale) throw new Error("Sale not found");

  if (Date.now() % 2 === 0) throw new Error("❌❌❌ FAILED TEST");

  // Here i would get the sales products then on each product_variant set a block for 5 minutes
  const product_id = sale.id;

  const result = await connection.set(
    `reserve_product_${product_id}`,
    "1",
    "EX",
    1000 * 60 * 5,
    "NX",
    "GET",
  );

  if (!result) {
    await new Promise((res) => setTimeout(res, 1000));
    return { charged: true, skipped: false };
  } else {
    return { charged: true, skipped: true };
  }
};

const handleShipping = async (sale_id: string, region: string) => {
  const result = await connection.set(
    `ship_${sale_id}`,
    "1",
    "EX",
    1000 * 60 * 5,
    "NX",
    "GET",
  );

  if (region === "BERMUD_PYRAMID") throw new Error("Server is down: 500");

  if (!result) {
    await new Promise((res) => setTimeout(res, 1000));
    // throw new UnrecoverableError("Non-deliverable region");
    return { charged: true, skipped: false };
  } else {
    return { charged: true, skipped: true };
  }
};

const handlePaymentCapture = async (sale_id: string) => {
  const result = await connection.set(
    `payment_capture_${sale_id}`,
    "1",
    "EX",
    1000 * 60 * 5,
    "NX",
    "GET",
  );

  if (result) {
    await new Promise((res) => setTimeout(res, 1000));
    return { charged: true, skipped: false };
  } else {
    return { charged: true, skipped: true };
  }
};

const finalize = async (sale_id: string, saga_outbox_id: number) => {
  return await db.transaction(async (tx) => {
    await tx
      .update(t.orders)
      .set({ status: "completed" })
      .where(d.eq(t.orders.id, sale_id));
    await tx
      .update(t.saga_outbox)
      .set({
        is_published: true,
        step: "completed",
      })
      .where(d.eq(t.saga_outbox.id, saga_outbox_id));
  });
};

const sagaMachine = async (job: Job<ISagaJob>) => {
  if (job.data.step === "initial") {
    console.log(`[$INITIAL]: handling...`);

    await advance({ sale_id: job.data.sale_id, step: "in_payment_authorize" });

    console.log(`[$INITIAL]: ✅ → payment_authorize`);

    return;
  }

  if (job.data.step === "in_payment_authorize") {
    console.log(`[$PAYMENT_AUTHORIZE]: handling...`);

    await authorizePayment(job.data.sale_id);
    await advance({ sale_id: job.data.sale_id, step: "in_warehouse_reserve" });

    console.log(`[$PAYMENT_AUTHORIZE]: ✅ → reserve`);

    return;
  }

  if (job.data.step === "in_warehouse_reserve") {
    console.log(`[$WAREHOUSE]: reserving...`);

    await reserveWarehouse(job.data.sale_id);
    await advance({ sale_id: job.data.sale_id, step: "in_shipping" });

    console.log(`[$WAREHOUSE]: ✅ → ship`);
  }

  if (job.data.step === "in_shipping") {
    console.log(`[$SHIPPING]: handling...`);

    await handleShipping(job.data.sale_id, job.data.region);
    await advance({ sale_id: job.data.sale_id, step: "in_payment_capture" });

    console.log(`[$SHIPPING]: ✅ → in_payment_capture`);
  }

  if (job.data.step === "in_payment_capture") {
    console.log(`[$PAYMENT_CAPTURE]: handling...`);

    await handlePaymentCapture(job.data.sale_id);
    await advance({ sale_id: job.data.sale_id, step: "in_finalize" });

    console.log(`[$PAYMENT_CAPTURE]: ✅ → `);
  }

  if (job.data.step === "in_finalize") {
    console.log(`[FINALIZING]: handling...`);

    await finalize(job.data.sale_id, job.data.saga_outbox_id);

    console.log(`---SALE ✅---`);
  }
};

/**
 * Here we would lock, check and pass idempotent keys in each method
 */
const releasePayment = async (sale_id: string) => {
  return new Promise((res) => setTimeout(res, 300));
};
const releaseWarehouse = async (sale_id: string) => {
  return new Promise((res) => setTimeout(res, 300));
};
const cancelShipping = async (sale_id: string) => {
  return new Promise((res) => setTimeout(res, 300));
};
const cancelPayment = async (sale_id: string) => {
  return new Promise((res) => setTimeout(res, 300));
};

const sagaBackwardMachine = async (
  job: Job<Omit<ISagaJob, "step"> & { step: t.TSagaBackwardStep }>,
) => {
  const currentSagaStep = job.data.step;

  if (currentSagaStep === "initial_return") {
    console.log(`[$INITIAL_RETURN]: handling...`);

    await db.insert(t.saga_outbox).values({
      sale_id: job.data.sale_id,
      step: "in_payment_capture_return" satisfies t.TSagaBackwardStep,
    });

    console.log(`[$INITIAL_RETURN]: ✅ → in_payment_capture_return`);
  }

  if (currentSagaStep === "in_payment_capture_return") {
    console.log(`[$PAYMENT_CAPTURE_RETURN]: handling...`);

    await cancelPayment(job.data.sale_id);
    await db.insert(t.saga_outbox).values({
      sale_id: job.data.sale_id,
      step: "in_shipping_return" satisfies t.TSagaBackwardStep,
    });

    console.log(`[$PAYMENT_CAPTURE_RETURN]: ✅ → in_shipping_return`);
  }

  if (currentSagaStep === "in_shipping_return") {
    console.log(`[$SHIPPING_RETURN]: handling...`);

    await cancelShipping(job.data.sale_id);
    await db.insert(t.saga_outbox).values({
      sale_id: job.data.sale_id,
      step: "in_warehouse_reserve_return" satisfies t.TSagaBackwardStep,
    });

    console.log(`[$SHIPPING_RETURN]: ✅ → in_warehouse_reserve_return`);
  }

  if (currentSagaStep === "in_warehouse_reserve_return") {
    console.log(`[$WAREHOUSE_RETURN]: handling...`);

    await releaseWarehouse(job.data.sale_id);
    await db.insert(t.saga_outbox).values({
      sale_id: job.data.sale_id,
      step: "in_payment_authorize_return" satisfies t.TSagaBackwardStep,
    });

    console.log(`[$WAREHOUSE_RETURN]: ✅ → in_payment_authorize_return`);
  }

  if (currentSagaStep === "in_payment_authorize_return") {
    console.log(`[$PAYMENT_AUTHORIZE_RETURN]: handling...`);

    await releasePayment(job.data.sale_id);
    await db.insert(t.saga_outbox).values({
      sale_id: job.data.sale_id,
      step: "in_finalize_return" satisfies t.TSagaBackwardStep,
    });

    console.log(`[$PAYMENT_AUTHORIZE_RETURN]: ✅ → in_finalize_return`);
  }

  if (currentSagaStep === "in_finalize_return") {
    console.log(`[$FINALIZE_RETURN]: handling...`);

    await db.transaction(async (tx) => {
      await tx
        .update(t.orders)
        .set({
          step: "backward",
          status: "completed",
        })
        .where(d.eq(t.orders.id, job.data.sale_id));

      await tx.insert(t.saga_outbox).values({
        sale_id: job.data.sale_id,
        is_published: true,
        step: "completed_return" satisfies t.TSagaBackwardStep,
      });
    });

    console.log(`---SALE COMPENSATED ✅---`);
  }
};

const saga_forward_worker = new Worker("SAGA_FORWARD_QUEUE", sagaMachine, { connection });
const saga_backward_worker = new Worker("SAGA_BACKWARD_QUEUE", sagaBackwardMachine, {
  connection,
});

const startCompensation = async (params: {
  sale_id: string;
  step: t.TSagaForwardStep | t.TSagaBackwardStep;
}) => {
  await db.transaction(async (tx) => {
    await tx.insert(t.saga_outbox).values({
      sale_id: params.sale_id,
      step: (() => {
        if (params.step === "in_payment_authorize") return "in_payment_authorize_return";
        if (params.step === "in_warehouse_reserve") return "in_warehouse_reserve_return";
        if (params.step === "in_shipping") return "in_shipping_return";
        if (params.step === "in_payment_capture") return "in_payment_capture_return";
        if (params.step === "in_finalize") return "initial_return";
        return "initial_return";
      })(),
    });

    await tx
      .update(t.orders)
      .set({
        step: "backward",
        status: "pending",
      })
      .where(d.eq(t.orders.id, params.sale_id));
  });
};

saga_backward_worker.on("failed", async (job, err) => {
  if (!job) return;

  if (job.attemptsMade === 15 || err instanceof UnrecoverableError) {
    // insert to db and notify admins about incidinet
  }
});

saga_forward_worker.on("failed", async (job, err) => {
  if (!job) return;

  console.log("❌FAILED JOB❌", job.data.step);

  if (err instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts || 1)) {
    await startCompensation({ sale_id: job.data.sale_id, step: job.data.step });
  }
});
