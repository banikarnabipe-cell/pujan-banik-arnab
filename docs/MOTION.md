# Motion contract (M3 motion tokens, tailored)

Every animation on this site is **functional**: it confirms interaction, guides
attention between related things, or explains state. No decorative loops.

> **v0.7.0 policy change (owner directive): reduced-motion suppression is
> REMOVED.** The site animates identically for every user — `prefers-
reduced-motion: reduce` no longer zeroes duration tokens, disables the
> reveal observer, or still-frames the hero wave. JS is used deliberately for
> visual enhancement (reveal orchestration, the ambient hero wave). The a11y
> trade-off is explicit and accepted: WCAG 2.3.3 (Animation from
> Interactions, AAA) recommends honoring the OS setting; this site keeps all
> motion transform/opacity-only, brief (≤500ms), and free of flashing/parallax
> to keep the vestibular risk low while following the owner's direction.
> Re-enable coverage later by reintroducing the token override in
> `packages/design-system/build-tokens.mjs` (one block) + the observer gate
> in `apps/web/public/reveal.js` — the checks in `verify-env-emulation.mjs`
> flip back accordingly.

## Token layer

Durations and easings come from `design-tokens.json` (`mdSysMotion`) →
`packages/design-system/dist/tokens.css`:

- `--md-sys-motion-duration-short2/4` (100/200ms) — state layers, color, icon morphs
- `--md-sys-motion-duration-medium2` (300ms) — hover transitions, chip/cell color
- `--md-sys-motion-duration-long2` (500ms) — scroll reveals
- `--md-sys-motion-easing-standard` — `cubic-bezier(0.2, 0, 0, 1)`
- `--md-sys-motion-easing-standard-decelerate` — reveals (emphasized decelerate)

Legacy aliases `--dur-quick/--dur-reveal/--ease-out` resolve to the M3 tokens.

## Allowed properties

**`opacity` and `transform` only** (plus `background-color`/`color`/`border-color`
for state layers, which are paint-cheap and non-layout). Never animate layout:
`width`, `height`, `top/left`, `margin`, `padding`, `font-size`.

## Contracts

1. **Scroll reveals** — `[data-reveal]`: opacity 0→1 + translateY(12px→0),
   500ms decelerate, staggered 0.09s via `--reveal-order`. Gated behind
   `html.js` (set inline in `<head>`); without JS everything is visible.
   Trigger: one `IntersectionObserver` in `apps/web/public/reveal.js`
   (unobserve after reveal). It is an EXTERNAL file on purpose: Astro
   auto-inlines small processed `<script>` blocks, and an unpinned inline
   script is blocked by the production CSP, which left every `[data-reveal]`
   element invisible (v0.7.1 incident).
2. **Reduced motion — REMOVED (v0.7.0 policy)** — no token override, no
   observer gate, no still-framing. The hero wave animates for every user
   (`wave.js` upstream branch patched out — documented delta in
   `docs/reference-assets/PROVENANCE.md`; pristine copy archived). The only
   remaining environment fallback is **no-JS** (`html.no-observe`), which is
   a capability issue, not a preference. Verified by
   `scripts/verify-env-emulation.mjs` (tokens intact, observer engaged,
   wave animating under `reducedMotion: reduce`).
3. **State layers** — M3 method: `::after` veil of `currentColor` at
   `--md-state-layer-*` opacities (hover .08 / focus .12 / pressed .12), 200ms.
   Buttons additionally press with `translateY(1px)`.
4. **Accordion icon** — plus→minus via `transform: scaleY(0)`, 300ms; exclusive
   `<details name="faq">` open/close is native (no JS).
5. **Smooth anchor scroll** — `scroll-behavior: smooth`, no reduced-motion
   override (v0.7.0 policy).
6. **Hero dot wave** (v0.5.0) — the reference's own animation, ported
   byte-exact (`public/wave.js`, provenance in `docs/reference-assets/`).
   A `<canvas class="wave">` fills the hero; 48×26 dots oscillate on phase
   `c·0.32 + r·0.2 − t·0.9` (speed 0.5, alpha 1.6, size 1.6 — `dotwave`
   token group). This is the one continuous ambient animation on the site;
   it is the reference's intended visual, kept per the v0.5.0 motion
   directive (do not downgrade or suppress it).
   - Runs only while the canvas is on screen (`IntersectionObserver`) and
     the tab is visible; DPR-aware; one `requestAnimationFrame` loop for
     all canvases; repaints on resize.
   - **v0.7.0:** animates under every user preference — the upstream
     `prefers-reduced-motion` still-frame branch is patched out (the one
     deliberate local delta from the reference script, per the owner's
     no-suppression motion policy).

> **Removed in v0.4.0:** the hero "sonar" pointer-follow highlight. Its host
> dot panel was retired (hero-only dots rule → flat reference-card panel), and
> a pointer spotlight on a flat panel served no comprehension. Removal keeps
> the "functional motion only" promise. (v0.5.0: the hero dot layer itself was
> replaced by the reference's animated canvas wave — see contract 6.)

## Adding new motion (checklist)

- [ ] Serves comprehension, not decoration
- [ ] Only opacity/transform/color
- [ ] Uses motion tokens (no ad-hoc durations/easings)
- [ ] Runs for every user — do NOT add `prefers-reduced-motion` overrides
      (v0.7.0 policy; if a genuine accessibility need appears, raise it for
      an explicit decision rather than silently gating)
- [ ] Does not exceed ~0.09s stagger load on any scene
