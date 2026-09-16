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
