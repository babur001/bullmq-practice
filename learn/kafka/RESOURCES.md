# Follow-up Resources — where to go after this course

This course takes you from "Kafka is not a queue" to a full event-driven capstone. But it's
one voice on one stack (**KafkaJS on Node**). To get *dangerous*, you want other angles:
the internals from the people who build Kafka, the architecture patterns from the people who
design with it, and a reference book to keep on the desk. This file curates the best of each,
and — more useful — **maps them onto the specific lesson they reinforce**.

> **One caveat up front.** Most top Kafka courses are **Java/JVM-heavy** — Streams and Connect
> are JVM-native, so hands-on stream-processing material assumes Java. That's fine: the
> *concepts* transfer 1:1 to your KafkaJS work. The language mismatch only bites in Lesson 09
> (Stream processing), where KafkaJS has no real Kafka Streams equivalent anyway — so treat
> that material as **conceptual**, not something you'll type along with.

## The recommended path (do these, in this order)

Everything here except the Udemy course is **free**. You already have the Udemy sub, so that's
free to you too. There is no reason to pay for anything.

1. **Confluent Architecture Deep Dive** (free) — the internals your beginner lessons skip.
2. **Designing Event-Driven Systems** (free PDF) — the architecture layer; maps onto your
   saga/outbox code in this very repo.
3. **Maarek's Kafka for Beginners v3** (Udemy) — solidify the ecosystem, KRaft-current.
4. **Kafka: The Definitive Guide** (book) — keep as reference, read non-linearly forever.

That's the whole journey from "I can produce/consume" to "I can architect with Kafka."

---

## 1. Free & best-in-class — start here

### Confluent Developer (developer.confluent.io)
The single highest-leverage next step, and it costs nothing. Made by the people who build
Kafka, **language-agnostic**, and it's exactly the internals layer a beginner course glosses.

- **[Apache Kafka Architecture Deep Dive](https://developer.confluent.io/courses/architecture/get-started/)**
  — replication, ISR, the storage log, exactly-once semantics, partitioning. This is the
  "why it works" course.
- **[Jun Rao — Deep Dive into Apache Kafka](https://www.confluent.io/apache-kafka-talk-series/deep-dive-into-apache-kafka/)**
  (YouTube talk, Confluent co-founder) — the "why is it *fast*" story: the log, zero-copy,
  page cache, sequential I/O.

### Hello Interview — Kafka Deep Dive (free)
**[hellointerview.com/.../deep-dives/kafka](https://www.hellointerview.com/learn/system-design/deep-dives/kafka)**
— written + YouTube. Frames Kafka the way you'd actually *use* it in a design decision: when
to reach for it, how to pick a partition strategy, what ordering guarantees you really get.
Compact, practical, underrated for someone at your stage.

---

## 2. Udemy (you have the sub)

**[Stephane Maarek — Learn Apache Kafka for Beginners v3](https://www.udemy.com/course/apache-kafka/)**
— the canonical Kafka course, **updated Aug 2025 for Kafka 4.0 / KRaft** (matches your setup).
Examples are Java; watch the CLI/architecture half at 1.5× — it's language-neutral. His ladder
after that, in relevance order for you:

| Course | Verdict for a KafkaJS/Node dev |
| ------ | ------------------------------ |
| [Kafka Connect Hands-on](https://www.udemy.com/course/kafka-connect/) | **Do it.** "Get data in/out without writing consumers" — pairs with Lesson 07's Debezium/CDC. |
| [Kafka Streams for Data Processing](https://www.udemy.com/course/kafka-streams/) | **Conceptual only.** Genuinely Java-only in practice; watch to *understand* Lesson 09, not to code along. |
| [Kafka Monitoring & Operations](https://www.udemy.com/course/kafka-monitoring-and-operations/) | Only if you'll run clusters. Reinforces Lesson 10. |

---

## 3. Books

- **Kafka: The Definitive Guide** (O'Reilly — Confluent/LinkedIn engineers) — *the* reference.
  Best signal-to-noise on production reliability. Read non-linearly, next to whatever you're
  building.
- **[Designing Event-Driven Systems](https://www.confluent.io/resources/ebook/designing-event-driven-systems/)**
  — Ben Stopford, **free PDF from Confluent**. Short. The *architecture* book: event sourcing,
  CQRS, event collaboration, why streaming beats request/response. Given the saga + transactional
  outbox work already in this repo, this is the most directly relevant thing on the list.
- **[Kafka for Architects](https://www.amazon.com/Kafka-Architects-Event-driven-architecture-microservices/dp/1633436411)**
  (2026, Manning) — newest, patterns-first: CQRS, event sourcing, data contracts. Pick this
  over Definitive Guide if you want *design* over *API*.

---

## Map resources onto this course's roadmap

Reach for the matching resource when you hit — or finish — the lesson.

| Lesson | Best companion resource |
| ------ | ----------------------- |
| 01 The Log | Jun Rao's deep-dive talk (why the log is fast) |
| 02 Producing / keys / ordering | Confluent Architecture Deep Dive → producer & partitioning modules |
| 03 Consumer groups & rebalancing | Confluent Deep Dive → consumer group protocol; Hello Interview (partition assignment) |
| 04 Delivery semantics | Confluent Deep Dive → exactly-once / idempotent producer & transactions |
| 05 Retention & compaction | *Definitive Guide* ch. on storage internals & log compaction |
| 06 Schemas & contracts | Maarek **Schema Registry** section; *Kafka for Architects* (data contracts) |
| 07 EDA patterns (outbox → CDC/Debezium) | **Maarek Kafka Connect** + *Designing Event-Driven Systems* (event collaboration) |
| 08 Event Sourcing & CQRS | *Designing Event-Driven Systems* (the core chapters) |
| 09 Stream processing | Maarek **Kafka Streams** (conceptual) — KafkaJS has no Streams equiv |
| 10 Production reliability & ops | *Definitive Guide* (reliability); Maarek **Monitoring & Ops** |
| 11 Capstone | *Designing Event-Driven Systems* end-to-end; Hello Interview design framing |
