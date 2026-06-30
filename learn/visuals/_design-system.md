# OGOH Visual Design System — shared spec for all lesson visuals

All `learn/visuals/NN-*.html` files share the **color system**, so they read as one
family — but **NOT the same UX.** Each visual gets whatever layout/interaction best fits
its concept. The shared part is purely the palette + color semantics; the chrome (top
bar, bottom nav, component structure) is **optional**, not mandatory.

The aesthetic is a **dark console**: near-black textured ground, a single coral primary
with glow, emerald for "ok/online", amber for "warning/lost", mono letter-spaced
uppercase micro-labels, rounded panels. Do **not** copy any specific screenshot or any
other lesson's layout — match the *coloring system* below and design a fresh UX.

> Each lesson is self-contained: build the visual for the current concept only. Don't
> rework, re-skin, or depend on older lessons' visuals.

## Hard rules

- **Self-contained single HTML file.** No external CSS/JS/fonts/CDNs — must open via
  `file://` with a double-click. One `<style>`, one `(() => { ... })()` IIFE `<script>`.
- Keep it under ~520 lines. Smooth, deliberate motion; nothing flashy for its own sake.
- **Bilingual labels (the OGOH flavor):** micro-labels and chrome in Uzbek
  (uppercase, letter-spaced), explanatory prose in English. Examples: HODISA, YETKAZILDI,
  NAVBAT, KUTMOQDA, ISHLADI, BAJARILDI, XATO, QAYTA URINISH, ONLAYN, OFLAYN, KECHIKISH.
- **Color semantics (consistent across all):** coral = primary action / active / alarm /
  danger; emerald = success / online / ok; amber = warning / retry / lost / stalled;
  muted grays = idle / waiting / inert.
- Each visual teaches **one** idea with a clear interaction and a live "verdict" line that
  updates as the user plays. Include a short English footnote tying it to the lesson.
- Canonical reference implementation: **`08-queue-vs-topic.html`**. Read it first.

## Tokens — paste this `:root` + body verbatim

```css
:root{
  --bg:#0b0b0d; --bg2:#070708;
  --panel:#141416; --panel2:#1a1a1d; --slot:#202024;
  --border:#2a2a2f; --border-soft:rgba(255,255,255,.06);
  --text:#ededed; --muted:#7c7c83; --muted2:#55555b;
  --coral:#ff6c5a; --coral-deep:#e63c2c; --coral-glow:rgba(255,92,70,.40);
  --emerald:#37d39a; --emerald-dim:rgba(55,211,154,.14);
  --amber:#e3a23a; --amber-dim:rgba(227,162,58,.14);
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}
*{box-sizing:border-box;}
html,body{margin:0;}
body{
  background:
    repeating-linear-gradient(45deg,rgba(255,255,255,.013) 0 2px,transparent 2px 11px),
    radial-gradient(120% 80% at 50% -10%,#15151a 0%,var(--bg) 55%,var(--bg2) 100%);
  color:var(--text); font:14px/1.55 var(--sans);
  min-height:100vh; padding:22px 20px 0; -webkit-font-smoothing:antialiased;
}
.wrap{max-width:760px;margin:0 auto;}
```

## Optional chrome — available if it fits, NOT required

These are reusable pieces you *may* use, but don't force the same frame on every visual.
Prefer a layout that serves the lesson's concept. Use them only where they help.

Top bar (swap the `obj-tag` / `obj-title` per lesson; keep the alarm mark + status pill):

```html
<div class="topbar">
  <div class="brand">
    <span class="mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M12 5V3"/><path d="M19 9l1-1"/><path d="M5 9 4 8"/></svg></span>
    <span class="name">OGOH</span>
  </div>
  <span class="pill on"><span class="dot"></span>Broker onlayn</span>
</div>
<div class="rule"></div>
<div class="obj-tag">Lesson NN · &lt;Uzbek subtitle&gt;</div>
<div class="obj-head"><div class="obj-title">&lt;Title&gt;</div> ...optional pill... </div>
```

Bottom nav (decorative chrome — keep all 5 tabs; set the relevant one `.active`):

```html
<div class="nav">
  <div class="tab active"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M12 5V3"/></svg>Trevoga</div>
  <div class="tab"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4a3 3 0 0 1 0 6"/><path d="M21 20a6 6 0 0 0-3-5"/></svg>Aholi</div>
  <div class="tab"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Tarix</div>
  <div class="tab"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 7v13l6-3 6 3 6-3V4l-6 3-6-3Z"/><path d="M9 4v13"/><path d="M15 7v13"/></svg>Xarita</div>
  <div class="tab"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>Sozlama</div>
</div>
```

## Shared component CSS — copy what each visual needs

```css
/* top bar / brand / pills */
.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.brand{display:flex;align-items:center;gap:10px;}
.brand .mark{color:var(--coral);display:flex;}
.brand .name{font-weight:700;letter-spacing:.34em;font-size:15px;}
.pill{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);
  background:var(--panel);border-radius:999px;padding:6px 13px;font-size:11px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--muted);}
.pill .dot{width:7px;height:7px;border-radius:50%;background:var(--muted2);}
.pill.on{color:var(--emerald);border-color:rgba(55,211,154,.32);}
.pill.on .dot{background:var(--emerald);box-shadow:0 0 8px var(--emerald);}
.rule{height:1px;background:var(--border-soft);margin:14px 0 16px;}
.obj-tag{font-size:11px;letter-spacing:.2em;color:var(--muted2);text-transform:uppercase;margin-bottom:4px;}
.obj-head{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.obj-title{font-size:25px;font-weight:700;letter-spacing:-.01em;}

/* primary glowing coral button (the "dial") */
.emit-btn{position:relative;border-radius:50%;border:0;cursor:pointer;color:#fff;
  background:radial-gradient(circle at 50% 38%,#ff8a72 0%,var(--coral) 42%,var(--coral-deep) 100%);
  box-shadow:0 0 0 1px rgba(255,120,90,.5),0 0 46px 6px var(--coral-glow),
    inset 0 -8px 26px rgba(150,20,10,.5),inset 0 6px 18px rgba(255,200,180,.32);
  transition:transform .08s ease, box-shadow .2s;}
.emit-btn:active{transform:scale(.96);}

/* generic pill button + secondary */
.btn{background:var(--coral);color:#2a0a05;border:0;border-radius:10px;padding:10px 18px;
  font:inherit;font-weight:700;letter-spacing:.04em;cursor:pointer;}
.btn.sec{background:var(--slot);color:var(--text);border:1px solid var(--border);}
.btn:disabled{opacity:.5;cursor:not-allowed;}

/* segmented control */
.seg{display:flex;gap:6px;background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:5px;}
.seg button{flex:1;border:0;background:transparent;color:var(--muted);cursor:pointer;padding:11px 10px;
  border-radius:8px;font:inherit;font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;transition:.18s;}
.seg button.active{background:var(--slot);color:var(--text);box-shadow:inset 0 0 0 1px var(--border);}

/* card / node */
.card{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:16px 18px;}
.node{position:relative;background:var(--panel);border:1px solid var(--border);border-radius:14px;
  padding:14px 12px;transition:.2s;overflow:hidden;}
.node.hit{border-color:var(--coral);box-shadow:0 0 22px var(--coral-glow);}

/* a "job" chip / token that flies or sits in a lane */
.chip{display:inline-flex;align-items:center;gap:6px;background:var(--slot);border:1px solid var(--border);
  border-radius:8px;padding:5px 9px;font-family:var(--mono);font-size:12px;}
.chip.ok{border-color:rgba(55,211,154,.4);color:var(--emerald);}
.chip.bad{border-color:rgba(227,162,58,.4);color:var(--amber);}
.token{position:fixed;width:13px;height:13px;border-radius:50%;pointer-events:none;z-index:50;
  background:var(--coral);box-shadow:0 0 12px 2px var(--coral-glow);
  transition:transform .5s cubic-bezier(.5,0,.3,1),opacity .5s;will-change:transform;}

/* badges */
.badge{font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:999px;}
.badge.got{background:var(--emerald-dim);color:var(--emerald);}
.badge.warn{background:var(--amber-dim);color:var(--amber);}
.badge.idle{background:var(--slot);color:var(--muted);}

/* big-number ledger + verdict */
.ledger{display:flex;align-items:center;gap:22px;background:var(--panel);border:1px solid var(--border);
  border-radius:16px;padding:16px 18px;}
.ledger .num{font-family:var(--mono);font-size:34px;font-weight:700;line-height:1;}
.ledger .num.coral{color:var(--coral);} .ledger .num.eme{color:var(--emerald);} .ledger .num.amb{color:var(--amber);}
.ledger .l{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);margin-top:5px;}
.ledger .verdict{flex:1;font-size:12.5px;color:var(--muted);line-height:1.5;
  border-left:1px solid var(--border-soft);padding-left:18px;}
.ledger .verdict b{color:var(--text);}

/* segmented progress bars (emerald) */
.bars{display:flex;gap:3px;align-items:flex-end;height:30px;}
.bars i{width:6px;background:var(--slot);border-radius:2px;transition:.2s;}
.bars i.on{background:var(--emerald);box-shadow:0 0 6px var(--emerald-dim);}

/* mono log */
.log{background:#070709;border:1px solid var(--border);border-radius:12px;padding:12px 15px;
  font-family:var(--mono);font-size:12px;max-height:150px;overflow:auto;}
.log div{padding:1.5px 0;color:var(--muted2);}
.log .hl{color:var(--text);} .log .ok{color:var(--emerald);} .log .cor{color:var(--coral);} .log .amb{color:var(--amber);}

/* footnote */
.footnote{font-size:12.5px;color:var(--muted);max-width:720px;margin:16px 2px 0;line-height:1.6;}
.footnote b{color:var(--coral);} .footnote .g{color:var(--emerald);}

/* bottom nav chrome */
.nav{position:sticky;bottom:0;margin:26px -20px 0;padding:12px 0 16px;
  background:linear-gradient(180deg,transparent,var(--bg2) 40%);
  display:flex;justify-content:center;gap:34px;border-top:1px solid var(--border-soft);}
.nav .tab{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11px;letter-spacing:.05em;color:var(--muted2);}
.nav .tab.active{color:var(--coral);}
```

## Optional flourishes (use where they fit the concept)

- **Sunburst tick-ring** behind a circular element (see 08's `sun()`): radar/alarm feel.
- **Flying token** from A→B: `position:fixed`, set `transform:translate(dx,dy)` on next
  frame, remove after the transition. Used for "a job moving between places."
- **Countdown / lock bar**: a `.bars`-style fill that drains over time (timers, TTL, backoff).
- **Pulse** the coral dial on action via `element.animate([...],{duration})`.
