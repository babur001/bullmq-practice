# Lesson 08 — Events & Pub/Sub (queue vs. topic)

Everything you've built so far answers one question: **"who does this work?"** A job
goes on a queue, exactly one worker pulls it, the work happens once. That's the right
model for _work_.

But real systems have a second question that the queue model can't answer: **"who needs
to _know_ this happened?"** When a payment succeeds, maybe four different things should
react — email a receipt, decrement inventory, notify shipping, update analytics. Those
aren't one piece of work with one owner. They're four independent reactions to one
_event_.

This lesson is about that second question, and the single most important distinction in
event-driven systems: **a queue is not a topic.** Get this distinction and a huge amount
of architecture suddenly has obvious answers.

---

## 1. The problem, concretely

Start from something you already feel the friction of. Your producer enqueues a charge
and wants to know when it finished — but the worker runs in a **different process**. How
does the producer find out the result?

Your first instinct is probably to poll:

```ts
// the naive approach — DON'T ship this
const job = await payments_queue.add("charge", { saleId: 1001 });
while (true) {
  const state = await job.getState(); // hits Redis every loop
  if (state === "completed") break;
  await sleep(100); // ...and we just guessed 100ms out of thin air
}
```

Two things are wrong, and they're worth naming because they're the _reason_ the events
system exists:

1. **It's wasteful.** You're hammering Redis with `getState` calls, most of which say
   "nope, still running." You burn CPU and network to mostly learn nothing.
2. **It's racy and laggy.** Your `100ms` is a guess. Too short → wasteful. Too long →
   you learn about completion late. There's no _right_ number because you're polling a
   thing that should be **pushing** to you.

The fix is to stop _asking_ "are you done yet?" and instead **subscribe** to a stream
that tells you the moment it happens. That stream is `QueueEvents`.

---

## 2. Build it up — piece by piece

### Piece 1: a stream of lifecycle events

Every queue in BullMQ already publishes a running commentary of what's happening to its
jobs — `waiting`, `active`, `completed`, `failed`, `progress`, and more. You just
haven't tapped into it. `QueueEvents` is the object that lets you listen:

```ts
import { QueueEvents } from "bullmq";
import { connection } from "@/connection";

const events = new QueueEvents("payments", { connection });

events.on("completed", ({ jobId, returnvalue }) => {
  console.log(`job ${jobId} finished with`, returnvalue);
});

events.on("failed", ({ jobId, failedReason }) => {
  console.log(`job ${jobId} failed:`, failedReason);
});
```

What's actually happening here matters, so don't skim it: `QueueEvents` is backed by a
**Redis Stream** (an append-only log). The queue _appends_ an entry every time a job
changes state; your `QueueEvents` instance _reads_ from that log. Nobody is polling job
state anymore — Redis pushes the entry to you the instant it's written.

> ⚠️ One gotcha that bites everyone: `returnvalue` and the event payloads are
> **serialized through Redis**. Numbers can come back as strings; your rich object is
> JSON. Don't assume types survive the round trip — that's the price of crossing a
> process boundary.

### Piece 2: wait for _one specific_ job (the ergonomic wrapper)

Listening to _every_ `completed` event just to find _your_ job is clumsy. BullMQ wraps
that pattern for you:

```ts
const events = new QueueEvents("payments", { connection });
await events.waitUntilReady(); // make sure we're subscribed BEFORE we add the job

const job = await payments_queue.add("charge", { saleId: 1001 });
const result = await job.waitUntilFinished(events); // resolves on complete, throws on fail
console.log("charged:", result);
```

Two things to internalize here:

- `waitUntilFinished` is **built on top of** `QueueEvents`. There's no magic — it's
  just filtering the same event stream for your `jobId`. Knowing that means you'll never
  be confused about why it needs an `events` instance passed in.
- The `waitUntilReady()` **before** `add()` is not optional ceremony. If you add the job
  first and subscribe second, the `completed` event for a fast job can fire _before_ you
  were listening, and you'll wait forever. **Subscribe, then act.** This ordering bug is
  the #1 reason people think `waitUntilFinished` "hangs."

### Piece 3: the thing that breaks your mental model

Here's the experiment that teaches the whole lesson. Spin up **two** `QueueEvents`
instances and **two** `Worker` instances against the same queue, then add one job:

```ts
// two observers...
const ev1 = new QueueEvents("payments", { connection });
const ev2 = new QueueEvents("payments", { connection });
ev1.on("completed", ({ jobId }) => console.log("ev1 saw", jobId));
ev2.on("completed", ({ jobId }) => console.log("ev2 saw", jobId));

// ...and two workers
new Worker("payments", async (job) => console.log("worker A ran", job.id), {
  connection,
});
new Worker("payments", async (job) => console.log("worker B ran", job.id), {
  connection,
});

await payments_queue.add("charge", { saleId: 1001 });
```

Run it and watch the output. **One job in. The two outcomes are completely different:**

- Exactly **one** worker logs "ran" — A _or_ B, never both. They **compete**; the job is
  delivered to one of them and removed.
- **Both** `QueueEvents` log "saw". They don't compete — each one independently receives
  _every_ event.

That asymmetry _is_ the lesson. Same Redis, same job, two opposite delivery rules.

---

## 3. The concept this reveals: queue vs. topic

What you just saw are the two fundamental messaging shapes. Every broker on earth
(RabbitMQ, Kafka, SQS, NATS) is some combination of these two:

|                         | **Queue** (point-to-point)        | **Topic** (publish/subscribe)               |
| ----------------------- | --------------------------------- | ------------------------------------------- |
| Each message goes to…   | **exactly one** consumer          | **every** subscriber                        |
| Consumers are…          | **competing** (load-balanced)     | **independent** (fan-out)                   |
| You add a consumer to…  | **scale the work** (go faster)    | **add a new reaction**                      |
| The question it answers | "who **does** this?"              | "who **needs to know**?"                    |
| In BullMQ               | `Worker`                          | `QueueEvents`                               |
| Real-world              | a task list — one person per task | a group chat — everyone reads every message |

The trap most people fall into: they reach for a queue when they actually want a topic.
They try to make four things react to a payment by spinning up four workers on the
`payments` queue — and then can't figure out why only _one_ of them ever runs. Of course
only one runs: **a queue load-balances; it does not broadcast.** Adding workers makes the
work go _faster_, it doesn't make it happen in _more places_.

```mermaid
flowchart TB
    subgraph Q["QUEUE — competing consumers (scale work)"]
        J1[payment job] --> W1[Worker A ✅ runs it]
        J1 -.x.-> W2[Worker B idle]
    end
    subgraph T["TOPIC — fan-out (add reactions)"]
        E[payment.completed event] --> S1[Receipt email]
        E --> S2[Inventory]
        E --> S3[Shipping]
    end
```

---

## 4. The part that actually matters in production

Now the sharp edge — and this is where the lesson pays for itself. It's tempting to wire
your whole system off `QueueEvents`: "payment completed → my analytics listener charges
the dashboard, my email listener sends the receipt." **Don't make `QueueEvents` the
backbone of critical work.** Here's the why, and it's the same crash-survival reasoning
from Lesson 07:

`QueueEvents` is an **observation** stream. The events log is **trimmed** (it has a max
length) and there's **no acknowledgement** — if your email listener is _down_ when the
event fires, the event scrolls past and, once trimmed, is **gone**. The email is silently
never sent and nothing retries it. For a dashboard, fine — a missed tick doesn't matter.
For a receipt or an inventory decrement, that's a lost business action. Unacceptable.

So the production rule is:

> **`QueueEvents` is for _coordination and observability_** (wait for a result, power a
> dashboard, collect metrics). **For durable fan-out of _work_, the worker enqueues new
> jobs onto separate queues** — each a real, retryable, dead-letterable unit of work.

That second pattern — "fan-out by enqueuing" — looks like this. When the payment worker
finishes, _it_ becomes a producer for the downstream concerns:

```ts
const paymentWorker = new Worker(
  "payments",
  async (job) => {
    await chargeCard(job.data); // the actual work

    // fan-out: each reaction is its OWN durable job on its OWN queue.
    // if shipping's worker is down, its job waits — it is NOT lost.
    await receipts_queue.add("send", { saleId: job.data.saleId });
    await inventory_queue.add("decrement", { saleId: job.data.saleId });
    await shipping_queue.add("notify", { saleId: job.data.saleId });

    return { charged: true };
  },
  { connection },
);
```

Each downstream queue gets its own worker, its own retry policy, its own DLQ (Lesson 06).
A consumer being offline just means its jobs pile up safely and drain when it returns.
That's the difference between an event you might miss and a job that _will_ get done.

> This connects forward: in Kafka terms, a `Worker` group is a **consumer group**
> (competing within the group), and each separate downstream queue is like a separate
> consumer group on the same event (fan-out across groups). BullMQ makes you build that
> fan-out explicitly by enqueuing; Kafka gives it natively. Same idea, different
> ergonomics.

---

## 5. Reference code (keep this)

A complete, runnable shape showing both halves: `QueueEvents` for **coordination**
(producer awaits the result) and enqueue-based **fan-out** for durable reactions.

```ts
// events.queue.ts
import { connection } from "@/connection";
import { Queue } from "bullmq";

export const payments_queue = new Queue("payments", { connection });
export const receipts_queue = new Queue("receipts", { connection });
export const shipping_queue = new Queue("shipping", { connection });
```

```ts
// events.worker.ts — does the work, then fans out durable jobs
import { connection } from "@/connection";
import { Worker } from "bullmq";
import { receipts_queue, shipping_queue } from "./events.queue";

new Worker(
  "payments",
  async (job) => {
    console.log("charging", job.data.saleId);
    // ... real charge here ...
    await receipts_queue.add("send", { saleId: job.data.saleId });
    await shipping_queue.add("notify", { saleId: job.data.saleId });
    return { charged: true, saleId: job.data.saleId };
  },
  { connection },
);

// independent reaction workers — each survives the others being down
new Worker("receipts", async (job) => console.log("📧 receipt for", job.data.saleId), {
  connection,
});
new Worker("shipping", async (job) => console.log("📦 shipping for", job.data.saleId), {
  connection,
});
```

```ts
// events.producer.ts — coordination: add a job and await its result
import { QueueEvents } from "bullmq";
import { connection } from "@/connection";
import { payments_queue } from "./events.queue";

const events = new QueueEvents("payments", { connection });
await events.waitUntilReady(); // subscribe BEFORE adding

const job = await payments_queue.add("charge", { saleId: 1001 });
const result = await job.waitUntilFinished(events); // pushed, not polled
console.log("done:", result);

await events.close();
process.exit(0);
```

---

## 6. Mini challenge (try before reading any further)

Don't write code for this one — just **predict**, in a comment or out loud:

You attach **three** `QueueEvents` listeners to the `payments` queue, each logging on
`completed`. You also start **three** `Worker`s on `payments`. You add **two** jobs.

1. How many total "worker ran" lines do you see? How many "event saw" lines?
2. Now: one of your three workers throws on every job. Does that change either count?
   Where do the failed jobs go, and which listener(s) hear about it?
3. You add a fourth `Worker` an hour later, while the queue is empty. It logs nothing.
   You add a fourth `QueueEvents` instead — it _also_ logs nothing for the jobs that ran
   an hour ago. **Why?** (This one is the whole "topic isn't durable storage" point —
   make sure your answer names _trimming_.)

If you can answer #3 cleanly, you understand the lesson. We'll go over it when you're
ready.

---

## 7. Exercise — the real problem

**Build an order-placement flow.** A customer places an order; that single action must
cause several independent things to happen, and your API has to behave correctly for the
customer _while_ those things fan out.

The requirements (the _what_ — the _how_ is entirely yours):

- Placing an order is a **single request** from the producer's side. The caller should
  **block only until the order is confirmed _placed_** (accepted, durable) — and get a
  result back — **not** until every downstream reaction has finished. A customer
  shouldn't wait on the shipping department.
- Placing an order must trigger **at least three independent reactions** — pick your own,
  e.g. receipt, inventory, shipping, analytics — each owned by a **separate worker**.
- It must be **safe for any one reaction's worker to be offline.** If shipping is down
  when the order is placed, the order still succeeds, the other reactions still happen,
  and shipping's work is **not lost** — it runs when shipping comes back.
- Somewhere you must make a **deliberate choice** between using `QueueEvents` /
  `waitUntilFinished` for coordination versus enqueuing a downstream job — and you should
  be able to say _why_ for each spot you used it.

How you structure files, name things, and split queues is **up to you** — there are many
valid designs and I want to see yours, not a fill-in-the-blank. Prove it works: knock a
reaction worker offline, place an order, show the order still succeeds, then bring the
worker back and show its backlog drains.

When you've got something, show me your code. I'll review the **business logic** by
severity, flag bugs, and if there's a sharper design (or a concept the shape of your
solution is brushing up against) I'll teach it in the review — what would be better and
which problem it prevents.

> Want an interactive visual for the queue-vs-topic delivery split (like the 05 and 07
> ones)? Say the word and I'll build you one before you start.

```

```
