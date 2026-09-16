---
name: lesson-go-deeper-refs
description: "Lessons should end with a curated \"Go deeper\" section mapping the exact module of a course the user owns + one or two canonical free articles"
metadata:
  node_type: memory
  type: feedback
---

When authoring course lessons, include a **"Go deeper"** section in relevant modules that
points to **specific sections/modules of a paid course the user already owns** (ask which,
once per course) AND one or two **canonical free articles/docs** for detailed self-study on
that lesson's exact topic.

*Worked example:* for the Kafka course this meant Stephane Maarek's "Apache Kafka for
Beginners v3" (Udemy) section titles plus the single best canonical article per topic (e.g.
Confluent's "Incremental Cooperative Rebalancing" for rebalancing, the KafkaJS docs for API
specifics).

**Why:** The user wants to reinforce each concept with the best external material, mapped
precisely to the module — not a generic reading list dumped at the end of the course.

**How to apply:** Curate, don't dump — name the exact section titles and the single best
article per topic. Flag material in a different language/stack as "watch conceptually" when
the hands-on parts won't transfer. Keep it in the lesson's own voice and design. Consider a
course-level `RESOURCES.md` that maps every external resource onto the lesson it reinforces.
See [[course-teaching-style]].
