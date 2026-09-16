#!/usr/bin/env bash
#
# learn-kit installer — makes the /learn teaching system available on this machine.
#
#   ./learn-kit/install.sh                 install /learn + /commit globally (~/.claude/commands)
#   ./learn-kit/install.sh --seed <repo>   ALSO set <repo> up as a course host:
#                                          project commands + the portable style memories,
#                                          symlinked into Claude's per-project memory path
#                                          so every memory Claude writes lands in that repo's git
#   ./learn-kit/install.sh --seed          same, seeding the repo this kit lives in
#
# Idempotent. Safe to re-run.
set -euo pipefail

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }

SEED=""
SEED_REQUESTED=0
while [ $# -gt 0 ]; do
  case "$1" in
    --seed)
      SEED_REQUESTED=1
      if [ $# -ge 2 ] && [ "${2#--}" = "$2" ]; then SEED="$2"; shift; else SEED="$(cd "$KIT/.." && pwd)"; fi
      ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
  shift
done

bold "learn-kit :: install"
echo "kit         : $KIT"
echo "claude home : $CLAUDE_HOME"
echo

# ---------------------------------------------------------------------------
# 1. slash commands, globally
# ---------------------------------------------------------------------------
bold "[1/3] slash commands (global)"
mkdir -p "$CLAUDE_HOME/commands"
for cmd in learn commit; do
  src="$KIT/commands/$cmd.md"
  dest="$CLAUDE_HOME/commands/$cmd.md"
  [ -f "$src" ] || { echo "  ! missing $src — skipped"; continue; }

  if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$src" ]; then
    echo "  ✓ /$cmd already linked"
    continue
  fi
  if [ -e "$dest" ] && ! [ -L "$dest" ]; then
    if cmp -s "$src" "$dest"; then
      rm "$dest"                        # identical content — safe to replace with a link
    else
      backup="$dest.bak-$(date +%Y%m%d%H%M%S)"
      mv "$dest" "$backup"
      echo "  ! existing /$cmd differed — backed up to $backup"
    fi
  fi
  ln -sfn "$src" "$dest"
  echo "  ✓ /$cmd -> $src"
done
echo "  (now usable in every repo on this machine)"

# ---------------------------------------------------------------------------
# 2. optionally seed a repo as a course host
# ---------------------------------------------------------------------------
echo
bold "[2/3] course host"
if [ "$SEED_REQUESTED" -eq 0 ]; then
  echo "  skipped (pass --seed <repo> to set a repo up as a course host)"
else
  TARGET="$(cd "$SEED" && pwd)"
  echo "  target: $TARGET"

  # 2a. project-level commands, so /learn works in that repo even without the global install
  mkdir -p "$TARGET/.claude/commands"
  for cmd in learn commit; do
    dest="$TARGET/.claude/commands/$cmd.md"
    if [ -e "$dest" ] || [ -L "$dest" ]; then
      echo "  ✓ .claude/commands/$cmd.md already present"
    else
      cp "$KIT/commands/$cmd.md" "$dest"
      echo "  ✓ .claude/commands/$cmd.md created"
    fi
  done

  # 2b. portable style memories — only the topic-agnostic ones; never overwrite existing files
  mkdir -p "$TARGET/.claude/memory"
  for f in "$KIT"/memory/*.md; do
    base="$(basename "$f")"
    dest="$TARGET/.claude/memory/$base"
    if [ "$base" = "MEMORY.md" ] && [ -f "$dest" ]; then
      echo "  ✓ MEMORY.md exists — left alone (merge the kit's index lines by hand if needed)"
      continue
    fi
    if [ -f "$dest" ]; then
      echo "  ✓ memory/$base exists — left alone"
    else
      cp "$f" "$dest"
      echo "  ✓ memory/$base seeded"
    fi
  done

  # 2c. point Claude's per-project memory path at the repo copy.
  # Claude names each project's state dir after its absolute path with every
  # non-alphanumeric character turned into a dash. Derive it rather than hardcode it,
  # so this works under a different username or clone location.
  PROJECT_KEY="$(printf '%s' "$TARGET" | sed 's/[^a-zA-Z0-9]/-/g')"
  CLAUDE_PROJECT_DIR="$CLAUDE_HOME/projects/$PROJECT_KEY"
  CLAUDE_MEMORY="$CLAUDE_PROJECT_DIR/memory"
  mkdir -p "$CLAUDE_PROJECT_DIR"

  if [ -L "$CLAUDE_MEMORY" ]; then
    echo "  ✓ memory already linked -> $(readlink "$CLAUDE_MEMORY")"
  elif [ -d "$CLAUDE_MEMORY" ]; then
    # A real directory is already there. Don't destroy it — park it next door so any
    # memories written on this machine can be merged back in by hand.
    BACKUP="$CLAUDE_MEMORY.local-backup"
    rm -rf "$BACKUP"
    mv "$CLAUDE_MEMORY" "$BACKUP"
    ln -s "$TARGET/.claude/memory" "$CLAUDE_MEMORY"
    echo "  ! existing memory dir moved to $BACKUP — merge anything worth keeping"
    echo "  ✓ memory linked -> $TARGET/.claude/memory"
  else
    ln -s "$TARGET/.claude/memory" "$CLAUDE_MEMORY"
    echo "  ✓ memory linked -> $TARGET/.claude/memory"
  fi
fi

# ---------------------------------------------------------------------------
# 3. checks
# ---------------------------------------------------------------------------
echo
bold "[3/3] checks"
if command -v claude >/dev/null 2>&1; then
  echo "  ✓ claude   $(claude --version 2>/dev/null | head -1)"
else
  echo "  ✗ claude   NOT FOUND — install Claude Code, then re-run"
fi
if command -v git >/dev/null 2>&1; then
  echo "  ✓ git      $(git --version | head -1)"
else
  echo "  ✗ git      NOT FOUND — needed to sync memory between machines"
fi

echo
cat <<EOF
Done. In a repo you want to learn in:

  claude
  /learn <topic>          e.g. /learn rabbitmq, /learn kubernetes, /learn ddd

Full guide: $KIT/init.md
EOF
