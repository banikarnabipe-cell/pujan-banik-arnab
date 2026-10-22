#!/usr/bin/env node
/**
 * design-tokens.json -> dist/tokens.css
 * Material 3 role architecture, tailored baseline.
 * Run: pnpm tokens   (root script -> pnpm --filter @pba/design-system build)
 * NEVER hand-edit dist/tokens.css — edit design-tokens.json instead.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(readFileSync(join(root, "design-tokens.json"), "utf8"));
const out = join(root, "dist", "tokens.css");

const flat = {};
const walk = (node, path) => {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && "$value" in val) flat[[...path, key].join("-")] = val.$value;
    else walk(val, [...path, key]);
  }
};
walk(src, []);

const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const get = (prefix) => (name) => {
  const key = Object.keys(flat).find((k) => k.toLowerCase().replace(/-/g, "") === `${prefix}${name.toLowerCase()}`.replace(/-/g, ""));
  if (!key) throw new Error(`token not found: ${prefix}${name}`);
  return flat[key];
};

const C = get("mdsyscolor");
const CD = get("mdsyscolordark");
const S = get("mdrefstate");
const E = get("mdsyselevation");
const SH = get("mdsysshape");
const M = get("mdsysmotion");
const L = get("layout");
const W = get("dotwave");
const T = (role) => flat[`mdSysTypography-${role}`] ?? (() => { throw new Error(`type ${role}`); })();

const lines = [];
const p = (s = "") => lines.push(s);

p("/* GENERATED FILE — do not edit. Source: design-tokens.json (@pba/design-system),");
p("   compiler: packages/design-system/build-tokens.mjs.");
p("   Rebuild: pnpm tokens");
p("   Architecture: Material 3 (Material You / M3 Expressive) role tokens, tailored baseline:");
p("   ink primary on a neutral canvas anchored to the reference site in BOTH schemes —");
p("   light surface #ECECEC and dark surface #1E1E1E (exact theretriever.app body");
p("   backgrounds, live-DOM verified 2026-10-22; the reference is dark-first with a");
p("   prefers-color-scheme: light override — same runtime behavior, always resolves");
p("   to one scheme). Retriever-derived rhythm, mono schematic labels.");
p("   Hero dot pattern = the reference's animated canvas dot wave (wave.js),");
p("   applied to the hero section ONLY. */");
p();
p(":root {");

p("  /* ── M3 color roles ─────────────────────────────── */");
for (const k of Object.keys(src.mdSysColor).filter((k) => !k.startsWith("$"))) p(`  --md-sys-color-${kebab(k)}: ${C(k)};`);
p();

p("  /* ── M3 state layers ────────────────────────────── */");
p(`  --md-state-layer-hover: ${S("hover")};`);
p(`  --md-state-layer-focus: ${S("focus")};`);
p(`  --md-state-layer-pressed: ${S("pressed")};`);
p(`  --md-state-layer-dragged: ${S("dragged")};`);
p();

p("  /* ── M3 elevation ───────────────────────────────── */");
for (const lvl of ["level0", "level1", "level2", "level3"]) p(`  --md-elevation-${kebab(lvl).replace("level-", "")}: ${E(lvl)};`);
p();

p("  /* ── M3 shape scale (tailored flat) ─────────────── */");
p(`  --md-shape-none: ${SH("cornerNone")};`);
p(`  --md-shape-xs: ${SH("cornerExtraSmall")};`);
p(`  --md-shape-s: ${SH("cornerSmall")};`);
p(`  --md-shape-m: ${SH("cornerMedium")};`);
p(`  --md-shape-l: ${SH("cornerLarge")};`);
p(`  --md-shape-xl: ${SH("cornerExtraLarge")};`);
p(`  --md-shape-full: ${SH("cornerFull")};`);
p();

p("  /* ── M3 type scale (tailored) ───────────────────── */");
const roles = [
  "displayLarge", "displaySmall", "headlineLarge", "headlineMedium", "titleLarge", "titleMedium",
  "titleSmall", "bodyLarge", "bodyMedium", "bodySmall", "labelLarge", "labelMedium", "labelSmall",
];
for (const role of roles) {
  const t = T(role);
  const v = kebab(role);
  p(`  --md-sys-type-${v}-size: ${t.fontSize};`);
  p(`  --md-sys-type-${v}-line-height: ${t.lineHeight};`);
  p(`  --md-sys-type-${v}-weight: ${t.fontWeight};`);
  p(`  --md-sys-type-${v}-tracking: ${t.letterSpacing};`);
}
p(`  --font-sans: ${T("fontFamilyBody")};`);
p(`  --font-mono: ${T("fontFamilyLabel")};`);
p();

p("  /* ── M3 motion ──────────────────────────────────── */");
for (const k of ["durationShort1", "durationShort2", "durationShort4", "durationMedium1", "durationMedium2", "durationMedium4", "durationLong2"]) {
  p(`  --md-sys-motion-${kebab(k)}: ${M(k)};`);
}
for (const k of ["easingStandard", "easingStandardDecelerate", "easingStandardAccelerate", "easingEmphasized"]) {
  p(`  --md-sys-motion-${kebab(k)}: ${M(k)};`);
}
p();

p("  /* ── Layout rhythm (retriever-derived) ──────────── */");
p(`  --container: ${L("container")};`);
p(`  --gutter: ${L("gutter")};`);
p(`  --scene-pad: ${L("scenePad")};`);
p(`  --hero-pad-top: ${L("heroPadTop")};`);
p();

p("  /* ── Hero dot WAVE (exact reference pattern, hero-only) ──");
p("     Verified via live headless-Chrome forensics (2026-10-22): the reference hero's");
p("     dots are an animated <canvas class=\"wave\"> driven by wave.js — NOT the card's");
p("     radial-gradient. Color/mask/opacity feed the .wave styles in Hero.astro; speed,");
p("     alpha, size, cols, rows feed the canvas data-attributes (imported from");
p("     design-tokens.json at build time — single source of truth). */");
p(`  --dotwave-color: ${W("color")};`);
p(`  --dotwave-mobile-opacity: ${W("mobileOpacity")};`);
p(`  --dotwave-mask-x: ${W("maskX")};`);
p(`  --dotwave-mask-y: ${W("maskY")};`);
p();

p("  /* ── Legacy aliases (migration safety net) ────────");
p("     Old component names resolved to M3 roles. Remove after full migration. */");
p("  --canvas: var(--md-sys-color-surface);");
p("  --canvas-deep: var(--md-sys-color-surface-container-high);");
p("  --ink: var(--md-sys-color-on-surface);");
p("  --muted: var(--md-sys-color-on-surface-variant);");
p("  --hairline: var(--md-sys-color-outline-variant);");
p("  --card: var(--md-sys-color-surface-container-lowest);");
p("  --card-edge: var(--md-sys-color-outline-variant);");
p("  --btn-ghost: var(--md-sys-color-secondary-container);");
p("  --btn-ghost-edge: var(--md-sys-color-outline-variant);");
p("  --radius: var(--md-shape-xs);");
p("  --win-bg: var(--md-sys-color-inverse-surface);");
p("  --win-chrome: #292929;");
p("  --win-edge: #3a3a3a;");
p("  --win-text: var(--md-sys-color-inverse-on-surface);");
p("  --win-muted: var(--md-sys-color-inverse-primary);");
p("  --status-stable: #2e7d4f;");
p("  --status-degrading: #b07a1c;");
p("  --status-critical: #c05126;");
p("  --text-display: var(--md-sys-type-display-large-size);");
p("  --text-h2: var(--md-sys-type-headline-large-size);");
p("  --text-h3: var(--md-sys-type-title-medium-size);");
p("  --text-body: var(--md-sys-type-body-large-size);");
p("  --text-small: var(--md-sys-type-body-medium-size);");
p("  --text-micro: var(--md-sys-type-label-medium-size);");
p("  --tracking-caps: var(--md-sys-type-label-medium-tracking);");
p("  --leading-tight: var(--md-sys-type-display-large-line-height);");
p("  --leading-body: var(--md-sys-type-body-large-line-height);");
p("  --ease-out: var(--md-sys-motion-easing-standard-decelerate);");
p("  --dur-quick: var(--md-sys-motion-duration-medium2);");
p("  --dur-reveal: var(--md-sys-motion-duration-long2);");
p("  --reveal-shift: 12px;");
p("  --stagger-step: 0.09s;");
p("}");

p();
p("@media (prefers-color-scheme: dark) {");
p("  :root {");
p("    /* ── M3 color roles — dark scheme ───────────────");
p("       Anchored to the EXACT reference dark palette (theretriever.app");
p("       :root defaults, live-verified 2026-10-22): surface #1E1E1E,");
p("       surface-container-lowest #262626 (ref --panel), on-surface");
p("       #FFFFFF, on-surface-variant #9A9A9A, outline-variant #343434,");
p("       tertiary #D69957 (ref --amber). Filled buttons invert exactly");
p("       like the reference's .btn.primary. inverseSurface deliberately");
p("       stays dark so the hero window chrome is dark in both schemes. */");
for (const k of Object.keys(src.mdSysColorDark).filter((k) => !k.startsWith("$"))) p(`    --md-sys-color-${kebab(k)}: ${CD(k)};`);
p();
p("    /* Wave dots flip to white — the reference paints .wave with");
p("       color: var(--text), which is #FFF in dark. */");
p(`    --dotwave-color: ${W("colorDark")};`);
p("  }");
p("}");

p();

/* Motion policy (v0.7.0, owner directive): the reduced-motion token-zeroing
   block was REMOVED — durations and reveals are identical for every user.
   Rationale and the a11y trade-off are documented in docs/MOTION.md. */

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n") + "\n");
console.log(`tokens.css written: ${lines.length} lines, ${Object.keys(flat).length} source tokens`);

/* ── Tailwind v4 theme bridge (@theme inline) ─────────────────────────
   Maps M3 role tokens onto Tailwind namespaces WITHOUT duplicating values:
   every mapping references the SAME runtime custom property, so the
   dark-scheme media overrides in tokens.css keep working through every
   Tailwind utility. `inline` inlines the var() reference into utilities. */
const tLines = [];
const tp = (s = "") => tLines.push(s);
tp("/* GENERATED FILE — Tailwind v4 theme bridge. Source: design-tokens.json");
tp("   (@pba/design-system), compiler: packages/design-system/build-tokens.mjs.");
tp("   Rebuild: pnpm tokens. NEVER hand-edit — edit design-tokens.json instead.");
tp("   Every value references the runtime token variables from tokens.css, so");
tp("   prefers-color-scheme: dark keeps flowing through Tailwind utilities. */");
tp("");
tp("@theme inline {");
tp("  /* M3 color roles */");
for (const k of Object.keys(src.mdSysColor).filter((k) => !k.startsWith("$"))) {
  if (["shadow", "scrim", "surfaceTint"].includes(k)) continue;
  tp(`  --color-${kebab(k)}: var(--md-sys-color-${kebab(k)});`);
}
tp("");
tp("  /* Shape scale (rounded-*) */");
tp("  --radius-none: var(--md-shape-none);");
tp("  --radius-xs: var(--md-shape-xs);");
tp("  --radius-sm: var(--md-shape-s);");
tp("  --radius-md: var(--md-shape-m);");
tp("  --radius-lg: var(--md-shape-l);");
tp("  --radius-xl: var(--md-shape-xl);");
tp("");
tp("  /* Elevation (shadow-level*) */");
for (const lvl of ["level0", "level1", "level2", "level3"]) tp(`  --shadow-${lvl}: var(--md-elevation-${lvl});`);
tp("");
tp("  /* Type roles (text-*) */");
for (const role of roles) {
  const v = kebab(role);
  tp(`  --text-${v}: var(--md-sys-type-${v}-size);`);
  tp(`  --text-${v}--line-height: var(--md-sys-type-${v}-line-height);`);
  tp(`  --text-${v}--font-weight: var(--md-sys-type-${v}-weight);`);
  tp(`  --text-${v}--letter-spacing: var(--md-sys-type-${v}-tracking);`);
}
tp("");
tp("  /* Fonts (font-sys-*) */");
tp("  --font-sys-sans: var(--font-sans);");
tp("  --font-sys-mono: var(--font-mono);");
tp("");
tp("  /* Breakpoints — QA viewport widths (design-tokens.json layout group). */");
tp("  --breakpoint-xs: 320px;");
tp("  --breakpoint-sm: 375px;");
tp("  --breakpoint-md: 414px;");
tp("  --breakpoint-lg: 768px;");
tp("  --breakpoint-xl: 1024px;");
tp("  --breakpoint-2xl: 1280px;");
tp("  --breakpoint-3xl: 1440px;");
tp("  --breakpoint-4xl: 1920px;");
tp("");
tp("  /* Motion easings (ease-*) — durations stay plain tokens; use");
tp("     duration-(--md-sys-motion-duration-*) arbitrary values in markup. */");
for (const [name, key] of [["standard", "easingStandard"], ["decelerate", "easingStandardDecelerate"], ["accelerate", "easingStandardAccelerate"], ["emphasized", "easingEmphasized"]]) {
  tp(`  --ease-${name}: var(--md-sys-motion-${kebab(key)});`);
}
tp("}");

const themeOut = join(root, "dist", "theme.css");
writeFileSync(themeOut, tLines.join("\n") + "\n");
console.log(`theme.css written: ${tLines.length} lines (Tailwind @theme inline bridge)`);
