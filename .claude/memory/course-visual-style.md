---
name: course-visual-style
description: "Interactive lesson visuals share the color system only, not UX; each lesson stands alone"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 02fe58da-2b2a-4129-91a6-5e9114375e3d
---

For interactive lesson visuals (the `learn/visuals/**/*.html` files):

- **Each COURSE gets its own design system; share the color system *within* a course, not across.**
  The BullMQ/[[learn-broker-course]] visuals use coral/emerald/amber on warm near-black. The **Kafka**
  course must NOT reuse that palette — the user explicitly said "do not use mine, use your own design
  system" (2026-07-10). Kafka's system is **"Ink & Signal"**: cool blue-black ink base, horizontal
  ledger scanlines, cyan `#3ad2ff` (keyed/primary) + violet `#9d8cff` (keyless/sticky) + amber
  `#f5a524` (hazard only), and **monospace as the display face**. Tokens live in
  `learn/visuals/kafka/_design-system.md`.
- **Share the COLOR system, not the UX.** Within one course, reuse the palette + semantics; each
  visual gets its OWN layout/interaction. Do NOT force a shared top bar/nav/component structure.
- **Future lessons stand alone.** Build only the current lesson's material; don't re-skin or depend
  on older visuals.

**Why:** Identical chrome felt templated; and carrying one course's palette into the next made the
new course feel like a reskin instead of its own thing. The user wants each course to have a distinct
visual identity, with cohesion *inside* the course coming from a shared palette + fresh per-lesson UX.

**How to apply:** For a new course, invent a fresh design system (invoke frontend-design skill to make
it intentional, not a default) and document it in `learn/visuals/<course>/_design-system.md`; reuse it
across that course's lessons. Build only the current lesson. Links: [[course-teaching-style]], [[kafka-course]].
