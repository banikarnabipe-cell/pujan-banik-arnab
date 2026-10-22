# Visual QA checklist — portfolio v0.6.0

Legend: [A] automated (script), [M] manual. Re-run the full matrix after any
token, component, or content change.

## 1. Viewports (screenshot sweep, full page) — `bash scripts/qa-capture.sh` [A]

- [ ] 320×568 — no horizontal scroll; H1 = 2 lines; nav wraps centered; buttons full-width stacked
- [ ] 375×812 — facts 1-col; tables collapse gracefully
- [ ] 414×896 — same as 375 expectations
- [ ] 768×1024 — hero stacks; app window full-width
- [ ] 1024×768 — 2-col project cards; 3-col cards where applicable
- [ ] 1280×800 — desktop rhythm begins; container centered
- [ ] 1440×900 — reference-rhythm layout (container 1080)
- [ ] 1920×1080 — no stretched content; hero dot wave renders cleanly (canvas full-bleed, no seams)

## 2. Device emulation — `node scripts/device-qa.mjs` [A] (needs CDP :46049, e.g. agent-browser's Chrome)

- [ ] iPhone 14 (390×844, DPR3, mobile UA) — no overflow + full-page capture
- [ ] Pixel 7 (412×915) — no overflow + full-page capture
- [ ] Landscape 844×390 — no horizontal overflow (`verify-env-emulation.mjs`)

## 3. Environment modes — `node scripts/verify-env-emulation.mjs` [A]

- [ ] `prefers-reduced-motion: reduce` — all `[data-reveal]` opacity 1 instantly, no transition
- [ ] JS disabled — `html.js` gate absent; 100% of content visible
- [ ] Landscape overflow — none

## 3b. Design contract — `node scripts/verify-design-contract.mjs` [A] (v0.6.0 gate, 125 checks)

- [ ] D1 — light canvas `#ECECEC` exactly AND dark canvas `#1E1E1E` exactly
      (html bg, via `colorScheme` emulation) at all 8 viewports; dark body text #FFFFFF
- [ ] D2 — hero pattern is the reference's ACTUAL hero pattern: animated `canvas.wave`
      (first child, data-speed 0.5 / alpha 1.6 / size 1.6 / 48×26), dual linear-gradient
      mask composited with intersect, color #000 light / #FFF dark, full-bleed rect,
      painted pixels present, ANIMATING (canvas pixel diff) — still frame under reduced
      motion (upstream behavior)
- [ ] D3 — hero is the ONLY dotted SURFACE: no `radial-gradient(circle…)` backgrounds
      anywhere (elements and ::before/::after), zero extra `canvas.wave` outside the hero
- [ ] D4 — zero horizontal overflow at all 8 viewports
- [ ] D5 — About states reuse the verified decay SVGs (`/assets/decay-{1,2,3}.svg`, 320×160, loaded)
- [ ] C1 — content sanity: enriched thesis (L18/ANOVA), crusher (QFD/SolidWorks), SSC entry, address, email + LinkedIn + phone links, résumé download
- [ ] A1 — contrast in BOTH schemes: every paragraph ≥ 4.5:1 vs its EFFECTIVE background;
      primary-ink paragraphs ≥ 7:1; muted labels ≥ 4.5:1 (per-viewport dark pass +
      full-page dark pass; dark measurement waits 350ms for color transitions to settle)

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
- [ ] `prefers-reduced-motion: reduce` — wave paints a STILL frame (upstream wave.js
      behavior; not suppressed, not hidden; unchanged by the dark scheme)
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
- [ ] `/resume.pdf` loads and matches the current CV (regenerate via `scripts/make-resume.py`)
- [ ] Reference contact details appear in the PDF only, not on the open web
- [ ] Landmarks: skip link → `#main`, header/nav/main/footer, section labels
- [ ] About state figures: decay SVG `<img>` carries a meaningful `alt`; figcaption text is real text (no `role="img"` suppression)
- [ ] Contrast: H1 15.73:1, muted 5.57:1, min paragraph 5.18:1 (re-check after any color token change)
- [ ] Keyboard: full nav order, accordion operable, no focus traps

## 7. Build gates [A]

- [ ] `npm run tokens` — deterministic regeneration, git-diff minimal
- [ ] `npx astro check` — 0 errors / 0 warnings
- [ ] `npm run build` — succeeds; single page output

## Current status (2026-10-22, v0.6.0)

All of the above executed for v0.6.0 (dark scheme added): design-contract
125/125 PASS (8/8 viewports, D1 in both schemes, D2 wave incl. dark #FFF dots,
D3–D5, C1, A1 both schemes — dark paragraph floor 4.69:1, white ink 16.67:1,
muted 5.92:1), iPhone14 + Pixel7 OK (zero overflow), reduced-motion 45/45
visible + wave still-frame probe PASS, no-JS 45/45 visible, landscape PASS,
`astro check` 0 errors/0 warnings, production build green. Dark-mode fidelity
proven against live reference captures: canvas `rgb(30,30,30)`, text `#FFF`,
wave dots `#FFF`, card `#262626` — byte-equal to theretriever.app dark values
(`tool-results/darkmode-forensics/`, live CSS md5-identical to archive).
Full-page dark capture: `tool-results/darkmode-impl/ours-dark-full-1440.png`
(scroll-reveal sweep first: full-page captures must scroll with
`scroll-behavior: auto`, else reveals stay hidden — harness artifact, not a bug).

Evidence: `tool-results/qa/` (sweeps), `tool-results/ref-forensics/` (reference
report + screenshots), `tool-results/impl-captures/` (implementation hero
t0/t1, mobile 390, About triptych), `tool-results/contract-darkmode.txt`,
`tool-results/darkmode-forensics/` (ref dark/light heroes + live CSS),
`tool-results/darkmode-impl/` (our light/dark heroes, mobile dark, full-page
dark, side-by-side comparison).
