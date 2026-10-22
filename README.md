# pujan-banik-arnab-portfolio (v0.7.0)

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

| Script | What it does |
|---|---|
| `pnpm tokens` | compile `design-tokens.json` → `dist/tokens.css` + `dist/theme.css` |
| `pnpm build` | recursive, topological build of all packages |
| `pnpm typecheck` / `pnpm lint` | `astro check` on `@pba/web` |
| `pnpm qa:design` | 125-check design contract (both color schemes, hero wave, contrast, overflow, content) — needs preview server + CDP Chrome |
| `pnpm qa:env` | reduced-motion / no-JS / landscape gates |
| `pnpm qa:visual` | 8-viewport full-page screenshot sweep |
| `pnpm deploy` | build + `wrangler deploy` (production, top-level env) |
| `pnpm deploy:preview` | build + deploy to the preview Worker |
| `pnpm resume` | regenerate `apps/web/public/resume.pdf` from the CV |

## Docs

| Doc | Contents |
|---|---|
| `DESIGN_SYSTEM.md` | Design language, M3 adaptation, token architecture, components, a11y, deployment |
| `docs/HANDOFF.md` | Versioned change log + architecture invariants |
| `docs/MOTION.md` | Motion contract (v0.7.0: no reduced-motion suppression) |
| `docs/QA-CHECKLIST.md` | Manual + automated QA matrix |
| `docs/reference-assets/PROVENANCE.md` | Byte-exact reference assets: hashes, deltas, licenses stance |
| `components.manifest.json` | Machine-readable component inventory |

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
