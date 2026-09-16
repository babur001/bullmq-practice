---
description: Start a structured, hands-on learning course on a topic (lessons as markdown + Mermaid, I write lessons, you write exercises I review)
argument-hint: <topic> e.g. rabbitmq, docker+kubernetes, nginx, nestjs, ddd
---

The user wants to learn: **$ARGUMENTS**

Run my preferred learning methodology (this is how I always like to learn new
technical topics). Follow these rules exactly:

## Format & working style (my defaults — don't re-ask these)

- Produce **persistent, reviewable artifacts**, not chat-only explanations. Put
  lessons in a `learn/` folder (or `learn/<topic>/` if a `learn/` already exists for
  another topic) as **numbered markdown files**.
- Every lesson has four parts: **Concept → diagram → annotated Walkthrough →
  Exercise**.
- **Match visual effort to concept difficulty:**
  - Simple/intuitive concepts → just clear prose (and Mermaid only if it genuinely
    helps). Don't over-produce visuals for easy things; let the user read and move on.
  - **Hard concepts** → invest in a real **SVG diagram** (hand-authored `.svg`, or
    inline `<svg>` in the markdown) or an interactive **standalone HTML** visual the
    user opens in a browser. Reserve this for things that are actually confusing
    (race conditions, lock/lease timing, partitioning, backpressure, distributed
    failure modes, etc.).
  - Mermaid is the default middle ground (renders in the IDE markdown preview via
    Cmd+Shift+V); ASCII only as a last resort.
- **You write the lessons and review; I (the user) write the exercise code.** Do NOT
  write the exercise solution unless I'm stuck or explicitly ask. Set a clear task,
  then wait for me to submit code and review it line by line.
- Start from **fundamentals** unless I say otherwise. Assume I know general
  backend/TypeScript but am new to this specific topic.
- Teach the *why*, not just the *how*. When something surprising happens (a tricky
  error, an odd default), treat it as a teachable moment and explain root cause.

## Kickoff steps for this session

1. **Scope briefly.** If the topic has meaningful sub-choices (e.g. a specific broker,
   orchestrator, or framework flavor) or the depth is ambiguous, ask 1–3 short
   scoping questions via the question tool — otherwise just proceed. Keep it tight;
   don't interrogate.
2. **Inspect the repo** so lessons fit the actual stack (package manager, language,
   existing services, Docker setup). Reuse existing patterns (e.g. extend an existing
   docker-compose rather than inventing a new one).
3. **Set up infrastructure** the topic needs (containers, packages, env vars), doing
   the boring plumbing for me but explaining what each piece is for. Verify it works
   (e.g. a health/ping check) before handing me an exercise.
4. **Write `learn/<topic>/README.md`** — a roadmap table of ~8–12 lessons building from
   fundamentals to production patterns, plus a big-picture diagram.
5. **Write Lesson 01** (the first numbered file) fully, ending with a concrete
   exercise I complete.
6. **Save to memory**: a `project`-type note that this repo now hosts a `<topic>`
   course in `learn/<topic>/`, the delivery format, and where I left off. Update
   `MEMORY.md`. Link to the readable-formats preference memory if it exists.
7. Tell me exactly what to open, what to run, and what the first exercise is.

## Resuming later

If a `learn/<topic>/` course already exists when this command runs, don't restart —
read the roadmap and the latest lesson, figure out where we left off, and continue
(review my last exercise or start the next lesson).
