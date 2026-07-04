import { connection } from "@/connection";
import { d, db } from "@learn-broker/db";
import * as t from "@learn-broker/db/schema/index";
import { Queue, UnrecoverableError, Worker } from "bullmq";

/**
 * Lesson 10 — a hand-rolled orchestrated Saga on the Lesson-9 outbox.
 *
 * Flow (happy path):   reserve → authorize → ship → capture → completed
 * Flow (compensation): …terminal failure… → compensating → void_auth → release_stock → cancelled
 *
 * The three ideas the lesson keeps repeating, made concrete:
 *   1. State lives in Postgres (saga_orders.status) — a durable state machine.
 *   2. Every transition is ONE atomic tx: update state + insert the next outbox row.
 *   3. A step classifies its own failure — transient (throw Error → BullMQ retries)
 *      vs permanent (throw UnrecoverableError → orchestrator runs the machine backward).
 */

// ── Queues ───────────────────────────────────────────────────────────────────
// Forward steps and compensations ride SEPARATE queues on purpose: a stuck
// compensation is real money not refunded, so it gets its own retry policy and
// its own alerting. (Lesson §5, "compensations are jobs too, and must never be lost".)
const forwardQueue = new Queue("saga-forward", { connection });
const compensateQueue = new Queue("saga-compensate", { connection });

const isCompensation = (step: string) => step === "void_auth" || step === "release_stock";

// ── Fake external services, with deterministic failure injection ─────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (id: string) => id.slice(0, 8);

// reserve stock → a reservation id (reversible: it's just a row we can delete)
async function reserveStock(order: typeof t.saga_orders.$inferSelect) {
  await sleep(50);
  return `res_${short(order.id)}`;
}

// authorize payment → a HOLD, NOT a capture (reversible: void the hold, no refund)
async function authorizePayment(order: typeof t.saga_orders.$inferSelect) {
  await sleep(50);
  return `auth_${short(order.id)}`;
}

// ship → the fork in the road. Same step, two failure classes, opposite responses.
async function ship(order: typeof t.saga_orders.$inferSelect, attemptsMade: number) {
  await sleep(50);
  // PERMANENT: retrying a thousand times never makes this address deliverable.
  if (order.address === "BLACKHOLE") {
    throw new UnrecoverableError("NON_DELIVERABLE — we don't ship there");
  }
  // TRANSIENT: carrier API is down; a retry with backoff will win.
  if (order.address === "FLAKY" && attemptsMade < 2) {
    throw new Error("CARRIER_503 — carrier API down, retry");
  }
  return true;
}

// capture → the point of no return, kept LAST so only transient failures remain.
async function capturePayment(order: typeof t.saga_orders.$inferSelect) {
  await sleep(50);
  return true;
}

// Compensations: semantic undos, each idempotent.
async function voidAuth(_authId: string) {
  await sleep(50); // release the HOLD — customer is never charged, so nothing to refund
}
async function releaseStock(_reservationId: string) {
  await sleep(50); // delete the reservation row → stock is available again
}

// ── The atomic transition (the outbox trick, Lesson 9) ───────────────────────
// Update the saga's state AND enqueue the next step in ONE transaction. If the
// process dies between them, neither happened — no half-advanced saga.
async function advance(
  orderId: string,
  patch: Partial<typeof t.saga_orders.$inferInsert>,
  next: (typeof t.saga_outbox.$inferInsert)["step"] | null,
) {
  await db.transaction(async (tx) => {
    await tx.update(t.saga_orders).set(patch).where(d.eq(t.saga_orders.id, orderId));

    if (next) {
      await tx.insert(t.saga_outbox).values({ orderId, step: next, payload: {} });
    }
  });
}

// ── Forward worker: drive the machine forward one step at a time ─────────────
// Each step is idempotent: it first checks the saga is in the expected state and
// no-ops if a duplicate job already advanced it.
const forwardWorker = new Worker(
  "saga-forward",
  async (job) => {
    const { orderId, step } = job.data as { orderId: string; step: string };
    const [order] = await db
      .select()
      .from(t.saga_orders)
      .where(d.eq(t.saga_orders.id, orderId));
    if (!order) throw new UnrecoverableError("order vanished");

    switch (step) {
      case "reserve": {
        if (order.status !== "created") return; // already reserved
        const reservationId = await reserveStock(order);
        await advance(orderId, { status: "reserved", reservationId }, "authorize");
        console.log(`  ✔ reserved   ${short(orderId)}  → authorize`);
        return;
      }
      case "authorize": {
        if (order.status !== "reserved") return;
        const authId = await authorizePayment(order);
        await advance(orderId, { status: "authorized", authId }, "ship");
        console.log(`  ✔ authorized ${short(orderId)}  (HOLD placed) → ship`);
        return;
      }
      case "ship": {
        if (order.status !== "authorized") return;
        await ship(order, job.attemptsMade); // may throw transient OR unrecoverable
        await advance(orderId, { status: "shipped" }, "capture");
        console.log(`  ✔ shipped    ${short(orderId)}  → capture`);
        return;
      }
      case "capture": {
        if (order.status !== "shipped") return;
        await capturePayment(order); // point of no return — money moves here
        await advance(orderId, { status: "completed", captured: true }, null);
        console.log(`  ✔ captured   ${short(orderId)}  → COMPLETED 🎉`);
        return;
      }
    }
  },
  { connection, concurrency: 5 },
);

// The orchestrator's decision point: forward step failed — retry, or go backward?
forwardWorker.on("failed", async (job, err) => {
  if (!job) return;
  const permanent =
    err instanceof UnrecoverableError || err.name === "UnrecoverableError";
  const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
  const terminal = permanent || exhausted; // permanent now, or transient forever

  console.log(
    `  ✗ ${job.data.step} failed (attempt ${job.attemptsMade}): ${err.message}` +
      (terminal ? "  → COMPENSATE" : "  → will retry"),
  );

  // Transient with attempts left: let BullMQ's backoff handle it. Do nothing.
  if (terminal) await beginCompensation(job.data.orderId as string);
});

// ── Begin compensation: flip to reverse ──────────────────────────────────────
// Set status=compensating and enqueue the completed steps' undos IN REVERSE.
// Idempotent: a second call (e.g. after a crash) sees status already changed and no-ops.
async function beginCompensation(orderId: string) {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(t.saga_orders)
      .where(d.eq(t.saga_orders.id, orderId))
      .for("update");
    if (!order) return;
    if (["compensating", "cancelled", "completed"].includes(order.status)) return;

    await tx
      .update(t.saga_orders)
      .set({ status: "compensating" })
      .where(d.eq(t.saga_orders.id, orderId));

    // Reverse of reserve → authorize is: void the auth first, then release stock.
    if (order.authId)
      await tx.insert(t.saga_outbox).values({ orderId, step: "void_auth", payload: {} });
    if (order.reservationId)
      await tx
        .insert(t.saga_outbox)
        .values({ orderId, step: "release_stock", payload: {} });
  });
  console.log(`  ↩ compensating ${short(orderId)} → void_auth, release_stock`);
}

// ── Compensate worker: run the undos, then land on cancelled ─────────────────
// Every branch is idempotent — it only undoes what's still outstanding (authId /
// reservationId not yet null), so a re-delivered job is a harmless no-op.
const compensateWorker = new Worker(
  "saga-compensate",
  async (job) => {
    const { orderId, step } = job.data as { orderId: string; step: string };
    const [order] = await db
      .select()
      .from(t.saga_orders)
      .where(d.eq(t.saga_orders.id, orderId));
    if (!order) return;

    if (step === "void_auth" && order.authId) {
      await voidAuth(order.authId);
      await db
        .update(t.saga_orders)
        .set({ authId: null })
        .where(d.eq(t.saga_orders.id, orderId));
      console.log(`  ✔ void_auth     ${short(orderId)} (hold released, no refund)`);
    }

    if (step === "release_stock" && order.reservationId) {
      await releaseStock(order.reservationId);
      await db
        .update(t.saga_orders)
        .set({ reservationId: null })
        .where(d.eq(t.saga_orders.id, orderId));
      console.log(`  ✔ release_stock ${short(orderId)} (reservation deleted)`);
    }

    await maybeFinishCancel(orderId);
  },
  { connection, concurrency: 5 },
);

// When every hold is undone, the saga is fully cancelled.
async function maybeFinishCancel(orderId: string) {
  await db.transaction(async (tx) => {
    const [o] = await tx
      .select()
      .from(t.saga_orders)
      .where(d.eq(t.saga_orders.id, orderId))
      .for("update");
    if (o && o.status === "compensating" && !o.authId && !o.reservationId) {
      await tx
        .update(t.saga_orders)
        .set({ status: "cancelled" })
        .where(d.eq(t.saga_orders.id, orderId));
      console.log(`  ⛔ CANCELLED   ${short(orderId)} (captured=${o.captured})`);
    }
  });
}

// A compensation that exhausts its (many) retries is an INCIDENT, not a log line.
compensateWorker.on("failed", (job, err) => {
  if (!job) return;
  if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
    console.error(
      `🚨 INCIDENT — compensation ${job.data.step} for ${job.data.orderId} ` +
        `failed permanently: ${err.message} — PAGE A HUMAN`,
    );
  }
});

// ── The relay: drain saga_outbox into the right queue (Lesson 9) ─────────────
let relayTimer: ReturnType<typeof setInterval> | null = null;

async function relayOnce() {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(t.saga_outbox)
      .where(d.eq(t.saga_outbox.published, false))
      .for("update", { skipLocked: true });

    for (const row of rows) {
      const comp = isCompensation(row.step);
      const queue = comp ? compensateQueue : forwardQueue;
      await queue.add(
        row.step,
        { orderId: row.orderId, step: row.step },
        {
          jobId: `${row.step}_${row.orderId}`, // idempotent enqueue
          attempts: comp ? 50 : 5, // compensations retry HARD
          backoff: { type: "exponential", delay: comp ? 1000 : 200 },
          removeOnComplete: true,
        },
      );
      await tx
        .update(t.saga_outbox)
        .set({ published: true })
        .where(d.eq(t.saga_outbox.id, row.id));
    }
  });
}

// ── Public API used by the demo ──────────────────────────────────────────────
export async function createSagaOrder(input: { total: number; address: string }) {
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(t.saga_orders)
      .values({ total: input.total, address: input.address, status: "created" })
      .returning();
    if (!order) throw new Error("failed to create saga order");
    await tx
      .insert(t.saga_outbox)
      .values({ orderId: order.id, step: "reserve", payload: {} });
    return order;
  });
}

export function startRelay() {
  relayTimer = setInterval(() => {
    relayOnce().catch((e) => console.error("relay error", e));
  }, 250);
}

export async function closeSaga() {
  if (relayTimer) clearInterval(relayTimer);
  await forwardWorker.close();
  await compensateWorker.close();
  await forwardQueue.close();
  await compensateQueue.close();
  await connection.quit();
}
