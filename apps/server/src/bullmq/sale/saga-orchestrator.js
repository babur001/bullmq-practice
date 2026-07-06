// ─────────────────────────────────────────────────────────────────────────────
// USAGE SKETCH (wishful thinking) — NOT implemented yet.
// Goal: replace the hand-written if-chains in saga-orchestration.ts with a
// declarative step list. Declare the steps ONCE; the orchestrator derives the
// forward transition table AND the backward (compensation) mirror.
// This file is the "call site as I wish it existed". We build to match it next.
// ─────────────────────────────────────────────────────────────────────────────

// 1. A STEP owns its forward action + how to undo it (co-located, unlike today
//    where forward lives in sagaMachine and undo lives in sagaBackwardMachine).
//
//    DESIGN DECISION #1 — how is a step defined?
//    Going class-based here to match your capitalized `addStep(PaymentAuthorize)`.
//    Each step maps 1:1 to a DB step enum via `name`.

class PaymentAuthorize extends SagaStep {
  name = "payment_authorize"; // ⟶ DB step "in_payment_authorize" / "in_payment_authorize_return"

  async execute(ctx) {
    // ctx = { sale_id, region, saga_outbox_id, log, signal }
    await authorizePayment(ctx.sale_id);
  }

  async compensate(ctx) {
    await releasePayment(ctx.sale_id);
  }
}

class WarehouseReserve extends SagaStep {
  name = "warehouse_reserve";

  async execute(ctx) {
    await reserveWarehouse(ctx.sale_id); // this is the one that randomly fails today
  }

  async compensate(ctx) {
    await releaseWarehouse(ctx.sale_id);
  }
}

class ShipmentInit extends SagaStep {
  name = "shipping";
  async execute(ctx) {
    await handleShipping(ctx.sale_id, ctx.region);
  }
  async compensate(ctx) {
    await cancelShipping(ctx.sale_id);
  }
}

// interface SagaContext {
//     abort: () => Promise // it halts the forward, and starts compensation immediately wherever we stop
// }

class PaymentCapture extends SagaStep {
  name = "payment_capture";
  async execute(ctx) {
    await handlePaymentCapture(ctx.sale_id);
  }
  async compensate(ctx) {
    await cancelPayment(ctx.sale_id);
  }
}

class Notify extends SagaStep {
  name = "notify";
  async execute(ctx) {
    ctx.log("notifying customer…");
  }
  // no compensate() → nothing to undo for a notification (terminal-ish step)
}

// 2. BUILD the saga: one ordered declaration, forward + backward both derived.
const saga = new SagaOrchestrator({
  maxRetries: 15,
  retryDelay: 1000,
  retryMechanism: "exponential", // ⟶ maps to BullMQ backoff { type: "exponential", delay }
  onStepComplete: (name) => console.log(`✅ Completed: ${name}`),
  onCompensate: (name) => console.log(`↩️  Compensating: ${name}`),
});

saga
  .addStep(PaymentAuthorize)
  .addStep(WarehouseReserve)
  .addStep(ShipmentInit)
  .addStep(PaymentCapture)
  .addStep(Notify);

// 3. RUNTIME — DESIGN DECISION #2 (the big one):
//    The orchestrator does NOT run steps in-process. It plugs into the durable
//    infra you already have (saga_outbox → relay → BullMQ workers). `.start()`
//    replaces sagaMachine + sagaBackwardMachine + the failure→startCompensation
//    handlers — the orchestrator generates all of that from the step list.
saga.start(); // boots the forward + backward workers, wires failure→compensation

// 4. KICK OFF a saga transactionally. Replaces the manual `saga_outbox` insert
//    in create-sale.use-case.ts. Runs inside the caller's tx so the order row
//    and the "initial" outbox row commit atomically (keeps your outbox guarantee).
//
//    const { sale_id } = await saga.begin({ region: "Tashkent" }, tx);
//
//    DESIGN DECISION #3 — does begin() create the order row too, or does the
//    caller create it and just hand the sale_id to the saga? (leaning: caller
//    owns the order, saga.begin() only writes the first outbox row.)

export { saga };
