# Kafka course — visual design system: "Ink & Signal"

The Kafka course's interactive visuals (`learn/visuals/kafka/*.html`) use their **own** design
language — deliberately **not** the BullMQ course's warm coral/emerald/amber console. Reuse these
tokens and semantics across Kafka lessons so they read as one course; invent fresh UX per lesson.

## Concept
A **log-tape routing console**. Cool blue-black "ink" substrate with faint horizontal ledger rules
(a log tape, an oscilloscope trace). Signal-spectrum accents. Monospace is the *display* face —
because a Kafka partition **is** a log tape, and log tape is monospace.

## Color tokens

```css
--ink:#0a0e17;  --ink2:#070a11;                 /* base — cool, bluer than near-black */
--panel:#10151f; --panel2:#161c28; --slot:#1c2432;
--line:#232c3d;  --line-soft:rgba(140,165,210,.09);
--text:#e8ecf4;  --muted:#8b93a7;  --faint:#525a6e;
--cyan:#3ad2ff;   --cyan-dim:rgba(58,210,255,.13);   /* keyed / deterministic / primary */
--violet:#9d8cff; --violet-dim:rgba(157,140,255,.15);/* keyless / sticky / secondary     */
--amber:#f5a524;  --amber-dim:rgba(245,165,36,.13);  /* hazard ONLY (repartition, warn)  */
```

**Semantics (keep consistent):** cyan = deterministic/keyed/primary action; violet = keyless / sticky
/ secondary; amber = hazard/warning **only** (don't use it as a category color). The base uses a
subtle *horizontal* scanline (`repeating-linear-gradient(0deg,…)`), never the BullMQ diagonal hatch.

## Type
- **Display + data:** monospace — `ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace`.
  Headings, offsets, keys, hash math all mono. Offline-safe (no web fonts).
- **Prose/body:** system sans — `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`.
- Micro-labels: mono, uppercase, `letter-spacing:.13–.24em`, `--faint`.

## Motifs
- **Ledger offset gutter:** monotonic offsets (`00,01,02…`) down each partition, hairline right border.
- **Signal path / pipeline:** the signature — a horizontal chain of chips that *fires* (a light sweep
  + destination chip lights up) when something routes/resolves.
- **Landing flash:** target element briefly outlined in the record's color (cyan keyed / violet keyless).

## Floor
Responsive (columns → horizontal scroll on narrow), visible `:focus-visible` outlines, and
`@media (prefers-reduced-motion:reduce){ *{animation:none} }`.

## Built with this system
- `02-partitioning.html` — Partition Router (key → murmur2 → % N → partition; per-partition ordering).
