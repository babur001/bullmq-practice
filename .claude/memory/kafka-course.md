---
name: kafka-course
description: Kafka & Event-Driven Architecture course lives in learn/kafka/ in the learn-broker repo
metadata: 
  node_type: memory
  type: project
  originSessionId: 02fe58da-2b2a-4129-91a6-5e9114375e3d
---

After finishing the [[learn-broker-course]] (queues/BullMQ, through Saga at lesson 10), the user started a **Kafka & Event-Driven Architecture** course in the same repo, at `learn/kafka/`. Started 2026-07-03.

**Stack/infra (already set up & verified working):**
- `apache/kafka:3.9.0` in **KRaft mode** (no Zookeeper) + `kafbat/kafka-ui`, added to `packages/db/docker-compose.yml`. Start via `pnpm db:start`. Broker on `localhost:9092`, UI on `http://localhost:8080`.
- Kafka compose gotcha (already solved): use quoted listener values and empty-host bind form `CONTROLLER://:9093,HOST://:9092,DOCKER://:19092` with advertised `HOST://localhost:9092,DOCKER://kafka:19092`; using `0.0.0.0` in listeners makes the image reject `advertised.listeners`.
- `kafkajs` installed in `apps/server`. `KAFKA_BROKERS` (default `localhost:9092`) added to `packages/env/src/server.ts` and `apps/server/.env`.
- Run lesson files with `pnpm --filter server exec tsx apps/server/src/kafka/<file>.ts`.

**Format:** numbered markdown lessons (Concept → diagram → Walkthrough → Exercise), Socratic step-by-step, invest in SVG/interactive-HTML visuals only for hard concepts. `learn/kafka/README.md` has the ~11-lesson roadmap. Same teaching prefs — see [[course-teaching-style]], [[user-prefers-readable-reviewable-formats]]. **Visuals: the Kafka course has its OWN design system ("Ink & Signal"), NOT the BullMQ palette** — see [[course-visual-style]] and `learn/visuals/kafka/_design-system.md`.

**Where left off (2026-07-11):** Lessons 01–02 done + reviewed. Lesson 02 exercise reviewed (severity): user's `send-message.ts` proved keyed ordering (room-2 both → partition 0, offsets 33→34) and keyless no-global-order (ORDER-1..6 round-robined 2/0/1 across partitions); key gaps flagged — consumer never prints `message.key`, `ZmessageSchema` validated but ignored (dead code), skew not measured, and mini-challenge Q2/Q3 punted (Q2 = `idempotent:true` on producer; Q3 = single-partition = global order at cost of all parallelism). Confirmed from installed kafkajs@2.2.4 source: `idempotent` forces `acks:-1` (throws otherwise), bumps retries→~∞, does `initProducerId` on connect; KafkaJS does NOT clamp maxInFlightRequests for idempotence (broker seq-numbers preserve order); `maxInFlightRequests` is a client-level (not producer) option.

**Lesson 03 written (2026-07-11):** `03-consuming-groups-rebalancing.md` (consumer groups = queue⊕topic duality, partition = unit of parallelism & ceiling, `__consumer_offsets`, commit-before/after → delivery semantics, rebalancing eager vs cooperative, sessionTimeout/heartbeat storms, duplicates around rebalance) + interactive visual `learn/visuals/kafka/03-consumer-groups.html` (Consumer Group Console). KafkaJS 2.2.4 facts baked in: default assigner `roundRobin` (EAGER, no cooperative), sessionTimeout 30s / heartbeatInterval 3s, autoCommit true commits after handler resolves (at-least-once), `GROUP_JOIN.memberAssignment` shows a member's partitions.

**Lesson 03 reviewed/PASSED (2026-07-17):** User experimented heavily (built a poison-pill `throw` in `message-listener.ts` → discovered at-least-once redelivery + head-of-line blocking), so solution code was partly overwritten — Lesson 03 is mostly a *runtime* lesson (captures, not code). Mini-challenge answers were solid: got the core idea (**idempotent handler** is the answer to at-least-once). Sharpened 3 precision points: (a) Ctrl+C = graceful LeaveGroup → *immediate* rebalance, only ungraceful death waits sessionTimeout; a 2s sleep times nothing out; (b) rebalance "storm" = cascading re-kicks, not one kick; (c) mini#3 asked about a consumer *joining* (no crash) causing dups, they tested *leaving* — same mechanism. Lingering nit: `message-analyze-listener.ts` still doesn't print `message.key`.

**Lesson 04 written (2026-07-18):** `04-idempotent-transactional-producers.md` — delivery semantics / exactly-once. Covers: producer-side duplicates (lost ack → retry → double write); **idempotent producer** (PID + per-partition sequence number, broker drops repeats — user already has `idempotent:true`); read-process-write problem; **transactions** (`transactionalId` + `sendOffsets` commits offset inside the tx = all-or-nothing across topics+offsets); `readUncommitted` consumer flag (KafkaJS default false = read-committed); honest limit — exactly-once is Kafka-internal only, external side-effects (DB/email) need idempotent handler (ties back to [[learn-broker-course]] outbox). Written **shorter + simpler English per explicit user request.** No interactive HTML visual yet (offered, not built) — inline Mermaid only. "Go deeper" per [[lesson-go-deeper-refs]] (Maarek EOS section + Confluent Narkhede EOS article + KafkaJS transactions docs). **Now awaiting the user's Lesson 04 exercise.** Next: Lesson 05 — retention & log compaction.
