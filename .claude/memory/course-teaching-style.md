---
name: course-teaching-style
description: "How to structure lessons, exercises, and code review in learn courses — general real-problem tasks, step-by-step lesson builds, reference code + challenge, severity-tagged review"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 02fe58da-2b2a-4129-91a6-5e9114375e3d
---

For the [[learn-broker-course]] and any future `/learn` courses, follow this structure (user spelled it out explicitly):

**Lesson structure:**
1. Explain the concept in detail, problem → solution.
2. Then a working example as a step-by-step breakdown — build the solution piece by piece, explaining what each part does and WHY it exists before moving to the next piece. Never dump the final code upfront.
3. At the END of the session: (a) give a clean, complete, working reference code example to keep; (b) give a mini challenge to test understanding — do NOT give away the solution; let them try first.

**Tasks/exercises:** Give a REAL, GENERAL problem to solve (like "simulate payment charging"), NOT "create file X and write Y in it." There are many valid ways to solve it; the user may build something totally different from what I expect — that's wanted. They want hands dirty. After they solve it their way: check the business logic, suggest improvements, fix bugs, and teach concepts they missed IN the solution itself — explain what a better solution would be and what problem it would prevent if done otherwise.

**Code review (when they share their own code):** Point out issues BY SEVERITY, and explain WHY each one matters, not just what to fix.

**Why:** The user understands concepts deeply and learns by building/struggling, not copying. Prescriptive file-by-file steps and final-code-upfront break the cognitive connection they're trying to form.

**How to apply:** Set open-ended real problems and stop. Teach by deriving incrementally. Close every lesson with reference code + an un-spoiled challenge. Review by severity with reasoning. Links: [[learn-broker-course]], [[user-prefers-readable-reviewable-formats]].
