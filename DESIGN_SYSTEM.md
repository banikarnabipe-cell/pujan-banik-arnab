# DESIGN_SYSTEM.md - Pujan Banik Arnab portfolio (v0.7.2)

The design language was extracted from [theretriever.app](https://theretriever.app/)
as **reusable, non-copyrightable patterns only** — hierarchy, spacing rhythm,
color relationships, interaction behavior, density. No logos, copy, imagery,
fonts, or proprietary code were copied. The two intentionally reused reference
artifacts (hero `wave.js`, About `decay-{1,2,3}.svg`) are byte-verified,
hash-logged, and license-flagged in `docs/reference-assets/PROVENANCE.md`.

---

## 1. Design principles

1. **Technical, trustworthy, minimal.** Flat neutral surfaces, hairline
   separators, mono micro-labels — a "schematic" voice. Depth is the exception
   (only floating windows and featured cards elevate).
2. **One canvas, one accent.** A pure-neutral gray ramp around the exact
   reference canvas (`#ECECEC` light / `#1E1E1E` dark), ink primary, and a
   single amber accent (`#D69957` dark / `#8C4A26` light) used sparingly.
3. **Contrast is a gate, not a goal.** Every text role is QA-measured against
   its effective background in BOTH schemes (AA enforced, AAA for ink body).
4. **Motion is functional.** State feedback, one scroll-reveal system, one
   ambient hero wave. No decorative loops. Runs for every user (v0.7.0
   policy — see §8).
5. **Hero-only dots.** Exactly one dotted surface on the site.

## 2. Material 3 adaptation

The token architecture is M3 (Material You) color roles + type roles + shape
scale + state layers + elevation — **tailored** to this identity rather than a
generic Material clone:

- **Color roles** map 1:1 to M3 (`surface`, `surface-container-*`, `on-surface`,
  `outline-variant`, `primary`, `tertiary`…) but the palette is a pure-neutral
  ramp anchored to the reference canvases; filled CTAs invert
  (canvas↔ink), like the reference's `.btn.primary`.
- **Dark-first parity**: the reference ships `:root` = dark with a
  `prefers-color-scheme: light` override; this repo emits the equivalent
  runtime behavior (`:root` = light values, `@media (prefers-color-scheme:
dark)` overrides on the same role properties). Runtime result is identical:
  the OS setting always resolves exactly one scheme. Verified value-equal to
  the reference palette (surface `#1E1E1E`, panel `#262626`, text `#FFFFFF`,
  muted `#9A9A9A`, separator `#343434`, amber `#D69957`).
- **Shape**: corners stay small (schematic voice) — `xs 6px` is the default;
  `medium 12px` only where the reference uses card radius; `full` for pills.
- **Elevation**: levels 0–3, used only for the floating app window (level 2)
  and featured cards (level 1).
- **State layers**: M3 mechanism — `::after` veil of `currentColor` at
  hover `.08` / focus `.12` / pressed `.12` / dragged `.16`.

## 3. Token architecture (single source of truth)

```
packages/design-system/design-tokens.json     ← EDIT HERE (W3C DTCG)
        │  pnpm tokens  (build-tokens.mjs)
        ├─► dist/tokens.css   ← CSS custom properties (--md-sys-color-*,
        │                        --md-shape-*, --md-elevation-*, --md-sys-type-*,
        │                        --md-sys-motion-*, layout rhythm, dotwave)
        └─► dist/theme.css    ← Tailwind v4 @theme inline bridge
```

`theme.css` maps every role onto Tailwind namespaces **by reference**:

| Tailwind namespace                                           | Resolves to                                   | Example utility                                          |
| ------------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------------- |
| `--color-*`                                                  | `var(--md-sys-color-*)`                       | `bg-surface-container-lowest`, `text-on-surface-variant` |
| `--radius-*`                                                 | `var(--md-shape-*)`                           | `rounded-xs`, `rounded-md`                               |
| `--shadow-level*`                                            | `var(--md-elevation-*)`                       | `shadow-level1`                                          |
| `--text-*` (+`--line-height/--font-weight/--letter-spacing`) | `var(--md-sys-type-*)`                        | `text-headline-large`, `text-label-medium`               |
| `--font-sys-sans/mono`                                       | `var(--font-sans)` / `var(--font-mono)`       | `font-sys-mono`                                          |
| `--breakpoint-xs…4xl`                                        | QA widths 320/375/414/768/1024/1280/1440/1920 | `max-lg:…`                                               |
| `--ease-standard/decelerate/…`                               | `var(--md-sys-motion-easing-*)`               | `ease-standard`                                          |
| durations                                                    | plain tokens                                  | `duration-(--md-sys-motion-duration-medium2)`            |

Because the bridge uses `@theme inline`, utilities embed the **runtime**
`var()` — the dark-scheme media overrides cascade through every Tailwind
utility with zero duplication. **No hard-coded hex in components. Ever.**

Notes:

- Tailwind v4 is adopted **without preflight** — the app reset in
  `apps/web/src/styles/global.css` is authoritative (preflight would silently
  change rendering and break the contract gate).
- Layer order: `theme → utilities` are layered; app CSS stays unlayered (wins)
  until migration completes. New `@pba/ui` components use utilities cleanly.
- `apps/web/src/styles/tailwind.css` declares
  `@source "../../../packages/ui/src"` — v4 auto-detection only scans the Vite
  root, shared components live outside it.
- Legacy aliases (`--canvas`, `--ink`, `--btn-*`…) still resolve old var names
  to M3 roles; retire them as consumers migrate (Phase D/E backlog).

## 4. Typography scale

M3 roles, tailored: display/headline carry retriever-style negative tracking;
labels render in the mono schematic voice (uppercase, `+0.08em`).
Fonts: system sans stack (no webfont license risk) + `"SF Mono", Menlo,
Consolas` mono. Utilities: `text-display-large … text-label-small`.

## 5. Grid, spacing, breakpoints

- Container 1080px, gutter 24px, scene padding `clamp(4rem, 3rem+4.5vw, 6.5rem)`
  — extracted from the reference's rhythm, kept as layout tokens.
- Tailwind default spacing scale (0.25rem base) covers `p-0…p-24+`.
- Breakpoints are the QA viewport widths (see table above) — they intentionally
  deviate from Tailwind's defaults; components must never assume Tailwind's
  stock `md:`/`lg:` values.
- No horizontal overflow at any QA width — enforced by the contract gate
  (D4) at 8 viewports in both schemes.

## 6. Component inventory

Shared (`@pba/ui`, Tailwind-native, token-bridged):

| Component        | Variants                         | Notes                                                                                   |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| `Button`         | filled / outlined / tonal / text | mono label, state-layer veil, press shift                                               |
| `Card`           | outlined / elevated / filled     | surface-container roles                                                                 |
| `Chip`           | link or static                   | assist/filter chip                                                                      |
| `Divider`        | —                                | hairline                                                                                |
| `Microlabel`     | —                                | mono kicker/label                                                                       |
| `SectionHeading` | —                                | headline-large line blocks                                                              |
| `SceneShell`     | divider toggle                   | section wrapper + container + kicker                                                    |
| `AppWindow`      | tone: live / passive             | moved to `@pba/ui` verbatim (token-driven scoped styles; Tailwind conversion candidate) |

App-level (portfolio-specific, migrate opportunistically): Header, Hero,
FactsStrip, AboutScene, SkillsScene, ProjectsScene, ExperienceScene,
CredentialsScene, PrinciplesBlock, ContactScene, Footer.

Legacy global primitives (`.btn`, `.m3-card`, `.m3-chip`, `.microlabel`,
`.scene`, `.container`) remain in `global.css` for not-yet-migrated consumers;
new code must use `@pba/ui` instead.

**Adding a component:** build it in `packages/ui/src/components/*.astro`
(Tailwind utilities + token arbitrary values; scoped `<style>` only for
pseudo-element machinery), props typed `readonly …? | undefined` (repo uses
`exactOptionalPropertyTypes`), then consume via
`import X from "@pba/ui/components/X.astro"`. Run `pnpm typecheck` +
`pnpm qa:design`.

**Tailwind only generates utilities for files it scans.** `apps/web` is the
Vite root, so `packages/ui` is declared explicitly in
`apps/web/src/styles/tailwind.css`:

```css
@source "../../../../packages/ui/src"; /* FOUR levels up — relative to this file */
```

That path is relative to the CSS file (`apps/web/src/styles`), so reaching the
repo root takes four `..`. With the wrong depth Tailwind scans a directory
that does not exist, generates **no** utility classes, and the whole `@pba/ui`
package ships unstyled — the page still renders (the app-level CSS is
unlayered and wins) but the shared components look like plain links. If a
`@pba/ui` component ever looks unstyled, check this path first.

`components.manifest.json` is **generated** by
`tooling/scripts/build-manifest.mjs` from the source files (paths, component
list and props are derived; prose annotations live in that script). Run
`pnpm manifest` after adding or renaming a component; CI runs
`pnpm manifest:check` and fails on drift.

## 7. Accessibility

- Semantic HTML first; ARIA only where semantics can't express the pattern
  (role=table skill matrix, `role=img` figures with composed labels).
- `:focus-visible` = 3px primary outline, offset 3px; skip link; keyboard
  operable `<details name="faq">` accordion (native, no JS).
- Contrast gates run in BOTH schemes at every viewport (muted ≥ 4.5:1 on
  every container; ink ≥ 7:1).
- Touch targets ≥ 44px on primary actions.
- Viewport meta never disables zoom; `theme-color` + `color-scheme` are
  scheme-scoped.

## 8. Motion contract (v0.7.0 — owner directive)

**No `prefers-reduced-motion` suppression.** The site animates identically
for every user; JS is used deliberately for visual enhancement (reveal
orchestration, ambient hero wave). The a11y trade-off is explicit: WCAG 2.3.3
(AAA) recommends honoring the OS setting; this site keeps every animation
transform/opacity-only, ≤ 500ms, non-flashing, to keep vestibular risk low
while following the owner's direction. Full contract + rollback path:
`docs/MOTION.md`.

## 9. Do / Don't

**Do** use role tokens (or their Tailwind utilities) for every color, radius,
shadow, type, duration; keep the hero the only dotted surface; keep `body`
transparent; add components to `@pba/ui` when a second consumer appears.
**Don't** hard-code hex/px values in components; import `tokens.css` by hand
(Layout does it); hand-edit generated CSS; add layout-animating transitions
(width/height/margins); reintroduce reduced-motion gates without an explicit
decision; add npm/yarn lockfiles.

## 10. Deployment (Cloudflare)

- Target: **Cloudflare Workers (static assets)** — `wrangler.jsonc` at repo
  root; assets dir `./apps/web/dist`; no bindings; no secrets (fully static).
- `pnpm deploy` → production (top-level env); `pnpm deploy:preview` →
  a Cloudflare **Preview** of the current branch (served at
  `<branch>-<worker>.workers.dev`); `pnpm deploy:dry` → local validation.
- **Preview builds need the `previews` block** in `wrangler.jsonc`. Cloudflare
  runs a Preview build for every branch that is not the production branch, via
  `wrangler preview`, and that command refuses to run without it — the build
  then fails in about a second, before the build command even runs, and the
  "Workers Builds" check is red on every pull request. The block can be empty:
  this Worker has no preview-specific variables or bindings.
- **Observability is off** (`"observability": { "enabled": false }`). This
  Worker ships static assets only, and Cloudflare rejects a deploy that tries
  to attach Workers Logs / Tail Workers to such a Worker.
- Security headers + CSP live in `apps/web/public/_headers` (served from the
  asset root). The inline bootstrap script is pinned by sha256 — after
  changing it: `pnpm build && node tooling/scripts/csp-hash.mjs && pnpm build`.
- Custom domain + SSL: Cloudflare dashboard → Worker → Domains; headers and
  caching are asset-managed, no extra config.
- Deployment checklist: `pnpm install && pnpm build && pnpm typecheck &&
pnpm lint && pnpm test && pnpm qa && pnpm deploy:dry` → preview deploy → smoke test
  (hero wave animates, dark/light switch, FAQ opens, résumé downloads) →
  production deploy → post-deploy smoke test.

## 11. QA gates

| Gate                  | Scope                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:csp`         | every inline script sha256-pinned; no stale pins; `/reveal.js` external                                                                                               |
| `pnpm qa:csp:render`  | renders `dist` under the real `_headers`: no console errors, no failed requests, 45/45 reveals, hero `<h1>` visible                                                   |
| `pnpm qa:design`      | 125 checks: exact canvases both schemes, hero wave attrs/mask/paint/animation, hero-only dots, decay SVG reuse, overflow ×8 viewports, content, contrast both schemes |
| `pnpm qa:env`         | reduced-motion policy (tokens intact, wave animates), no-JS visibility, landscape overflow                                                                            |
| `pnpm qa:devices`     | iPhone 14 + Pixel 7 emulation (DPR + mobile UA applied)                                                                                                               |
| `pnpm qa:visual`      | 8-viewport full-page captures → `tool-results/qa/`                                                                                                                    |
| `pnpm manifest:check` | `components.manifest.json` still matches the source files                                                                                                             |
| `pnpm typecheck`      | astro check, 0 errors                                                                                                                                                 |

The browser gates use `playwright-core` (a devDependency) plus an installed
Chrome/Edge — `CHROME_BIN` or `PW_CHANNEL` override the binary. They serve
`apps/web/dist` with the production `_headers` applied, so they exercise the
deployed security policy rather than a header-less preview server.
