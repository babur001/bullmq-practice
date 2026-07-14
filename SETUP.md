# Setting up the course on another computer

Everything you need is in this repo — the lessons (`learn/`), the exercise code
(`apps/server/src/`), the broker stack (`packages/db/docker-compose.yml`), and
the Claude course memory (`.claude/memory/`).

## New machine

```bash
git clone https://github.com/babur001/bullmq-practice.git learn-broker
cd learn-broker

./scripts/setup-machine.sh   # links Claude memory + creates .env files
pnpm install
pnpm db:start                # postgres + redis + kafka + kafka-ui
pnpm db:push                 # push the drizzle schema
```

Then open Claude Code in the repo and say **"continue the kafka course"**. It
reads `.claude/memory/` and picks up where you left off (Kafka lessons 01–03
done, next is lesson 04).

Prerequisites: Node + `pnpm` (`corepack enable`), Docker, and Claude Code.

## How the memory sync works

Claude keeps per-project memory in `~/.claude/projects/<key>/memory/`, where
`<key>` is the repo's absolute path with every non-alphanumeric character turned
into a dash. That path is machine-specific, so the memory can't just be committed
where it lives.

Instead the real files live in this repo at `.claude/memory/`, and
`setup-machine.sh` symlinks Claude's memory path at them:

```
~/.claude/projects/-Users-you-learn-broker/memory  ->  <repo>/.claude/memory
```

So when Claude writes a memory during a lesson, the file lands in the repo and
shows up in `git status`. Commit and push it like any other change, pull on the
other machine, and both machines stay in step.

The script derives `<key>` from wherever you cloned, so a different username or
directory is fine.

## What does *not* sync

- **Chat transcripts.** `claude --resume` history stays on the machine that
  created it. The memory files carry the course state, so you don't need it.
- **`.env` files.** Recreated from `.env.example` by the setup script. They only
  hold localhost dev values.
- **`node_modules` and Docker volumes.** Rebuilt by `pnpm install` and
  `pnpm db:start`. Kafka topics and Postgres rows do not travel — replay the
  lesson producers to repopulate.
