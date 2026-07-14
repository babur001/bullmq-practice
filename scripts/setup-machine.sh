#!/usr/bin/env bash
#
# Sets up this course on a new machine:
#   1. links the committed Claude course memory into Claude's per-project memory path
#   2. creates the local .env files from the checked-in examples
#
# Safe to re-run. Run from anywhere:  ./scripts/setup-machine.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_MEMORY="$REPO/.claude/memory"

# Claude names each project's state dir after its absolute path, with every
# non-alphanumeric character turned into a dash. Derive it rather than hardcode
# it, so this works under a different username or clone location.
PROJECT_KEY="$(printf '%s' "$REPO" | sed 's/[^a-zA-Z0-9]/-/g')"
CLAUDE_PROJECT_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/$PROJECT_KEY"
CLAUDE_MEMORY="$CLAUDE_PROJECT_DIR/memory"

echo "repo         : $REPO"
echo "claude memory: $CLAUDE_MEMORY"
echo

mkdir -p "$CLAUDE_PROJECT_DIR"

if [ -L "$CLAUDE_MEMORY" ]; then
  echo "✓ memory already linked -> $(readlink "$CLAUDE_MEMORY")"
elif [ -d "$CLAUDE_MEMORY" ]; then
  # A real directory is already there. Don't destroy it — park it next door so
  # any memories written on this machine can be merged back in by hand.
  BACKUP="$CLAUDE_MEMORY.local-backup"
  echo "! $CLAUDE_MEMORY exists and is not a link."
  echo "  moving it to $BACKUP so the repo copy can take over."
  echo "  merge anything you want to keep from there into $REPO_MEMORY."
  rm -rf "$BACKUP"
  mv "$CLAUDE_MEMORY" "$BACKUP"
  ln -s "$REPO_MEMORY" "$CLAUDE_MEMORY"
  echo "✓ memory linked"
else
  ln -s "$REPO_MEMORY" "$CLAUDE_MEMORY"
  echo "✓ memory linked"
fi

echo
for app in server web; do
  example="$REPO/apps/$app/.env.example"
  target="$REPO/apps/$app/.env"
  [ -f "$example" ] || continue
  if [ -f "$target" ]; then
    echo "✓ apps/$app/.env already exists (left alone)"
  else
    cp "$example" "$target"
    echo "✓ created apps/$app/.env from .env.example"
  fi
done

cat <<'EOF'

Done. Remaining steps:

  pnpm install
  pnpm db:start     # postgres + redis + kafka + kafka-ui
  pnpm db:push      # push the drizzle schema

Then open Claude Code in this repo and say "continue the kafka course".
EOF
