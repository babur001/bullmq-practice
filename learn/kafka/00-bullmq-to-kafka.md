# BullMQ → Kafka — Translation Sheet

A pre-flight reference, not a lesson. You spent 11 lessons building intuition on **Redis +
BullMQ**; most of it transfers, some of it *actively lies to you*. This sheet maps the
vocabulary you own onto Kafka's, then marks the three danger zones: **false friends** (same
word, different meaning), **new muscles** (no BullMQ equivalent), and **what you'll rebuild**
(things BullMQ gave you free that Kafka makes you assemble).

Read it once now. Come back to it whenever a Kafka concept feels slippery — odds are it's a
place the queue mental model is fighting you.

## The one sentence to hold onto

> A BullMQ **queue is a to-do list**: a job is claimed by one worker and *deleted* when done.
> A Kafka **topic is a ledger**: an event is *appended* and *retained*, and any number of
> independent readers replay it at their own pace.

Everything below is a consequence of that one inversion. When a mapping surprises you, trace
it back to this line.

## 1. Vocabulary — side by side

| BullMQ | Kafka | The catch |
| ------ | ----- | --------- |
| Queue | **Topic** | A topic is a *retained log*, not a drain. Reading doesn't remove. |
| *(none)* | **Partition** | New. A topic is split into N ordered shards. The unit of parallelism *and* of ordering. |
| Job | **Record** / event / message | Data + optional **key**. No lifecycle state attached (see below). |
| Redis (the broker) | **Broker** / cluster | Kafka broker(s) store the log on disk for a retention window. |
| `queue.add(name, data)` | `producer.send({ topic, messages })` | Append, don't enqueue. |
| `new Worker(name, fn, { concurrency })` | `consumer.run({ eachMessage })` in a **group** | Parallelism comes from partitions, not a number you pick. |
| Job state `completed`/`failed` (broker-tracked) | **Offset** (consumer-tracked) | *The* inversion. Broker tracks nothing per-job; you track your position. |
| `jobId` / deduplication | Message **key** + **idempotent producer** | Key routes + orders; idempotency is still partly yours. |
| `removeOnComplete` / `removeOnFail` | **Retention** (`retention.ms`, `retention.bytes`) | Kafka keeps events for a *time/size* window regardless of who read them. |
| `attempts` + `backoff` | *DIY* — consumer retry + **retry topics** / DLQ topic | No durable per-job retry built in. |
| Dead Letter Queue | **DLQ topic** (you build it) | Same pattern, no framework — you produce failures to another topic. |
| `delay` / delayed jobs | *DIY* — delay topics / external scheduler | Kafka has **no** native delayed delivery. |
| `repeat` / cron jobs | *DIY* — external scheduler produces | No native repeatables. |
| `priority` | *DIY* — separate topics | A partition is strict append order; no reordering. |
| `QueueEvents` / pub-sub fan-out | *Built in* — every topic is pub-sub | Add a **new consumer group** → it gets *all* events. |
| `FlowProducer` (parent/child jobs) | *DIY* — app logic / Kafka Streams | No native job graphs. |
| `job.updateProgress()` / return value / `await` result | *(none)* | Fire-and-forget append; no per-record progress or return channel. |
| `getJobCounts()` / waiting depth | **Consumer lag** (`log-end-offset − committed-offset`) | You don't count jobs; you measure how far behind a group is. |
| Bull Board | **Kafka UI** — http://localhost:8080 | Same role: topics, partitions, groups, offsets, lag. |
| Rate limiter (`limiter`) | Quotas / `max.poll.records` / manual pacing | Backpressure is your pull rate, not a broker throttle. |

## 2. The same operation in both

**Produce.** BullMQ enqueues a job; Kafka appends a record. The *shape* is nearly identical —
the meaning is not.

```ts
// BullMQ — enqueue a job someone will DO, then it's gone
await queue.add("email", { to: "u1", subject: "hi" }, { jobId: "u1-welcome" });

// Kafka — append an event that STAYS, keyed for ordering + routing
await producer.send({
  topic: "email.requested",
  messages: [{ key: "u1", value: JSON.stringify({ to: "u1", subject: "hi" }) }],
});
```

**Consume.** BullMQ hands you a job and *removes* it on success. Kafka hands you a record and
you *advance your own bookmark*.

```ts
// BullMQ — success removes the job; throw → retry per `attempts`
new Worker("email", async (job) => {
  await send(job.data);            // done → job deleted from the queue
});

// Kafka — record stays forever (within retention); "commit" only moves YOUR offset
consumer.run({
  eachMessage: async ({ partition, message }) => {
    await send(JSON.parse(message.value.toString()));
    // offset auto-commits; the record is still there for every OTHER group
  },
});
```

Read those two consume blocks until the difference feels physical: in BullMQ the broker
*forgets* the job; in Kafka *you* remember where you were, and the log forgets nothing until
retention expires.

## 3. Mental-model shifts (the deltas that matter)

1. **Consume ≠ delete.** BullMQ: broker owns truth, deletes on complete. Kafka: log retains,
   *consumer* owns position. This is the seed of replay, multi-consumer, and event sourcing.
2. **One topic serves many independent readers.** In BullMQ, one worker claims each job. In
   Kafka you get *both* behaviors from one primitive: consumers **within a group** compete
   (each partition to one member), but **every group** reads the whole topic. Queue ⊕ topic.
3. **Parallelism is capped by partitions.** BullMQ: bump `concurrency` to 50, done. Kafka: a
   partition is read by *at most one consumer in a group* — so a 3-partition topic maxes out
   at 3-way parallel reads *per group*, no matter how many consumers you add.
4. **Order is per-partition, never per-topic.** BullMQ ordering was already fuzzy under
   concurrency; Kafka makes the rule explicit and hard — strict order *within a partition*,
   no guarantee across them. The **key** decides which partition, so *same key → same
   partition → ordered*.
5. **Retries, backoff, delays, priorities: assume nothing is built in.** These were
   first-class BullMQ options. In Kafka they're patterns *you* assemble (retry topics, delay
   topics, DLQ topics, external schedulers). Budget for it.
6. **Idempotency is still your job — and you already know why (Lesson 07).** Kafka's
   idempotent + transactional producer removes *producer-side* duplicates; it does **not**
   make your *consumer* idempotent. "Exactly-once" is still mostly "at-least-once + a dedup
   key you own."
7. **Durability window flips.** BullMQ: a job is durable *until processed*, then gone. Kafka:
   an event is durable *for the retention window*, whether or not anyone read it — and gone
   after, whether or not everyone read it.

## 4. False friends (same word, different meaning) ⚠️

These will bite precisely *because* the word is familiar.

| Word | In BullMQ you learned… | In Kafka it means… |
| ---- | ---------------------- | ------------------ |
| **Consumer / worker** | Competes for jobs, removes them | Competes *inside its group*, but every group independently reads everything |
| **Commit / ack** | Finishing a job = it's done and gone | **Committing an offset only advances your read bookmark.** It says *nothing* about whether downstream work succeeded — commit before your work finishes and a crash means you *skip* the record. |
| **Retry** | Durable, broker-managed, `attempts` + backoff | KafkaJS retries are *in-memory and blocking* the partition; durable retry = a retry *topic* you build |
| **Offset** | *(didn't exist)* | Your per-partition read cursor — the single most important new number |
| **Group** | *(a set of workers, interchangeable)* | A named, *persistent* identity whose committed offsets survive restarts (this is why `fromBeginning` "doesn't work" the second time) |

The **commit** row is the one that causes real bugs. Map it to Lesson 04's *read-process-write*
and exactly-once discussion — offset commit timing *is* the delivery-semantics knob.

## 5. New muscles — no BullMQ equivalent, learn from zero

- **Partitions** — how a topic scales and orders (Lesson 02).
- **Offsets & consumer-owned position** — replay, `fromBeginning`, `auto.offset.reset`.
- **Consumer-group rebalancing** — partitions reassign live when members join/leave (Lesson 03).
- **`acks` (0 / 1 / all)** — producer-side durability vs latency trade-off (Lesson 02).
- **Log compaction** — keep only the latest value per key; tombstones (Lesson 05).
- **Schema registry & contracts** — versioned, compatible event shapes (Lesson 06).

## 6. What you'll rebuild — BullMQ gave these free

If you reach for one of these out of habit, stop: in Kafka it's a pattern, not a feature.

- **Delayed / scheduled delivery** → delay topics or an external scheduler.
- **Per-job retry + backoff** → retry topics with increasing delay, then a DLQ topic.
- **Priorities** → separate topics (a partition won't reorder).
- **Per-job progress / return value / `await` the result** → gone; append a *result event* to
  another topic and consume that instead.
- **Rich per-job state UI** → Kafka UI shows *lag and offsets*, not "job 42 is retrying."

## 7. 60-second self-check (answer before Lesson 01)

1. In BullMQ, two workers on one queue split the jobs. In Kafka, two **consumers in one
   group** on a 1-partition topic — what does the second one do? *(Hint: partition ⇒ one
   reader.)*
2. You want the same events to feed *both* billing *and* analytics, each seeing all of them.
   BullMQ made you choose queue-vs-topic and wire fan-out. In Kafka, what's the entire
   mechanism? *(One noun.)*
3. A worker finishing a job in BullMQ ≈ committing an offset in Kafka. Name one scenario where
   that analogy causes a **lost message**, and one where it causes a **duplicate**.

If #3 comes easily, you've already internalized the delivery-semantics thread that runs
through Lessons 02–04. If it doesn't yet — good, that's the point of the course.

→ Now start **`01-the-log.md`**.
