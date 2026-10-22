/**
 * Generate components.manifest.json from the real source files.
 *
 * The manifest used to be hand-written, which let it drift: it listed 15
 * components when the shared package has 8 and the app has 14, pointed every
 * path at a pre-monorepo layout, and described a reveal observer and a
 * reduced-motion branch that no longer exist. Nothing read it, so nothing
 * caught it.
 *
 * Now the structural facts (which components exist, where they live, what
 * props they take) are derived from the source; only the prose annotations
 * live here, in one place. `node tooling/scripts/build-manifest.mjs --check`
 * fails if the committed file is out of date — wire that into CI.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const MANIFEST = join(REPO_ROOT, "components.manifest.json");

const SOURCE_DIRS = [
  { dir: "apps/web/src/layouts", pkg: "@pba/web" },
  { dir: "apps/web/src/components", pkg: "@pba/web" },
  { dir: "packages/ui/src/components", pkg: "@pba/ui" },
];

/** Prose that cannot be derived from the source. Keyed by component name. */
const ANNOTATIONS = {
  Layout: {
    responsibilities: [
      "document shell",
      "SEO meta",
      "theme-color per colour scheme",
      "inline boot script that sets the html.js gate (sha256-pinned by the CSP)",
      "loads the external reveal observer (public/reveal.js) and the hero wave (public/wave.js)",
    ],
    a11y: [
      "lang",
      "skip link target",
      "no reduced-motion branch (v0.7.0 motion policy: motion runs for everyone)",
    ],
  },
  Header: {
    data: "site.brand, site.nav.links",
    a11y: ["nav[aria-label=Primary]", "brand link aria-label", "microlabel links"],
    states: ["link hover = color shift (state-layer equivalent)"],
  },
  Hero: {
    data: "site.hero",
    variants: [
      "buttons: filled/outlined/tonal/text via ButtonSpec.variant",
      "download attr passthrough",
    ],
    features: [
      'hero carries the ONLY dotted surface — an animated <canvas class="wave"> painted by public/wave.js',
      "stage panel = flat reference card (container-lowest + outline-variant hairline + 12px radius), no sonar",
      "app window with pulse grid (in-window UI, dark chrome)",
    ],
    a11y: ["aria-labelledby=hero-title", "decorative grids aria-hidden"],
  },
  FactsStrip: {
    data: "site.facts",
    a11y: ["section[aria-label=Key facts]", "definition list semantics"],
    grid: ["4 cols ≥900px", "2 cols ≥480px", "1 col below"],
  },
  Scene: {
    notes: "hairline-divided section wrapper; transparent BG so the shared canvas shows through",
  },
  Heading: {
    notes: "M3 headline-large; explicit line blocks for viewport-stable rhythm",
  },
  AboutScene: {
    data: "site.scenes.about",
    features: ["seeded dot-matrix figures (build-time)", "variants steady/scattered/faint"],
    a11y: ["figure[role=img][aria-label]", "decorative svg aria-hidden"],
  },
  SkillsScene: {
    data: "site.scenes.skills",
    features: ["AppWindow skill matrix table", "M3 cards (Process/Quality/Data)"],
    a11y: [
      "role=table/row/columnheader/cell",
      "mobile collapse keeps accessible order",
      "legend role=list",
    ],
    grid: ["3 cards ≥900px → 1 col"],
  },
  ProjectsScene: {
    data: "site.scenes.projects",
    features: [
      "project cards with impact bar art (aria-hidden)",
      "status badges shipped/in-progress/academic (text + color)",
    ],
    a11y: ["no color-only meaning"],
    grid: ["4 ≥1024px", "2 ≥480px", "1 below"],
  },
  ExperienceScene: {
    data: "site.scenes.experience",
    features: [
      "allocation strip (solid/hatch/void zones, role=img)",
      "principle quote",
      "timeline entries (M3 list style)",
    ],
    a11y: ["aria-label composes zone percents", "ordered list semantics"],
  },
  CredentialsScene: {
    data: "site.scenes.credentials",
    features: ["two credential groups; featured group = m3-card--filled", "M3 button actions"],
  },
  PrinciplesBlock: {
    data: "site.principles",
    notes: "'How I work' — 4 principle bullets; inline deep links",
  },
  ContactScene: {
    data: "site.contact",
    features: [
      "M3 action row (filled/outlined/text)",
      "exclusive <details name=faq> accordion, plus→minus icon (transform only)",
    ],
    a11y: ["details/summary native semantics", "summary hover = state layer", "no JS required"],
  },
  Footer: {
    data: "site.brand, site.nav.footerLinks, site.nav.footerNote",
    a11y: ["nav[aria-label=Footer]"],
  },
  Button: {
    notes:
      "M3 common button — Tailwind-native, token-bridged. Renders an <a> (no <button>), so it cannot be used for in-page actions.",
    a11y: ["focus-visible state layer", "global 3px focus-visible outline"],
  },
  Card: {
    notes: "M3 card shell; consumer supplies the heading and body semantics.",
  },
  Chip: {
    notes: "Renders an <a> when href is given, otherwise a <span>.",
  },
  Divider: {
    notes: "<hr> — implicit role=separator.",
  },
  Microlabel: {
    notes: "Uppercase mono label; decorative role.",
  },
  SectionHeading: {
    notes:
      "<h2> with explicit line blocks — the Tailwind-native twin of the app-level Heading.astro.",
  },
  SceneShell: {
    notes: "Tailwind-native scene wrapper — the twin of the app-level Scene.astro.",
  },
  AppWindow: {
    notes: "inverse-surface chrome, traffic dots, level-2 elevation (--md-elevation-level2).",
  },
};

/** Parse an Astro component's `interface Props { … }` block. */
function parseProps(source) {
  const block = source.match(/interface Props \{([\s\S]*?)\n\}/);
  if (!block) return undefined;
  const props = [];
  const re = /readonly\s+"?([\w-]+)"?\s*(\?)?\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block[1])) !== null) {
    let type = m[3]
      .trim()
      .replace(/\s*\|\s*undefined\s*$/, "")
      .trim();
    type = type.replace(/"([^"]*)"/g, "'$1'");
    props.push({ name: m[1], type, required: !m[2] });
  }
  return props.length ? props : undefined;
}

function collect() {
  const components = [];
  for (const { dir, pkg } of SOURCE_DIRS) {
    const abs = join(REPO_ROOT, dir);
    if (!statSync(abs, { throwIfNoEntry: false })) continue;
    for (const file of readdirSync(abs)
      .filter((f) => f.endsWith(".astro"))
      .sort()) {
      const name = file.replace(/\.astro$/, "");
      const rel = relative(REPO_ROOT, join(abs, file)).split(sep).join("/");
      const source = readFileSync(join(abs, file), "utf8");
      const entry = { name, path: rel, package: pkg };
      const props = parseProps(source);
      if (props) entry.props = props;
      Object.assign(entry, ANNOTATIONS[name] ?? {});
      components.push(entry);
    }
  }
  return components;
}

// NB: no file sizes here. Byte counts depend on line endings, so a checkout
// with CRLF (Windows) and one with LF (CI) would never agree and
// `manifest:check` would fail on one of them. A number that cannot be
// stable in both places does not belong in a generated file.

const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));

const manifest = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $comment:
    "Component inventory — generated by tooling/scripts/build-manifest.mjs. " +
    "Do not hand-edit: run `pnpm manifest` (or `--check` to verify). " +
    "Paths, component list and props are derived from the source files.",
  project: pkg.name,
  version: pkg.version,
  stack: {
    framework: "astro@7",
    language: "typescript-strict",
    styling:
      "Tailwind CSS v4 (@tailwindcss/vite, no preflight) bridged via @theme inline onto generated M3 role tokens; scoped token-driven CSS for pseudo-element machinery",
    monorepo:
      "pnpm workspaces: apps/web + packages/{design-system,ui,config}. tooling/scripts is a plain directory of Node scripts, not a workspace package.",
    clientJs:
      "minimal, vanilla, transform/opacity only; JS-driven reveal orchestration + ambient hero wave (no reduced-motion suppression, v0.7.0 policy)",
  },
  tokens: {
    source: "packages/design-system/design-tokens.json",
    compiler: "packages/design-system/build-tokens.mjs",
    output: [
      "packages/design-system/dist/tokens.css",
      "packages/design-system/dist/theme.css (Tailwind @theme inline bridge)",
    ],
    command: "pnpm tokens",
  },
  layout: {
    container: "1080px",
    gutter: "24px",
    sceneRhythm: "clamp(4rem,3rem+4.5vw,6.5rem)",
    breakpoints: [320, 375, 414, 768, 1024, 1280, 1440, 1920],
  },
  backgroundSystem: {
    name: "exact-reference hero dots (hero-only rule)",
    canvas: {
      carrier:
        "html (opaque #ECECEC light / #1E1E1E dark — exact theretriever.app body backgrounds)",
      bodyMustStayTransparent: true,
      note: "opaque body background would hide the z-index:0 hero wave (known bug class; verify-design-contract.mjs guards)",
    },
    application: [
      {
        selector: ".hero > canvas.wave",
        scope: "hero ONLY — no other dotted surface allowed",
        pattern:
          "animated canvas dot wave painted by public/wave.js (byte-exact reference port; v0.7.0: upstream reduced-motion still-frame branch patched out per owner motion policy — pristine copy + provenance in docs/reference-assets/)",
        attributes:
          "data-speed 0.5, data-alpha 1.6, data-size 1.6, 48x26 grid (dotwave token group, injected from design-tokens.json at build time)",
        mask: "dual linear-gradient mask composited with intersect (--dotwave-mask-x/y)",
        source:
          "live headless-Chrome forensics of theretriever.app hero (2026-10-22, tool-results/ref-forensics/)",
      },
    ],
    nonDotVisualLanguage: [
      "About states: verified decay-1/2/3.svg dot-matrix illustrations as content <img> figures (byte-exact reuse, provenance md5s)",
      "Experience zones: solid ink fill + tertiary hatch + void",
      "brand mark: unit box in frame (rect only, zero circles)",
    ],
    guards: [
      "hero canvas: pointer-events none, IntersectionObserver-gated paint, DPR-aware",
      "hero is the ONLY dotted surface (contract D3: no radial-gradient circles, no extra canvas.wave)",
    ],
  },
  components: collect(),
  globalPrimitives: {
    buttons: [
      ".btn",
      ".btn--filled",
      ".btn--outlined",
      ".btn--tonal",
      ".btn--text",
      "(legacy .btn--ghost)",
      "@pba/ui Button (Tailwind-native; used by Hero and SkillsScene)",
    ],
    cards: [".m3-card", ".m3-card--elevated", ".m3-card--filled", "@pba/ui Card"],
    chips: [".m3-chip", "@pba/ui Chip"],
    misc: [
      ".container",
      ".scene",
      ".microlabel",
      ".m3-divider",
      ".skip-link",
      "[data-reveal] contract",
      "@pba/ui Divider / Microlabel / SectionHeading / SceneShell",
    ],
    stateLayers: {
      mechanism: "::after currentColor veil",
      hover: 0.08,
      focus: 0.12,
      pressed: 0.12,
      dragged: 0.16,
    },
  },
  contentModel: {
    file: "apps/web/src/data/site.ts",
    schema: "exported readonly interfaces (single source of copy)",
    mustEditMarkers:
      "none since v0.3.0 — every value sourced from the owner's real CV + previous portfolio; v0.4.0 enriched with verifiable specifics (thesis L18/ANOVA, crusher QFD, SSC); do not invent facts",
  },
  clientJs: {
    "apps/web/public/reveal.js":
      "IntersectionObserver reveal; adds html.no-observe when IntersectionObserver is missing",
    "apps/web/public/wave.js": "hero canvas dot wave",
  },
  qa: {
    cspCoverage: "tooling/scripts/verify-csp.mjs (every inline script sha256-pinned)",
    cspRender:
      "tooling/scripts/verify-csp-render.mjs (serves dist with the real _headers; asserts no console errors + every [data-reveal] revealed)",
    envChecks:
      "tooling/scripts/verify-env-emulation.mjs (motion-policy / no-JS / landscape overflow)",
    contract: "tooling/scripts/verify-design-contract.mjs (125 checks, both schemes)",
    devices: "tooling/scripts/device-qa.mjs (iPhone 14 / Pixel 7 emulation sweep)",
    visualSweep: "tooling/scripts/visual-capture.mjs (8 viewports, full-page)",
    checklist: "docs/QA-CHECKLIST.md",
  },
};

// Format with prettier (the repo's own config) so `pnpm manifest` and
// `pnpm format` never fight over this file.
const prettierConfig = (await resolveConfig(MANIFEST)) ?? {};
const next = await format(JSON.stringify(manifest, null, 2), { ...prettierConfig, parser: "json" });
const current = readFileSync(MANIFEST, "utf8");

if (process.argv.includes("--check")) {
  if (current !== next) {
    console.error("components.manifest.json is out of date — run `pnpm manifest`");
    process.exit(1);
  }
  console.log("components.manifest.json is up to date");
} else {
  writeFileSync(MANIFEST, next);
  console.log(`components.manifest.json written — ${manifest.components.length} components`);
}
