# init.md — the portable `/learn` system

This folder is a **teaching system, not a course**. It carries the `/learn` command and the
conventions that shape every course it produces, so you can drop it on any computer, in any
repo, and learn any topic exactly the way you learn here — without re-explaining how you
want to be taught.

No Kafka, no BullMQ, no backend content travels with it. Only the method.

```
learn-kit/
├── init.md                  ← you are here
├── install.sh               one command; works on a fresh machine
├── commands/
│   ├── learn.md             the /learn skill (source of truth)
│   └── commit.md            the /commit convention
├── memory/                  the four topic-agnostic preferences Claude must know
│   ├── MEMORY.md
│   ├── course-teaching-style.md
│   ├── course-visual-style.md
│   ├── user-prefers-readable-reviewable-formats.md
│   └── lesson-go-deeper-refs.md
└── templates/
    ├── roadmap-README.md    skeleton of a course roadmap
    └── lesson.md            skeleton of one lesson
```

---

## 0. TL;DR

```bash
# copy learn-kit/ onto the new machine (clone this repo, or copy the folder anywhere)
./learn-kit/install.sh --seed /path/to/repo-you-want-to-learn-in
```

Then, in that repo:

```
claude
/learn kubernetes
```

That's the whole system. Everything below explains what it does and why each piece exists.

---

## 1. The three moving parts

A course is not just markdown files. Three things have to be in place, and only one of them
is naturally portable — which is exactly why this kit exists.

| Part | What it is | Where it lives | Portable by itself? |
| --- | --- | --- | --- |
| **The command** | `/learn <topic>` — the prompt that encodes the whole methodology | `~/.claude/commands/learn.md` **or** `<repo>/.claude/commands/learn.md` | ❌ outside any repo by default |
| **The conventions** | four memory files: teaching style, visual style, artifact preference, external-refs rule | `~/.claude/projects/<key>/memory/` | ❌ path is machine-specific |
| **The artifacts** | `learn/<topic>/*.md`, `learn/visuals/`, your exercise code | in the repo | ✅ git handles it |

`install.sh` fixes the first two: it installs the command in both places, and it symlinks
Claude's machine-specific memory path at a folder **inside your repo** — so from then on
every memory Claude writes lands in git and travels like source code.

```
~/.claude/commands/learn.md            ->  <kit>/commands/learn.md
~/.claude/projects/<key>/memory        ->  <repo>/.claude/memory
```

---

## 2. Install

### 2.1 On a new computer

Get `learn-kit/` onto the machine — clone whatever repo holds it, or copy the folder — then:

```bash
./learn-kit/install.sh
```

This installs `/learn` and `/commit` globally into `~/.claude/commands/`, so they work in
**every** repo on that machine. Existing files with different content are backed up, never
clobbered. Re-running is safe.

### 2.2 Turning a repo into a course host

```bash
./learn-kit/install.sh --seed /path/to/repo
```

Adds three things to that repo:

1. `.claude/commands/learn.md` and `commit.md` — so `/learn` works there even if the global
   install is missing (a teammate cloning it gets the command for free);
2. `.claude/memory/` seeded with the four portable preference files;
3. the symlink from Claude's per-project memory path to `<repo>/.claude/memory`.

Existing files are never overwritten — if the repo already has memories, they're left alone
and only missing ones are added. Restart Claude Code afterwards; memory is read at session
start.

**Verify it took:**

```bash
REPO=/path/to/repo
ls -la ~/.claude/projects/"$(printf '%s' "$REPO" | sed 's/[^a-zA-Z0-9]/-/g')"/memory
# must be a symlink -> <repo>/.claude/memory
```

Then ask Claude "how do I like lessons structured?" — if it answers with concept → diagram →
walkthrough → exercise and says *you* write the exercise code, the memories loaded.

### 2.3 Requirements

Only Claude Code and git. Everything a specific course needs (Docker, a runtime, a database)
gets set up by Claude during that course's Lesson 00 plumbing — see §3, step 3.

---

## 3. What `/learn <topic>` actually does

Seven steps, in order. This is the contract; the verbatim command text is in Appendix A.

1. **Scope briefly.** 1–3 short questions only if the topic has real sub-choices (which
   broker, which flavor, how deep). Otherwise it just starts. No interrogation.
2. **Inspect the repo** so lessons fit your actual stack — package manager, language,
   existing services, existing Docker setup. It reuses what's there rather than inventing a
   parallel setup (extending an existing `docker-compose.yml`, not writing a second one).
3. **Set up the infrastructure** the topic needs — containers, packages, env vars — doing the
   boring plumbing for you while explaining what each piece is for, and **verifying it works**
   (a ping, a health check) before handing you anything to do.
4. **Write `learn/<topic>/README.md`** — a roadmap of ~8–12 lessons from fundamentals to
   production patterns, plus a big-picture diagram.
5. **Write Lesson 01** in full, ending with a concrete exercise.
6. **Save a `project` memory** recording that this repo now hosts a `<topic>` course, the
   delivery format, and where you left off — then update `MEMORY.md`.
7. **Tell you exactly** what to open, what to run, and what the first exercise is.

**Resuming is the same command.** If `learn/<topic>/` already exists, `/learn <topic>` does
not restart — it reads the roadmap and the latest lesson, works out where you stopped, and
continues (reviewing your last exercise or writing the next lesson). You can also just say
"continue the kubernetes course".

---

## 4. How a course is structured

### 4.1 Folder layout

```
learn/
├── <topic>/
│   ├── README.md              roadmap table + big-picture diagram
│   ├── 00-<bridge>.md         optional: maps a topic you already know onto this one
│   ├── 01-<slug>.md           numbered lessons, fundamentals first
│   ├── …
│   ├── 11-capstone.md
│   └── RESOURCES.md           external material mapped lesson-by-lesson
└── visuals/
    └── <topic>/
        ├── _design-system.md  this course's palette + semantics
        └── 03-<slug>.html     standalone interactive visuals (hard concepts only)
```

One folder per topic under `learn/`, so several courses coexist in one repo without
colliding. Lessons are numbered `NN-kebab-title.md` — the number is the reading order and
the thing you refer to in conversation ("review my lesson 04").

Templates for the roadmap and a lesson are in `templates/`.

### 4.2 The roadmap comes first

Before Lesson 01 there's a `README.md` with an 8–12 row table: lesson number, title, and what
you'll learn. Ordered so each lesson is only possible because of the previous one — Lesson 01
is always fundamentals, the last is always a capstone that composes everything. It's the
contract for the course and the thing that makes "where did I leave off" answerable months
later.

### 4.3 Every lesson has the same four parts

1. **Concept** — problem first, solution second. Never "here is the API"; always "here is
   what breaks without this." Explains the *why*, and treats surprising defaults and
   misleading error messages as teachable moments rather than footnotes.
2. **Diagram** — see the tiering rule below.
3. **Walkthrough** — the working example built **piece by piece**: each fragment, what it
   does, why it exists, then the next. The complete file appears only at the end, as
   reference code you keep.
4. **Exercise** — an open-ended real problem, then it stops and waits for you.

Plus a **mini challenge** (2–4 questions, answers deliberately withheld — those get graded)
and a **Go deeper** section.

### 4.4 Visual effort is tiered to difficulty

This is the rule that keeps courses from being either walls of text or over-produced.

| Concept difficulty | What gets built |
| --- | --- |
| Simple, intuitive | Plain prose. No diagram. Read it and move on. |
| Middle — most things | **Mermaid** inline in the markdown. Renders in the IDE preview (**Cmd+Shift+V**), not in the chat pane. |
| Genuinely confusing — race conditions, lock/lease timing, partitioning, backpressure, distributed failure modes | A hand-authored **SVG** or a **standalone interactive HTML** page you open in a browser and manipulate. |
| Printing the lesson | Mermaid + tables only, all node labels quoted so they survive the print pipeline. |

Interactive visuals are single files: no CDN, no build step, no web fonts — they open from
disk, offline.

### 4.5 Each course gets its own design system

Interactive visuals within one course share a **palette and its semantics**, documented in
`learn/visuals/<topic>/_design-system.md`. They do **not** share layout or chrome — every
visual gets fresh UX, because identical chrome reads as templated.

And a new course never inherits the previous course's palette. A new topic gets a new visual
identity, invented deliberately (the frontend-design skill is invoked for this), so course
two doesn't feel like a reskin of course one.

### 4.6 The exercise / review protocol

**Claude writes the lessons and the reviews. You write the exercise code.** It won't hand you
a solution unless you're stuck or explicitly ask.

Exercises are **real, general problems** — "simulate payment charging", "build something that
survives a broker restart" — never "create file X and put Y in it". Many solutions are valid,
and you're expected to build something the lesson didn't predict. That's the point.

When you submit, the review:

- is ordered **by severity**, worst first;
- explains **why each issue matters**, not just what to change;
- teaches the concepts you missed **inside your own solution** — what a better approach would
  be, and which problem it would have prevented.

Your bugs become the curriculum. In practice that's where most of the learning happens.

### 4.7 Go deeper

Relevant lessons end with a short curated section: the exact section titles of a course you
already own (Claude asks once which one), plus one or two canonical free articles for that
specific topic. Curated, not dumped — and material in a different language or stack is
flagged "watch conceptually". A course-level `RESOURCES.md` maps every external resource onto
the lesson it reinforces.

---

## 5. The memory layer

### 5.1 Why the symlink

Claude Code keeps per-project memory at `~/.claude/projects/<key>/memory/`, where `<key>` is
the repo's absolute path with every non-alphanumeric character turned into a dash:

```
/Users/you/my-repo   ->   -Users-you-my-repo
```

That path is machine-specific, so memory can't just be committed where it lives. The
installer instead points it at a folder inside the repo. From then on, **when Claude writes a
memory during a lesson, the file lands in the repo and shows up in `git status`** — commit,
push, pull, and both machines are in step. The key is derived from wherever you cloned, so a
different username or folder name is fine.

### 5.2 Two kinds of memory

| Kind | Examples | Travels in this kit? |
| --- | --- | --- |
| **Preferences** — how you want to be taught | teaching style, visual style, artifact preference, go-deeper rule | ✅ yes, `memory/` |
| **Course state** — what you did in one specific course | "lesson 05 passed, here's the bug you hit, next is lesson 06" | ❌ stays in that course's repo |

The kit deliberately carries only the first kind. That's what makes it a system rather than a
backup of one course.

The four seeded files:

| File | The rule it encodes |
| --- | --- |
| `course-teaching-style.md` | lesson shape, open-ended exercises, reference code + un-spoiled challenge, severity-ordered review |
| `user-prefers-readable-reviewable-formats.md` | persistent artifacts over chat; visual effort matched to difficulty |
| `course-visual-style.md` | one design system per course; share palette within, never across; fresh UX per lesson |
| `lesson-go-deeper-refs.md` | curated external refs mapped to the exact module |

### 5.3 What Claude writes as you go

Per course, a `project`-type memory recording the stack decisions, each lesson's verdict, the
bugs you hit and the corrections that followed, and explicitly **where you left off**. That
last line is what makes "continue the course" work weeks later on a different machine.

---

## 6. The session loop

1. Read the lesson in the IDE preview (**Cmd+Shift+V** — that's where Mermaid draws).
2. Open the interactive visual if the lesson ships one.
3. Write the exercise yourself.
4. Run it, capture what it actually did.
5. "Done, review it" → severity-ordered review with reasoning.
6. Iterate until it passes, then ask for the next lesson.
7. `/commit` — **including the memory file Claude just updated.**

Step 7 is the one people skip. A lesson committed without its memory update leaves the other
machine convinced you never did it.

---

## 7. Syncing machines

Once both machines have run `install.sh`, syncing is ordinary git.

**Before you stop:**

```bash
git add learn/ .claude/memory/ <wherever your exercise code lives>
/commit
git push
```

**When you start elsewhere:** `git pull`. Nothing else.

Two habits: always commit `.claude/memory/` alongside the lesson work, and don't run the
same course on two machines at once — these are prose files, and a merge conflict inside a
course-state memory is miserable to resolve by hand.

What does **not** travel, by design: chat transcripts (memory carries the state instead),
`.claude/settings.local.json` (machine-local permission allowlist), `.env` files, and Docker
volumes — so any data a course produced gets recreated by re-running that course's producers.

---

## 8. Troubleshooting

**`/learn` isn't offered.** Check `~/.claude/commands/learn.md` or `<repo>/.claude/commands/learn.md`
exists, then restart Claude Code — commands are discovered at startup.

**Claude doesn't know the conventions.** The memory symlink is missing or points somewhere
else. Re-run `./learn-kit/install.sh --seed <repo>` (it backs up rather than deletes) and
restart. Verify with the `ls -la` check in §2.2. As a fallback, paste Appendix C.

**The symlink got replaced by a real directory.** The installer moved the old one to
`memory.local-backup` next door — merge anything worth keeping, then re-run.

**A course restarted instead of resuming.** `learn/<topic>/` must exist with its `README.md`;
`/learn <topic>` keys off that. Naming the topic differently (`/learn k8s` vs `/learn
kubernetes`) creates a second course folder.

**Checked out on Windows and the commands are broken.** `.claude/commands/*.md` may be
symlinks into `learn-kit/commands/`. Copy the files instead of linking, or enable git symlink
support.

---

## 9. Adapting the system

The pieces are plain markdown — edit them.

- Change how lessons are taught → edit `memory/course-teaching-style.md`, then re-seed.
- Change the kickoff sequence or the four-part shape → edit `commands/learn.md`. It's the
  source of truth; `.claude/commands/learn.md` in a repo links to or copies from it.
- Change what a lesson looks like → edit `templates/lesson.md`.

Keep the *why* lines in the memory files. They're what stops Claude from quietly reverting to
generic tutorial behaviour when a rule feels inconvenient.

---

## Appendix A — `/learn`, verbatim

Mirror of `commands/learn.md`. If they ever diverge, that file wins.

````markdown
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
````

---

## Appendix B — `/commit`, verbatim

Mirror of `commands/commit.md`. Included because it's what keeps memory files flowing between
machines without noisy commit bodies.

````markdown
---
description: Commit staged/relevant changes with a short title-only message
---

Commit the current changes.

- Run `git status` and `git diff` (staged and unstaged) to see what changed.
- Stage the relevant files (specific paths, never `-A`/`.`; skip anything that looks like it holds secrets — check contents if a filename looks suspicious).
- Write a commit message that is **one short, descriptive title line only** — no body, no bullet points, no explanation.
- Do **not** add a "Generated with Claude" line, a "Co-Authored-By: Claude" line, or any other mention of Claude/AI authorship. The commit message must contain nothing but the title.
- Use a HEREDOC for the commit so formatting is exact:

```
git commit -m "$(cat <<'EOF'
<short title here>
EOF
)"
```

- After committing, run `git status` to confirm it succeeded. Do not push unless explicitly asked.
````

---

## Appendix C — cold-start briefing

If memory can't load on some machine, paste this to restore the working contract for a
session:

```
I'm running a self-directed course in this repo. Work under these rules:

TEACHING
- Lessons are numbered markdown files in learn/<topic>/. Never chat-only explanations.
- Every lesson: Concept (problem → solution) → diagram → step-by-step annotated
  walkthrough (build it piece by piece, explain WHY each part exists, never dump the
  final code upfront) → close with clean reference code + an un-spoiled mini challenge.
- I write the exercise code; you review it. Don't give solutions unless I'm stuck.
- Exercises are real, open-ended problems, not "create file A with content B".
  I may solve it in a way you didn't expect — that's the point.
- Review my code BY SEVERITY, explain WHY each issue matters, and teach the concepts
  I missed inside my own solution.
- Teach the why. Surprising errors and odd defaults are teachable moments — explain the
  root cause rather than just fixing it.
- End relevant lessons with a curated "Go deeper": exact section titles from a course I
  own, plus one or two canonical free articles. Curate, don't dump.

VISUALS
- Match effort to difficulty: prose for easy, Mermaid as the middle ground, a real SVG or
  standalone interactive HTML only for genuinely hard concepts.
- Each COURSE gets its own design system, documented in
  learn/visuals/<topic>/_design-system.md. Share the palette within a course, never across
  courses. Share the color system, not the UX — every visual gets its own layout.
- Mermaid renders in the IDE preview (Cmd+Shift+V), not in the chat pane.

STRUCTURE
- Start with learn/<topic>/README.md: a roadmap of 8–12 lessons, fundamentals → production,
  ending in a capstone. Then write Lesson 01 in full.
- Set up the infrastructure the topic needs and verify it works before giving me an exercise.
- Save a project memory with the stack, the format, and where I left off; update MEMORY.md.
```

---

## Appendix D — a worked example

The repo this kit ships in is a course host with two finished-or-running courses, useful as a
reference for what the output actually looks like:

| | |
| --- | --- |
| `learn/bullmq/` | 11-lesson course on brokers/queues (Redis + BullMQ) — roadmap, lessons, 10 interactive visuals |
| `learn/kafka/` | Kafka & event-driven architecture — roadmap, lessons, `RESOURCES.md`, its own "Ink & Signal" design system |
| `learn/visuals/kafka/_design-system.md` | what a per-course design system document looks like |
| `apps/server/src/` | the exercise code, written by the learner, reviewed lesson by lesson |
| `.claude/memory/*-course.md` | what accumulated course state looks like after months of lessons |

Two design systems in one repo, deliberately unalike — that's §4.5 in practice.
