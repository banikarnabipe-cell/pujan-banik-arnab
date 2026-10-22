# Visual QA checklist — portfolio v0.7.2

Legend: [A] automated (script), [M] manual. Re-run the full matrix after any
token, component, or content change.

All browser gates launch their own browser (playwright-core + an installed
Chrome/Edge) and serve `apps/web/dist` with the **real `dist/_headers`
applied**, so they exercise the production Content-Security-Policy. No
external Chrome, no CDP endpoint, no preview server needed.

## 1. Viewports (screenshot sweep, full page) — `pnpm qa:visual` [A]

- [ ] 320×568 — no horizontal scroll; H1 = 2 lines; nav wraps centered; buttons full-width stacked
- [ ] 375×812 — facts 1-col; tables collapse gracefully
- [ ] 414×896 — same as 375 expectations
- [ ] 768×1024 — hero stacks; app window full-width
- [ ] 1024×768 — 2-col project cards; 3-col cards where applicable
- [ ] 1280×800 — desktop rhythm begins; container centered
- [ ] 1440×900 — reference-rhythm layout (container 1080)
- [ ] 1920×1080 — no stretched content; hero dot wave renders cleanly (canvas full-bleed, no seams)

## 2. Device emulation — `pnpm qa:devices` [A]

- [ ] iPhone 14 (390×844, DPR 2 capped, mobile UA, touch) — no overflow + full-page capture
- [ ] Pixel 7 (412×915) — no overflow + full-page capture
- [ ] Landscape 844×390 — no horizontal overflow (`pnpm qa:env`)

## 3. Environment modes — `pnpm qa:env` [A]

- [ ] `prefers-reduced-motion: reduce` — motion STILL RUNS (v0.7.0 policy): duration
      tokens are NOT zeroed, the reveal observer stays engaged, and the hero wave
      still animates
- [ ] JS disabled — `html.js` gate absent; 100% of content visible
- [ ] Landscape overflow — none

## 3b. Design contract — `pnpm qa:design` [A] (125 checks)

- [ ] D1 — light canvas `#ECECEC` exactly AND dark canvas `#1E1E1E` exactly
      (html bg, via `colorScheme` emulation) at all 8 viewports; dark body text #FFFFFF
- [ ] D2 — hero pattern is the reference's ACTUAL hero pattern: animated `canvas.wave`
      (first child, data-speed 0.5 / alpha 1.6 / size 1.6 / 48×26), dual linear-gradient
      mask composited with intersect, color #000 light / #FFF dark, full-bleed rect,
      painted pixels present, ANIMATING (canvas pixel diff) — for EVERY user, including
      under reduced motion
- [ ] D3 — hero is the ONLY dotted SURFACE: no `radial-gradient(circle…)` backgrounds
      anywhere (elements and ::before/::after), zero extra `canvas.wave` outside the hero
- [ ] D4 — zero horizontal overflow at all 8 viewports
- [ ] D5 — About states reuse the verified decay SVGs (`/assets/decay-{1,2,3}.svg`, 320×160, loaded)
- [ ] C1 — content sanity: enriched thesis (L18/ANOVA), crusher (QFD/SolidWorks), SSC entry, address, email + LinkedIn + phone links, résumé download
- [ ] A1 — contrast in BOTH schemes: every paragraph ≥ 4.5:1 vs its EFFECTIVE background;
      primary-ink paragraphs ≥ 7:1; muted labels ≥ 4.5:1 (per-viewport dark pass +
      full-page dark pass; dark measurement waits for the measured colours to
      stop changing, rather than for a fixed delay)

## 3c. Security policy — `pnpm qa:csp` + `pnpm qa:csp:render` [A]

- [ ] Every inline `<script>` in the built page is sha256-pinned in `dist/_headers`
- [ ] No stale pins; `/reveal.js` shipped as an external file (not inlined)
- [ ] Rendered under the real CSP: zero console errors, zero failed requests,
      `html.js` present, 45/45 `[data-reveal]` elements revealed, hero `<h1>` visible

## 4. Background & hero dots [M]

- [ ] Hero shows the animated dot wave in BOTH schemes; dots fade out to the left
      behind the copy and toward the bottom edge (dual-gradient mask), no hard cut;
      light dots #FFF on #1E1E1E in dark, #000 on #ECECEC in light
- [ ] All other sections/panels/figures are FLAT canvas (no dot-field BACKGROUNDS;
      the About decay-*.svg figures are content illustrations, allowed)
- [ ] Dark scheme: cards #262626, hairlines #343434, muted labels #9A9A9A — the exact
      reference dark palette; filled buttons invert (white fill, #1E1E1E ink)
- [ ] ≤900px viewport — wave damped to opacity 0.45 (token `--dotwave-mobile-opacity`)
- [ ] `body` has NO background color (transparent) — an opaque body bg hides the wave
      (known bug class, caught by pixel sampling)
- [ ] `prefers-reduced-motion: reduce` — wave still animates (motion is not suppressed;
      the upstream still-frame branch is patched out per the v0.7.0 motion policy)
- [ ] Print — canvas paints nothing in most print flows; all content black-on-white

## 5. Material 3 component spot-checks [M]

- [ ] Buttons: filled/outlined/tonal/text — state layers visible on hover (8%), focus (12%), pressed (12%)
- [ ] Focus ring: 3px primary outline visible on every interactive element via Tab pass
- [ ] Cards: outlined vs filled (featured "In progress") variants render per tokens
- [ ] Chips (window legends): inverse-chrome colors + borders per tone
- [ ] Accordion: exclusive open (`name=faq`), plus→minus morph, keyboard operable
- [ ] Hero stage panel: flat reference card (#F4F4F4 + #E6E6E6 hairline + 12px radius), no sonar

## 6. Content & accessibility [M]

- [ ] All copy present from `site.ts` — zero hardcoded strings in components
- [ ] Every factual claim traces to the owner's CV or the owner's previous portfolio — no invented metrics, employers, or certificates
- [ ] `/resume.pdf` loads and matches the current CV (regenerate via `pnpm resume`)
- [ ] Reference contact details appear in the PDF only, not on the open web
- [ ] Landmarks: skip link → `#main`, header/nav/main/footer, section labels
- [ ] About state figures: decay SVG `<img>` carries a meaningful `alt`; figcaption text is real text (no `role="img"` suppression)
- [ ] Contrast: H1 15.73:1, muted 5.57:1, min paragraph 5.18:1 (re-check after any color token change)
- [ ] Keyboard: full nav order, accordion operable, no focus traps

## 7. Build gates [A]

- [ ] `pnpm tokens` — deterministic regeneration, git-diff minimal
- [ ] `pnpm typecheck` — 0 errors / 0 warnings
- [ ] `pnpm build` — succeeds; single page output
- [ ] `pnpm manifest:check` — `components.manifest.json` matches the source files
- [ ] `pnpm deploy:dry` — Cloudflare deployment validates

## Current status (2026-10-22, v0.7.2)

All gates above executed for v0.7.2 on a clean checkout:

- design-contract **125/125 PASS** (8/8 viewports, D1 in both schemes, D2 wave
  incl. dark #FFF dots, D3–D5, C1, A1 both schemes — dark paragraph floor 4.69:1,
  white ink 16.67:1, muted 5.92:1)
- CSP render **6/6 PASS** (zero console errors, zero failed requests, 45/45 reveals,
  hero `<h1>` opacity 1) against the real `dist/_headers`
- environment emulation **7/7 PASS** (reduced-motion 45/45 visible + wave animates,
  no-JS 45/45 visible, landscape 844×390 no overflow)
- CSP coverage **6/6 PASS**, `astro check` **0 errors / 0 warnings / 0 hints**
- production build green; `wrangler deploy --dry-run` green (12 assets, 0 bindings)

Screenshots and captures land in `tool-results/` (gitignored): `qa/` (sweeps),
`ref-forensics/` (reference report + screenshots), `impl-captures/` (implementation
hero t0/t1, mobile 390, About triptych).
