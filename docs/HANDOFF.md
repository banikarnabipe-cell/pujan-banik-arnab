# Handoff — Portfolio of Pujan Banik Arnab (v0.7.2, styling + portable QA gates)

This repo builds the personal portfolio of **Pujan Banik Arnab, Industrial &
Production Engineer**, on the retriever-inspired structural foundation (no
copied assets), restyled with a **Material 3 tailored token system** on the
**exact reference canvas** — light **#ECECEC**, dark **#1E1E1E**, both
live-verified from theretriever.app. **The hero is the ONLY dotted surface**,
carrying the reference's **actual hero pattern — the animated canvas dot
wave** (verified by live-browser forensics); every other section, panel and
figure is flat canvas.

**v0.7.2 changes (shared UI package was shipping unstyled; QA gates made portable):**
Two live production defects, found by measuring the built CSS rather than by
reading the source. (1) **Tailwind generated ZERO utility classes for
`@pba/ui`.** The `@source` path in `apps/web/src/styles/tailwind.css` was
`../../../packages/ui/src`; that path resolves relative to the CSS file
(`apps/web/src/styles`), so it pointed at `apps/packages/ui/src` — a directory
that does not exist. Tailwind therefore scanned nothing, and the shared
`Button` (used by the hero and the skills scene) shipped with no background, no
radius, no padding, no uppercase and with the browser's default underline —
plain links instead of Material-3 buttons. The page still looked broadly right
because the app-level CSS is deliberately unlayered and wins, which is exactly
why the defect survived review. Fixed to `../../../../packages/ui/src`; the
built stylesheet grows 35 KB → 43 KB and every utility the shared package
uses appears. (2) **The filled button was white-on-white.** With (1) fixed,
`bg-primary` resolved to #FFF (the dark-scheme primary) but `text-on-primary`
did not apply, because the app reset's `a { color: inherit }` sits in
_unlayered_ `global.css`, and unlayered rules beat every layered rule — so it
overrode the Tailwind colour utility and the label inherited the page ink.
The reset now lives in `@layer base`, where the utility layer wins again.
(3) **Two elevation tokens were named wrongly**: `box-shadow: var(--md-elevation-1)`
(`global.css`) and `var(--md-elevation-2)` (`AppWindow.astro`) referenced names
the compiler never emits (it emits `--md-elevation-level1/2`), so an undefined
`var()` voided the whole declaration and the floating app-window card and the
elevated card rendered with **no shadow at all**. Now `--md-elevation-levelN`.
(4) **The QA gates could only run on one machine.** They resolved
`playwright-core` from an absolute path in a _different_ repository, attached
to a hand-started Chrome over CDP on a hardcoded port, expected a preview
server on port 3000, and wrote screenshots to `/home/z/...`. New shared helper
`tooling/scripts/lib/browser.mjs` resolves everything from this repo: the
browser is launched by the gate itself (playwright-core + an installed
Chrome/Edge via `channel`), and the site is served from `apps/web/dist` with
the **real `dist/_headers`** applied, so the gates exercise the production
Content-Security-Policy instead of a header-less preview. `playwright-core` is
now a devDependency; **no browser download is needed** (CI runners and
developer machines both ship Chrome). (5) **The browser gates are now in CI**
(`pnpm qa:csp:render`, `pnpm qa:env`, `pnpm qa:design`) — the design contract
and the CSP render harness previously ran nowhere automatically, which is why
(1) and (2) shipped. (6) **Dead weight removed**: the orphan
`apps/web/src/styles/tokens.css` (an unimported duplicate of the generated
token file that still carried the _removed_ reduced-motion block), three REA
toolchain scripts belonging to another project, the bash-only
`qa-capture.sh` (needed an uninstalled `agent-browser` CLI) — replaced by
`tooling/scripts/visual-capture.mjs` — and the leftover
`rea-agent` / `agent-context` / `skills` references in `apps/web/tsconfig.json`,
`apps/web/astro.config.mjs` and `.gitignore`. Also fixed: `SceneShell`'s
`divider` prop was destructured but never used (it always drew a hairline);
`device-qa.mjs` declared a device pixel ratio and a mobile user-agent but
never applied them, so the "iPhone 14 @ DPR 3" claim was false — both are now
actually applied. (7) **`components.manifest.json` is now
generated** by `tooling/scripts/build-manifest.mjs` from the source files
(22 components with correct paths and props, derived — not hand-written);
`pnpm manifest:check` fails on drift and runs in CI. (8) Docs corrected:
`docs/QA-CHECKLIST.md` still described v0.6.0 behaviour and npm commands and
claimed the reduced-motion still-frame (the opposite of the shipped policy);
`DESIGN_SYSTEM.md`, `README.md`, `docs/MOTION.md`, `SECURITY.md` and the token
file's own description carried pre-monorepo paths.
QA (clean checkout, Windows): contract **125/125**, CSP render **6/6**,
env-emulation **7/7**, CSP coverage **6/6**, astro check **0/0/0**, build green,
dry-run green (12 assets, 0 bindings), manifest check green.

**v0.7.1 changes (CSP fix — content invisible on production):**
Production showed only background/nav/footer while every `[data-reveal]`
block (hero, scenes, cards) stayed at `opacity: 0`. Root cause: the CSP in
`apps/web/public/_headers` pinned a single inline-script hash, but Astro
**auto-inlines small processed `<script>` blocks** — the reveal observer
shipped as a second, unpinned inline script and was silently blocked on the
edge, so the IntersectionObserver never ran. Local QA missed it because
`astro preview` sends no CSP. Fix: (1) reveal logic moved OUT of Layout.astro
into `apps/web/public/reveal.js` — external scripts are covered by
`script-src 'self'`, zero hash maintenance; (2) `tooling/scripts/csp-hash.mjs`
now pins **every** inline script and self-verifies; (3) new permanent gates:
`tooling/scripts/verify-csp.mjs` (static, runs in CI) and
`tooling/scripts/verify-csp-render.mjs` (serves dist with the real
`_headers`, asserts zero console errors + 45/45 reveals + visible `<h1>`;
run as `pnpm qa:csp` / `pnpm qa:csp:render`, also usable against a live URL
via `SITE=<url>`); (4) CI deploy smoke test now requires real content
markers, not just HTTP 200. Same-day context: Worker name aligned with the
Cloudflare Git integration + `wrangler.jsonc` gained `build.command` so every
deploy path self-builds (fixes the Workers Builds check).

**v0.7.0 changes (pnpm monorepo + Tailwind v4 + motion policy):**
(1) Restructured to a pnpm workspace: `apps/web` (Astro app),
`packages/design-system` (owns design-tokens.json + compiler; emits
dist/tokens.css + NEW dist/theme.css), `packages/ui` (shared M3 components),
`packages/config` (tsconfig/prettier), `tooling/scripts` (QA + CSP hash +
résumé). npm is gone — `packageManager: pnpm@12.14.0`, `pnpm-lock.yaml`.
(2) Tailwind CSS v4 (4.3.3) adopted CSS-first via `@tailwindcss/vite`, **no
preflight**; `theme.css` maps every M3 role onto Tailwind namespaces with
`@theme inline` — utilities resolve the runtime custom properties, so the
dark-scheme media overrides flow through with zero duplication. Tailwind
scans the ui package via `@source` (v4 auto-detection is Vite-root-only).
(3) Motion policy (owner directive): **reduced-motion suppression removed** —
token-zeroing block deleted from the compiler, reveal observer no longer
gates on the preference, `wave.js` still-frame branch patched out (documented
delta from the byte-exact reference copy, which stays pristine in
docs/reference-assets/). QA expectations flipped: under `reducedMotion:
reduce` the gate now REQUIRES motion (tokens intact, observer engaged, wave
animating). Trade-off documented in MOTION.md §policy.
(4) `@pba/ui` primitives: Button/Card/Chip/Divider/Microlabel/SectionHeading/
SceneShell (Tailwind-native, state-layer veils via arbitrary variants) +
AppWindow (moved verbatim). Hero actions consume `Button`; scenes import
AppWindow cross-package. Props use `… | undefined` (exactOptionalPropertyTypes).
(5) Cloudflare: Workers static-assets config (`wrangler.jsonc`, no bindings,
no secrets), preview env as a separate Worker, `_headers` security set with a
sha256-pinned CSP for the inline bootstrap (`tooling/scripts/csp-hash.mjs`).
`wrangler deploy --dry-run` validated (11 assets, 0 bindings).
(6) Docs: README rewritten for the monorepo; DESIGN_SYSTEM.md added
(design language, M3 adaptation, token bridge, components, a11y, motion,
deployment); components.manifest.json backgroundSystem corrected to the
canvas-wave reality (v0.4-era dotgrid description removed).
QA: contract 125/125, env-emulation 7/7 (new policy), astro check 0/0/0,
build green, dry-run green.

**v0.6.0 changes (dark mode = the reference's dark palette):** live
headless-Chrome forensics proved theretriever.app is DARK-FIRST — its `:root`
carries the dark palette (`--bg #1E1E1E`, `--panel #262626`, `--text #FFFFFF`,
`--text-2 #9A9A9A`, `--separator #343434`, `--amber #D69957`), and light
arrives via `@media (prefers-color-scheme: light)`; the live `style.css?v=33`
is byte-identical to the archived copy (md5 `5a69e210…`). Implemented: (1) new
`mdSysColorDark` token group anchored to those exact values (derived roles:
M3 dark-container ramp tuned darker so muted #9A9A9A holds ≥ 4.5:1 on every
container — enforced by A1 dark gates); (2) `build-tokens.mjs` emits
`@media (prefers-color-scheme: dark)` overrides on the same role custom
properties — zero component changes needed (everything consumes role tokens);
(3) `--dotwave-color` flips #000 → #FFF in dark (reference paints `.wave` with
`color: var(--text)`); (4) `Layout.astro`: `<meta name="color-scheme"
content="light dark">` + media-scoped theme-color (#ECECEC/#1E1E1E) — the old
`content="light"` would have force-pinned light rendering; (5) filled buttons
invert like the reference's `.btn.primary`. No animation rules exist in the
dark block — motion contract untouched, no new reduced-motion overrides.
QA gate grew 82 → 125 checks (dark canvas/text/wave/contrast in both schemes);
125/125 PASS.

**v0.5.0 changes (dot-pattern forensics & faithful reuse):** the v0.4.0 "exact
reference pattern" claim was debunked by live headless-Chrome forensics of
theretriever.app (DOM + computed styles + network + canvas pixel sampling,
`tool-results/ref-forensics/`): the reference hero's dots are an ANIMATED
`<canvas class="wave" data-speed="0.5" data-alpha="1.6" data-size="1.6">`
painted by `wave.js` behind a dual linear-gradient mask (`mask-composite:
intersect`), NOT a CSS gradient. The old `.hero::before` radial-gradient was
actually the reference's **card-corner** texture. Fixes: (1) `public/wave.js`
— byte-exact port of the reference's wave.js (md5 in PROVENANCE); (2) hero
canvas with token-driven attributes (`dotwave` group, imported from
design-tokens.json at build time); (3) reference-exact mask/stacking/overflow
CSS; mobile damping opacity 0.45 ≤900px (project's hero stack breakpoint);
(4) the three verified `decay-{1,2,3}.svg` dot-matrix illustrations (scene
"What deleted means") reused BYTE-EXACT as the About Source/Move/Improve state
figures — content `<img>`s, so the hero-only dotted-surface rule holds; the
invented striped meters were retired. No new reduced-motion suppression was
added — wave.js's own still-frame behavior is the reference's native behavior.

**v0.4.0 changes:** design delta — page-wide dot-field deleted; neutral family
re-anchored to pure grays around the exact `#ECECEC` canvas; brand mark re-drawn
(no circles); hero sonar removed. Content — specifics merged from the owner's
previous portfolio (pujan-banik-arnab.netlify.app): thesis co-authors/supervisor

- L18/ANOVA figures, crusher QFD cycle, SSC entry, phone in footer, full
  address. Voice stays dual-audience: (a) employers hiring IPE / supply-chain
  engineers, (b) graduate admissions & visa officers — stated focus: MSc in
  Supply Chain Management. The résumé PDF (`public/resume.pdf`) is the real,
  ATS-safe CV — regenerate with `python3 scripts/make-resume.py`.

## Identity values now baked in (verify before going live)

| Field          | Value                                                                                                                                     | Where                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Email          | `banikarnab.ipe@gmail.com`                                                                                                                | contact actions, credentials, footer |
| LinkedIn       | `linkedin.com/in/pujan-banik-arnab`                                                                                                       | contact + footer (taken from CV)     |
| Phone          | `+880 1792 514506` (tel: link)                                                                                                            | contact actions; also in résumé PDF  |
| Location       | Jigatola, Dhanmondi, Dhaka                                                                                                                | facts strip, hero kicker, contact    |
| Employers      | Excellent Ceramics Group (May 2025–), PRAN Beverage Ltd / PRAN-RFL (Apr 2022–May 2023)                                                    | experience timeline                  |
| Education      | B.Sc. IPE, AUST (2017–2022, CGPA 2.95); HSC Science, MC College Sylhet (GPA 5.00); SSC Science, Sylhet Govt. Pilot High School (GPA 5.00) | credentials                          |
| Certifications | Supply Chain Logistics / Operations — Coursera                                                                                            | credentials                          |
| Résumé PDF     | real CV, 2 pages, generated from `scripts/make-resume.py`                                                                                 | `public/resume.pdf`                  |
| Favicon        | original pulse-line mark, neutralized to v0.4.0 tokens (`public/favicon.svg`)                                                             | swap if a personal logo exists       |

Reference contact details are intentionally kept in the **résumé PDF only**,
not on the open web (credentials card states "available on request").

## Architecture

- **Tokens:** `packages/design-system/design-tokens.json` (W3C DTCG, M3 role
  architecture) → `pnpm tokens` → `packages/design-system/dist/tokens.css`
  (generated; never hand-edit) + `dist/theme.css` (Tailwind `@theme inline`
  bridge — utilities resolve the same runtime variables). Legacy aliases keep
  old var names resolving to M3 roles. display-large floor is `2.4rem` so the
  H1 fits a 320 px viewport without horizontal overflow.
- **Background (v0.6.0):** `html` carries the opaque canvas — `#ECECEC` light,
  `#1E1E1E` dark via `@media (prefers-color-scheme: dark)` in tokens.css; `body` is
  transparent (do NOT give it a background — that would stack above the wave).
  `.hero` is `position: relative; overflow: hidden`; its first child is
  `<canvas class="wave">` (absolute, inset 0, z-index 0, `color:
--dotwave-color`), masked by `--dotwave-mask-x/y` composited with
  `intersect`; content (`.grid`) sits at z-index 1. Paint is driven by
  `public/wave.js` (byte-exact reference port). Wave parameters live in the
  `dotwave` token group (single source of truth: canvas data-attributes are
  injected from `design-tokens.json` at build time; verify-design-contract D2
  enforces equality). The old `dotgrid` radial-gradient group was removed.
  Verified reference dot-matrix SVGs (`decay-1/2/3.svg`) are served from
  `public/assets/` and used ONLY as About content figures; pristine archives +
  provenance/md5s: `docs/reference-assets/`. Other schematic language:
  solid/hatch zone fills (Experience).
- **Components:** all scenes follow portfolio semantics (About/Skills/Projects/
  Experience/Credentials/Contact + PrinciplesBlock); buttons/cards/chips follow
  M3 variants with state layers. Inventory: `components.manifest.json` —
  **generated** by `tooling/scripts/build-manifest.mjs` (paths, component list
  and props are derived from the source; prose annotations live in that
  script). Run `pnpm manifest` after adding or renaming a component;
  `pnpm manifest:check` (in CI) fails on drift.
- **Tailwind source path (v0.7.2):** `apps/web/src/styles/tailwind.css`
  declares `@source "../../../../packages/ui/src"`. The path is relative to
  that CSS file, so the repo root is FOUR levels up. With the wrong depth
  Tailwind scans nothing and the whole `@pba/ui` package ships unstyled —
  a regression that shipped once (v0.7.2 fix). Check this first if a shared
  component ever looks unstyled.
- **Content:** single typed model `apps/web/src/data/site.ts`. Section order
  mirrors it in `apps/web/src/pages/index.astro`.
- **Dev/preview hosts:** `astro.config.mjs` sets `vite.server.allowedHosts` and
  `vite.preview.allowedHosts: true` — the preview gateway proxies through
  rotating hosts (`*.space-z.ai`, `ws-*.fcapp.run`); without this the Vite host
  check blocks the preview with "Blocked request".

## Section mapping (implemented)

| Scene          | id             | Content source                                                                                                               |
| -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Hero           | `#top`         | `site.hero` — headline, intro, résumé/experience/email CTAs, profile window                                                  |
| Facts strip    | —              | `site.facts` — Education / Current role / Certified / Based in                                                               |
| 01 About       | `#about`       | `site.scenes.about` — floor→border narrative + Source/Move/Improve states with verified decay-1/2/3.svg dot-matrix figures   |
| 02 Skills      | `#skills`      | `site.scenes.skills` — window matrix (core/working/learning, 8 CV core skills) + Buy/Move/Make cards                         |
| 03 Projects    | `#projects`    | `site.scenes.projects` — thesis, crusher, import desk, procurement cycle                                                     |
| 04 Experience  | `#experience`  | `site.scenes.experience` — honest time-split strip, quote, two real roles                                                    |
| 05 Credentials | `#credentials` | `site.scenes.credentials` (Education featured + Certifications & references) + `site.principles` ("How I work")              |
| 06 Contact     | `#contact`     | `site.contact` — email/LinkedIn/résumé/phone + dual-audience FAQ (roles, graduate study, procurement, documents, references) |

## Re-theming for a future brand (Phase 3, if ever)

1. Edit `packages/design-system/design-tokens.json` (colors/type/shape/`dotwave`
   values) → `pnpm tokens`.
2. Swap copy in `apps/web/src/data/site.ts`.
3. To change the hero wave mood, edit `dotwave` (color/speed/alpha/size/masks/
   mobileOpacity) — the canvas attributes and CSS re-compile automatically
   (`npm run build`); the animation engine itself stays the byte-exact wave.js.
   No component file needs to change — that separation is enforced by the content
   model and generated tokens.

## Verification harness (rerun after changes)

```bash
pnpm tokens        # regenerate dist/tokens.css + theme.css after editing design-tokens.json
pnpm typecheck     # astro check (TypeScript strict) → 0 errors
pnpm build         # static production build (apps/web/dist)
pnpm qa            # every gate: qa:csp → qa:csp:render → qa:env → qa:design
pnpm qa:csp        # static: every inline script sha256-pinned
pnpm qa:csp:render # browser: dist served with the real _headers; nothing blocked
pnpm qa:env        # motion-policy + no-JS + landscape gates
pnpm qa:design     # 125 checks (both schemes, wave, hero-only dots, decay reuse, overflow, content, contrast)
pnpm qa:devices    # iPhone 14 + Pixel 7 emulation sweep
pnpm qa:visual     # 8-viewport full-page sweep
pnpm manifest:check # components.manifest.json still matches the source files
pnpm deploy:dry    # wrangler validation (assets, headers, envs)
python3 tooling/scripts/make-resume.py   # regenerate résumé PDF from CV data
```

The browser gates need no preview server, no external Chrome and no CDP
endpoint: `tooling/scripts/lib/browser.mjs` launches the browser itself and
serves `apps/web/dist` with the production `_headers` applied. They need
`playwright-core` (a devDependency) and an installed Chrome or Edge —
override with `CHROME_BIN` or `PW_CHANNEL` (`chrome`, `msedge`).

Regression to watch: **horizontal overflow at 320 px**. Root causes fixed in
v0.3.0: `repeat(14, 1fr)` pulse-grid → `repeat(14, minmax(0, 1fr))`; hero grid
mobile column → `minmax(0, 1fr)`; H1 token floor 2.75rem → 2.4rem. If a new
element reintroduces overflow, hunt for bare `1fr` grid columns holding
non-wrapping content.

Second regression class (v0.4.0, updated v0.5.0): **hero dots vanish**. Cause:
an opaque `background` on `body` stacks above the wave layer. Symptom: the
canvas element exists and computed styles look right, but pixels are flat.
Diagnose by canvas pixel sampling (the D2 checks do this). Fix: keep `body`
transparent; only `html` carries the canvas color. Related: removing
`overflow: hidden` from `.hero`, or moving the canvas out of the hero's
stacking context.

Third regression class (v0.7.2): **the shared UI package ships unstyled**.
Cause: the `@source` path in `apps/web/src/styles/tailwind.css` pointed one
folder level too shallow, so Tailwind scanned a directory that does not exist
and generated **no** utility classes for `packages/ui`. Symptom: the page
still looks broadly right (the app-level CSS is unlayered and wins over
utilities), but every `@pba/ui` component renders unstyled — plain links
instead of Material-3 buttons. Diagnose by counting the utility selectors in
the built stylesheet, not by reading the source. Two rules came out of it:
the `@source` path needs FOUR levels up, and the app reset's
`a { color: inherit }` must live in `@layer base` (unlayered rules beat
layered ones, which silently killed the button's colour utility and produced
a white-on-white label).

QA evidence lands in `tool-results/qa/` (`site-*.png`, `device-*.png`).
Reference forensics evidence: `tool-results/ref-forensics/` (report.json +
reference screenshots) and `tool-results/impl-captures/` (implementation
captures). Reference source snapshots + verified assets: `docs/reference-assets/`.
