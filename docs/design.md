# Design system — portfolio v0.7.2

Single source of truth: `packages/design-system/design-tokens.json` (W3C DTCG-style, Material 3 role
architecture) → `pnpm tokens` → `packages/design-system/dist/tokens.css` (+ `dist/theme.css`, the Tailwind v4 `@theme inline` bridge) (generated; never
hand-edit). Components consume tokens only; content lives in `src/data/site.ts`.

## Color schemes (light + dark)

The site supports BOTH `prefers-color-scheme` values with the reference's exact
palette in each (live-verified 2026-10-22: headless-Chrome dark/light emulation
+ network CSS fetch; the live `style.css?v=33` is byte-identical to the archived
`docs/reference-assets/reference-style.css`, md5 `5a69e210…`). The reference is
dark-FIRST (`:root` = dark, light via `prefers-color-scheme: light`); we emit
the mirror structure (`:root` = light, `@media (prefers-color-scheme: dark)` =
dark) — runtime behavior is identical because the media query always resolves
to light or dark. No JS, no toggle, no cookies — pure CSS, like the reference.

| Role | Light | Dark (reference anchors) |
|---|---|---|
| surface (canvas) | #ECECEC | **#1E1E1E** (ref `--bg`) |
| on-surface | #131313 | **#FFFFFF** (ref `--text`) |
| on-surface-variant (muted) | #5D5D5D | **#9A9A9A** (ref `--text-2`, 5.92:1) |
| surface-container-lowest (cards) | #F4F4F4 | **#262626** (ref `--panel`) |
| outline-variant (hairlines) | #E6E6E6 | **#343434** (ref `--separator`) |
| tertiary | #8C4A26 | **#D69957** (ref `--amber`) |

- `Layout.astro` declares `<meta name="color-scheme" content="light dark">` and
  media-scoped `theme-color` metas (#ECECEC light / #1E1E1E dark).
- Filled buttons invert in dark (white fill + #1E1E1E ink) — exactly the
  reference's `.btn.primary { background: var(--text); color: var(--bg) }`.
- Hero window chrome stays dark in BOTH schemes (`inverse-surface` #262626 in
  dark), matching the reference's dark Look window.
- Dark container ramp (low #292929 / container #2C2C2C / high #303030 /
  highest #333333) is tuned so muted #9A9A9A keeps ≥ 4.5:1 on EVERY container
  (enforced by the A1 dark gates; floor measured 4.69:1).
- Wave dots flip `--dotwave-color` #000 → #FFF in dark — the reference paints
  `.wave` with `color: var(--text)`, which is #FFF in its dark scheme.
- Decay figures: byte-exact assets used as-is, exactly as the reference uses
  the same files in its own dark mode.
- Motion is scheme-independent: the dark block contains NO animation rules —
  no `animation: none`, no reduced-motion overrides, scroll reveals and the
  wave animation run identically in both schemes.

## Canvas & surfaces

- Canvas: `--md-sys-color-surface` — light **#ECECEC**, dark **#1E1E1E** (the
  exact reference body backgrounds), applied to `html` (opaque). `body` stays
  transparent.
- Every section shares the same flat canvas per scheme. Panel surfaces:
  `surface-container-lowest` #F4F4F4 / #262626, hairline `outline-variant`
  #E6E6E6 / #343434, 12px radius (M3 shape roles).
- Ink: `on-surface` #131313 / #FFFFFF (AAA 15.7:1 / 16.7:1 on canvas), muted
  `on-surface-variant` #5D5D5D / #9A9A9A (5.5:1 / 5.92:1).

## Dot system (verified against theretriever.app, 2026-10-22)

Live headless-Chrome forensics (DOM, computed styles, network log, canvas
pixel sampling — `tool-results/ref-forensics/report.json`) established:

| Surface on the reference | Actual mechanism | Our reuse |
|---|---|---|
| **Hero** | Animated `<canvas class="wave" data-speed="0.5" data-alpha="1.6" data-size="1.6">` painted by `wave.js` (48×26 grid, sinusoidal phase, radius/alpha ramp), dual linear-gradient mask, `mask-composite: intersect`; opacity 0.45 on phones | **Hero-only**, byte-exact: `public/wave.js` + token group `dotwave` |
| Cards | `.card::after` radial-gradient #C2C2C2 dots @14px, elliptical corner mask | NOT copied (would violate the hero-only dotted-surface rule) |
| Scene "What deleted means" | Content `<img>`s: `decay-1/2/3.svg` (ordered / scattered / faint dot matrices, 320×160, light+dark classes) | Byte-exact reuse as About Source/Move/Improve figures |

### Hero wave contract

- Markup: `<canvas class="wave">` is the hero's **first child**; attributes are
  injected from `design-tokens.json → dotwave` at build time (Hero.astro).
- Paint: `public/wave.js` (byte-exact reference port; md5
  `d3e409c930440ad2b1763632c75814c8`). Color = canvas computed `color`
  (`--dotwave-color` #000). DPR-aware; animates only on-screen; one rAF loop.
- Mask: `--dotwave-mask-x` (fade left of 42%) ∩ `--dotwave-mask-y` (fade below
  60%), `-webkit-mask-composite: source-in` / `mask-composite: intersect`.
- Stacking: `.hero { position: relative; overflow: hidden }`, canvas z-index 0,
  content `.grid` z-index 1.
- Responsive: `≤900px` → `opacity: var(--dotwave-mobile-opacity)` (0.45).
- Reduced motion: wave.js paints ONE still frame (its upstream behavior; no new
  suppression added — see docs/MOTION.md contract 6).

### Decay figures (About)

`decay-{1,2,3}.svg` are served from `public/assets/`, referenced by
`site.ts → about.states[].image` with meaningful alts; rendered bare
(320×160, `height: auto`) above figcaptions — no card, no dot background.
Pristine archives + md5s + license note: `docs/reference-assets/PROVENANCE.md`.

## Enforcement

`tooling/scripts/verify-design-contract.mjs` (125 checks) encodes the contract:
D1 canvas color in BOTH schemes, D2 wave presence/attrs/mask/paint/animation/
opacity/color-per-scheme, D3 hero-only dotted surface, D4 overflow, D5 decay
reuse, C1 content, A1 contrast in BOTH schemes (per-viewport dark pass +
full-page dark pass). Run after any token/component change. Evidence:
`tool-results/contract-darkmode.txt` (125/125 PASS),
`tool-results/darkmode-forensics/` (reference captures + live CSS),
`tool-results/darkmode-impl/` (our captures + side-by-side).
