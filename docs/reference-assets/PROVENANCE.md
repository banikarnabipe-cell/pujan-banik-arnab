# Reference Asset Provenance — theretriever.app

Fetched via live headless-Chrome session (Chrome 155, CDP) on 2026-10-22, cross-checked
against the page's Network log (`tool-results/ref-forensics/report.json`).

## Files

| File | Source URL | SHA/MD5 (md5) | HTTP | Content-Type |
|---|---|---|---|---|
| `decay-1.svg` | https://theretriever.app/assets/decay-1.svg | `7b7d2ae8f01944322d14bf0e4834775d` | 200 | image/svg+xml |
| `decay-2.svg` | https://theretriever.app/assets/decay-2.svg | `22377e93bef36edd2223700ef4d7953b` | 200 | image/svg+xml |
| `decay-3.svg` | https://theretriever.app/assets/decay-3.svg | `b921bb80395015a3c588e10ecd9d3838` | 200 | image/svg+xml |
| `wave.js` | https://theretriever.app/wave.js?v=30 | `d3e409c930440ad2b1763632c75814c8` | 200 | application/javascript |

Byte-exact copies served by the site live at `public/assets/decay-{1,2,3}.svg` and
`public/wave.js`. **This directory is the untouched archival copy** — do not edit.

## Forensic verdict (verified, not assumed)

- The reference **hero** dot pattern is NOT any of the decay SVGs. It is an animated
  `<canvas class="wave" data-speed="0.5" data-alpha="1.6" data-size="1.6">` painted by
  `wave.js` (48×26 dot grid, sinusoidal phase `c·0.32 + r·0.2 − t·0.9`, vertical
  oscillation `±0.3·dy`, radius `(1.5 + k·2.5)/2`, alpha `0.04 + k·0.14`, color from the
  canvas CSS `color`), masked by two linear-gradients composited with `intersect`.
  Animation verified by canvas pixel sampling (frame differs after 1.5 s).
- The decay SVGs are **content illustrations** in scene "02 / 06 · What deleted means"
  (`<img>` elements, 320×160): decay-1 "ordered grid", decay-2 "same dots, scattered",
  decay-3 "faint flat pattern". They map 1:1 to this project's About `DotState` variants
  `steady | scattered | faint` and are reused there as semantic `<img>` content.
- The static 14px radial-gradient dot grid previously used in this repo's hero was the
  reference's **card-corner** texture (`.card::after`, `#C2C2C2`) — wrong surface. It has
  been removed from the hero in favour of the canvas wave.

## Licensing note

These assets are © the original site author. They are reused here as verified source
material for this private portfolio reproduction task, within that scope only. Do not
redistribute them as a standalone asset package without permission from the rights holder.
