---
name: user-prefers-readable-reviewable-formats
description: User prefers generated readable artifacts (markdown/diagrams) over inline edits + chat for learning
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8b41629e-92fe-4f59-912e-cdd652a3442d
---

When teaching/explaining, the user prefers I **generate readable, persistent
artifacts** (markdown lessons, Mermaid/ASCII diagrams) they can read at their own
pace and review later — rather than scattering explanations across chat messages
and inline file edits.

**Why:** They said the inline-edit + chat-only approach was "harder to follow and
later review."

**How to apply:** For learning/explanatory work, default to writing structured docs
(e.g. a `learn/` or `docs/` folder) with diagrams, and point them to it — instead of
explaining only in chat. Offer format choices up front.

**Match visual effort to difficulty:** simple concepts → just prose, let them read
and proceed (don't over-produce visuals). Hard/confusing concepts (race conditions,
lock timing, partitioning, distributed failure) → invest in a real **SVG** or
interactive **standalone HTML** visual. Mermaid is the default middle ground and
renders in the IDE markdown preview (Cmd+Shift+V), NOT in the Claude Code chat pane —
remind them to open the preview. Claude Code can't render rich inline visuals like
claude.ai Artifacts; put visuals in files instead.

Related: [[learn-broker-course]].
