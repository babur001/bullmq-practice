---
name: learn-broker-course
description: How the learn-broker project teaches brokers/queues and how the user wants lessons delivered
metadata:
  node_type: memory
  type: project
  originSessionId: 8b41629e-92fe-4f59-912e-cdd652a3442d
---

`learn-broker` is a learning project: the user is learning brokers, queues, and
event-driven architecture **from scratch** (new to it). Concrete tool stack chosen:
**Redis + BullMQ** first (concepts to transfer to RabbitMQ/Kafka/NATS later).

Delivery format the user wants (they found inline file-editing + chat-only guided
exercises hard to follow/review):

- Lessons live as numbered markdown files in `learn/` with **Mermaid diagrams**.
- Each lesson: Concept → Diagram → annotated Walkthrough → Exercise.
- **The user writes the exercise code; I review it.** Don't write the exercise
  solution unless they're stuck or ask.

Roadmap is in `learn/README.md` (11 lessons; Lesson 11 Observability/Bull Board is the finale).

Progress:

- Lesson 01 (first Queue + Worker): ✅ passed. User's code in `apps/server/src/`
  (connection.ts, broker.ts, producer.ts, worker.ts). Strong grasp — independently
  derived the at-least-once + idempotent-consumer = effectively-once idea, and that
  custom jobId dedups on enqueue while BullMQ's lock is only best-effort (lease/TTL,
  breaks on stall/crash). exactly-once delivery is impossible.
- Lesson 02 (job lifecycle & data): ✅ passed. Files in `apps/server/src/math/`.
  Nailed the snapshot-vs-refetch subtlety (job.returnvalue is cached, getState is
  live). Review flagged 3 fixes: used `error` event instead of `failed` (must fix —
  load-bearing for L03); one-shot scripts hang (need close()/process.exit); duplicate
  Redis connection (prefer shared @/connection). Also discussed Express connection
  lifecycle: create Queue/QueueEvents once at startup, close only on SIGTERM/SIGINT,
  Worker runs as a separate process.
- Lesson 03 (failures & retries): ✅ done (flaky/). Backoff verified live (2s/4s
  gaps); waitUntilFinished rejection caught; inspect uses getFailed()+failedReason.
  IMPORTANT correction discovered while reviewing: worker 'failed' fires on EVERY
  failed attempt; only QueueEvents 'failed'/'retries-exhausted' mean final failure.
  Lesson 03 file corrected with an event table. Accidental live demo of competing
  consumers (user's + my worker split jobs 22/23).
  CARRIED-OVER cleanups, now graded as house rules in Lesson 04: scripts still hang
  (no close/exit — recurring nemesis, 3 lessons running), flaky.queue still imports
  @/math/redis-connection, QueueEvents created without connection, alwaysFail job
  has attempts:1, worker's transient-failure branch deleted.
- Lesson 04 (delays & scheduling): ✅ done (reminder/ — files r.queue/r.worker/
  r.delayed/r.promote/r.scheduler). Concepts solid (idempotent upsert, delayed=same
  state/machinery for backoff vs delay). Real teaching moment: user left an ORPHAN
  scheduler ticking (296+ completed) because r.scheduler had a bare top-level
  process.exit(0) that ran synchronously before the setTimeout cleanup could fire +
  removeJobScheduler was commented out. Taught: sync code runs to completion before
  any timer callback; let pending work finish then exit, never exit() out from under
  your own callbacks. Cleaned up via removeJobScheduler. User fixed & reran — works.
- Lesson 05 (concurrency & scaling): written (learn/05-concurrency-scaling.md) +
  FIRST hard-concept interactive visual at learn/visuals/05-concurrency.html
  (standalone HTML: set workers×concurrency, toggle I/O vs CPU-bound, watch 12 jobs
  flow through slots + Gantt; CPU mode shows extra slots go amber/blocked = single
  event loop). Two knobs: concurrency (async, within 1 worker, helps I/O only) vs
  worker processes (real parallelism, helps CPU). limiter for rate-limiting; ordering
  lost when concurrency>1. Exercise: scale/ folder, Parts A (I/O concurrency wall-clock
  CC=1 vs 5) B (two worker processes competing) C (CPU-bound trap predict+verify)
  D (rate-limit think). ✅ done (scale/ — s.queue/s.worker/s.producer). Verified live:
  CC=1→10s, CC=5→2s for 10×1s I/O jobs. Bug found: user left a live Part-D Worker
  (empty body) in s.worker.ts → two consumers competed, phantom ate jobs (5 started,
  8 completed). Concepts all correct. KEY INSIGHT user discovered: BullMQ `limiter`
  is GLOBAL across all worker processes (Redis-coordinated counter), does NOT multiply
  with process count — unlike `concurrency` which is per-process and multiplies
  (workers×concurrency). Old Bull v3 limiter was per-worker; modern BullMQ made it
  global. Taught missing CPU-parallelism answer: sandboxed processors (pass file path
  → BullMQ forks child-process pool) or worker_threads.
- Lesson 06 (dead letter queues): written (learn/06-dead-letter-queues.md). VERIFIED
  EMPIRICALLY (test on dlqtest queue): worker 'failed' event fires on EVERY attempt
  (3× for attempts:3); QueueEvents 'failed' fired once + 'retries-exhausted' once.
  So DLQ routing MUST detect terminal failure via `job.attemptsMade >= job.opts.attempts`
  else you dead-letter a job N times. DLQ = dedicated 2nd queue (parking lot, usually
  NO auto-worker) vs the passive `failed` set. Cross-broker: RabbitMQ DLX / Kafka
  dead-letter topic are native; BullMQ you build it. Exercise: orders/ pipeline,
  Parts A (route terminal failure → orders-dlq with metadata+data) B (inspect DLQ)
  C (replay: re-add data to main queue after simulated fix) D (think: DLQ auto-worker?).
  ✅ done (pay/). Guard verified: ledger:charges stays 1 across retries & duplicate
  deliveries. Fixed their bug: `set(key,1,"EX","NX")` → EX needs integer seconds
  (use `set(key,1,"NX")`). User's insight: typed Queue<T>/Worker<T> would catch these
  at compile time.
- BEYOND L07: user has jumped ahead (partly via Cursor) — lessons 08 events-pubsub,
  09 transactional-outbox, 10 saga, 11 observability-dashboard exist in learn/, plus a
  Kafka course in learn/kafka/. lesson-9/ has a Postgres transactional-outbox + relay
  (create-sale.ts writes order+saga+outbox in ONE db tx ✅; relay.ts polls outbox
  FOR UPDATE SKIP LOCKED). Their code is CHOREOGRAPHY (payments.worker directly
  enqueues shipping+notify) but they ASKED about ORCHESTRATION (central saga worker +
  compensation). Clarified the distinction. Their relay bug (they spotted it): `published`
  conflates "enqueued" vs "handled" — relay should mark published=true right after
  enqueue; consumer idempotency + DLQ handle the rest.
  BUILT a WORKING runnable saga orchestrator: apps/server/src/saga/saga.demo.ts
  (Redis-only, self-contained). Ran live: SALE-A happy→COMPLETED, SALE-B fails at
  arrange-shipping→compensates refund+release-stock in REVERSE→FAILED. Orchestrator =
  saga.reply Worker (concurrency 1), state machine in Redis, terminal-failure guard.
  NOTE: BullMQ custom jobId cannot contain ":" (use "\_\_").
- Lesson 10 (saga): ✅ DONE. User hand-rolled their OWN orchestrated saga in
  `apps/server/src/sale/` (not my saga.demo.ts): saga-orchestration.ts (forward
  `sagaMachine` + backward `sagaBackwardMachine`, both driven by a saga_outbox chain —
  compensation modeled as a MIRROR saga of `_return` steps unwinding in reverse),
  outbox-saga-relay.ts (routes forward vs backward by `orders.step`), create-sale.use-case.ts,
  saga-queues.ts (SAGA_FORWARD_QUEUE attempts 15 / SAGA_BACKWARD_QUEUE attempts 50).
  Schema in packages/db: orders(step forward|backward, status pending|completed) +
  saga_outbox(step, sale_id, is_published). Took ~4 review iterations. Strong conceptual
  grasp: atomic state+outbox transitions, transient(Error)→retry vs permanent
  (UnrecoverableError)→compensate, reverse-order idempotent compensations, per-step Redis
  NX idempotency. Recurring bug across iterations: `update(orders)` WITHOUT `.where()` →
  clobbers ALL orders (fixed in advance/startCompensation; may still lurk in the backward
  terminal). Idempotency guard is INVERTED (`SET NX GET` returns null on first acquire, so
  `if(result)` does work only on dupes) — masked b/c return unused. No `cancelled` status
  (compensated order ends `completed`+step=backward). We agreed: goal was UNDERSTANDING the
  pattern (achieved), NOT a prod-grade durable engine — the prod layer (reconciler/backstop,
  durable idempotency, self-describing outbox, DLQ alerts) is literally what Temporal/Step
  Functions sell. Did NOT force prod hardening.
- Lesson 11 (observability / Bull Board): ✅ DONE — **BullMQ course COMPLETE (11/11)**.
  Dashboard plumbing done (apps/server/src/dashboard.ts — read-only Queue handles by name;
  user already added SAGA_FORWARD_QUEUE/SAGA_BACKWARD_QUEUE). Verified live: Redis healthy,
  `pnpm --filter server dev` → http://localhost:3000/admin/queues returns 200. User closed
  this out via prior hands-on Bull Board use (didn't submit a fresh saga-through-dashboard
  writeup — comfortable from earlier lessons). Reflect Qs graded: Q1 (kill worker mid-job)
  corrected — job stays in `active`/STALLED for up to ~lockDuration/stalledInterval (30s
  default), stalled-checker detects expired lock → moves to `waiting` → re-picked (maxStalled
  Count 1 → else failed); the Lesson-07 best-effort-lease point. Q2 (promote) sharpened —
  delayed jobs live in a Redis ZSET scored by due-ts; promote MOVES the job out of `delayed`
  into the `wait` list (not editing a date). Q3 (waiting climbs, active flat) correct —
  producers outpace consumers; raise concurrency (I/O only) / add worker processes (CPU).
  NOTE: never wired a combined dashboard+engine runner; nothing imports the saga workers/relay.
- NEXT: Kafka course in learn/kafka/ — Lesson 01 (`01-the-log.md`) is WRITTEN but the
  EXERCISE IS NOT DONE yet. Next step = user reads L01 and completes its exercise (build a
  replayable event stream, prove replay via a new consumer group); then I review. NOT on
  Lesson 02 yet. See [[kafka-course]].

Infra already set up: Redis in Docker (`localhost:6379`, via `packages/db/docker-compose.yml`,
`pnpm db:start`), `bullmq` + `ioredis` in `apps/server`, `REDIS_URL` in
`packages/env/src/server.ts`. Postgres image pull timed out once — not needed for
broker lessons yet.

See [[user-prefers-readable-reviewable-formats]].
