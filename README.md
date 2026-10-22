# pujan-banik-arnab-portfolio (v0.7.2)

Personal portfolio of **Pujan Banik Arnab — Industrial & Production Engineer**.
pnpm monorepo · Astro 7 static app · Tailwind CSS v4 bridged onto a Material 3
tailored token system (`@pba/design-system`) · shared M3 components
(`@pba/ui`) · Cloudflare Workers static-assets deployment.

Design language extracted from theretriever.app as **reusable patterns only**
(hierarchy, rhythm, color relationships, density) — never copied assets.
**The hero is the only dotted surface**: the reference's actual animated
canvas dot wave (`public/wave.js`), verified by live-browser forensics.
Exact reference canvases: light `#ECECEC`, dark `#1E1E1E` (live-verified,
md5-stable).

## Monorepo layout

```
apps/web                 → @pba/web — the Astro site (only app today)
packages/design-system   → @pba/design-system — design-tokens.json (W3C DTCG,
                           M3 roles) + compiler → dist/tokens.css + dist/theme.css
                           (Tailwind @theme inline bridge)
packages/ui              → @pba/ui — shared M3 Astro components
packages/config          → @pba/config — shared tsconfig + prettier
tooling/scripts          → QA gates, CSP hash, résumé generator, forensics
```

Future slots (no consumers yet, deliberately not created): `apps/docs`,
`apps/admin`, `packages/utils`, `packages/api-client`.

## Quickstart (pnpm only — npm/yarn are not supported)

```bash
corepack enable pnpm       # once (uses the pinned packageManager version)
pnpm install
pnpm dev                   # dev server (http://localhost:3000)
pnpm build                 # design-system build → web static build
pnpm typecheck             # astro check (0 errors gate)
pnpm test                  # = astro check
pnpm format                # prettier (config in packages/config)
```

## Commands

| Script                         | What it does                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `pnpm tokens`                  | compile `design-tokens.json` → `dist/tokens.css` + `dist/theme.css`                                   |
| `pnpm build`                   | recursive, topological build of all packages                                                          |
| `pnpm typecheck` / `pnpm lint` | `astro check` on `@pba/web`                                                                           |
| `pnpm qa:csp`                  | every inline script is sha256-pinned in `_headers` (static gate)                                      |
| `pnpm qa:csp:render`           | serves `dist` with the real `_headers` and asserts nothing is blocked (browser gate)                  |
| `pnpm qa:env`                  | reduced-motion / no-JS / landscape gates (browser gate)                                               |
| `pnpm qa:design`               | 125-check design contract (both color schemes, hero wave, contrast, overflow, content) (browser gate) |
| `pnpm qa:devices`              | iPhone 14 / Pixel 7 emulation sweep + overflow check                                                  |
| `pnpm qa:visual`               | 8-viewport full-page screenshot sweep                                                                 |
| `pnpm qa`                      | all four browser-free + browser gates in sequence                                                     |
| `pnpm manifest`                | regenerate `components.manifest.json` from the source files                                           |
| `pnpm manifest:check`          | fail if the committed manifest is out of date                                                         |
| `pnpm csp:hash`                | re-pin the inline script hashes after touching the boot script                                        |
| `pnpm deploy`                  | build + `wrangler deploy` (production, top-level env)                                                 |
| `pnpm deploy:preview`          | build + deploy to the preview Worker                                                                  |
| `pnpm resume`                  | regenerate `apps/web/public/resume.pdf` from the CV                                                   |

The browser gates need `playwright-core` (a devDependency) and an installed
Chrome or Edge. They drive the browser themselves and serve `apps/web/dist`
with the production `_headers` applied — no external Chrome, no CDP endpoint
and no preview server needed. Override the browser with `CHROME_BIN` or
`PW_CHANNEL` (`chrome`, `msedge`).

`pnpm resume` needs Python with `reportlab` and the FreeSerif font family.
On Linux the fonts live at `/usr/share/fonts/truetype/freefont`; elsewhere set
`FREESERIF_DIR` to the folder holding `FreeSerif.ttf`, and call `python`
instead of `python3` if that is what your machine has.

## Docs

| Doc                                   | Contents                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| `DESIGN_SYSTEM.md`                    | Design language, M3 adaptation, token architecture, components, a11y, deployment |
| `docs/HANDOFF.md`                     | Versioned change log + architecture invariants                                   |
| `docs/MOTION.md`                      | Motion contract (v0.7.0: no reduced-motion suppression)                          |
| `docs/QA-CHECKLIST.md`                | Manual + automated QA matrix                                                     |
| `docs/reference-assets/PROVENANCE.md` | Byte-exact reference assets: hashes, deltas, licenses stance                     |
| `components.manifest.json`            | Machine-readable component inventory                                             |

## Non-negotiables

1. `body` stays transparent — `html` carries the opaque canvas (hero wave
   visibility depends on it; QA-gated).
2. The hero is the ONLY dotted surface.
3. Tokens are edited in `packages/design-system/design-tokens.json` only —
   never hand-edit generated CSS.
4. No `prefers-reduced-motion` suppression (v0.7.0 owner policy, documented
   in `docs/MOTION.md`).
5. Security headers + CSP script hash live in `apps/web/public/_headers`;
   after changing the inline bootstrap script run
   `node tooling/scripts/csp-hash.mjs` and rebuild.
6. `apps/web/src/styles/tailwind.css` must keep its `@source` path pointing at
   `packages/ui/src`. That path is relative to the CSS file, so it needs FOUR
   levels up. With the wrong depth Tailwind scans nothing and the whole
   `@pba/ui` package ships unstyled (v0.7.2 fix).
7. `components.manifest.json` is generated — run `pnpm manifest` after adding
   or renaming a component; CI fails if it drifts.
