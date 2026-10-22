#!/usr/bin/env node
/**
 * CSP coverage gate (static, browser-free — safe for CI).
 *
 * Asserts the dist artifacts are internally consistent BEFORE anything
 * deploys:
 *   S1. dist/_headers exists (CSP is actually shipped)
 *   S2. EVERY inline script in dist/index.html is sha256-pinned in the
 *       script-src directive of dist/_headers
 *   S3. no stale pins (hashes in _headers that no longer match any inline
 *       script — they'd silently allow-block future edits)
 *   S4. public/reveal.js exists in dist AND is referenced externally by
 *       index.html (the reveal observer must never be auto-inlined again)
 *
 * Usage: node tooling/scripts/verify-csp.mjs [distDir]
 * Exit 0 = pass, 1 = fail (prints FAIL lines).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { verifyCspCoverage } from "./lib/csp.mjs";

const DIST = resolve(process.argv[2] ?? "/home/z/my-project/apps/web/dist");
let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

const indexHtmlPath = join(DIST, "index.html");
const headersPath = join(DIST, "_headers");

// S1 — headers shipped
check("S1 dist/_headers exists", existsSync(headersPath));
if (!existsSync(headersPath) || !existsSync(indexHtmlPath)) {
  console.log("dist incomplete — cannot continue");
  process.exit(1);
}

// S2 + S3 — hash coverage in both directions
const coverage = verifyCspCoverage(readFileSync(indexHtmlPath, "utf8"), readFileSync(headersPath, "utf8"));
check(
  `S2 all inline scripts pinned (${coverage.inlineCount} inline / ${coverage.pinnedCount} pinned)`,
  coverage.missing.length === 0,
  coverage.missing.length ? `UNPINNED: ${coverage.missing.join(", ")}` : "",
);
check(
  "S3 no stale pins in _headers",
  coverage.unpinned.length === 0,
  coverage.unpinned.length ? `STALE: ${coverage.unpinned.join(", ")}` : "",
);

// S4 — reveal observer is external and shipped
const revealDist = join(DIST, "reveal.js");
const html = readFileSync(indexHtmlPath, "utf8");
check("S4 dist/reveal.js exists", existsSync(revealDist));
check(
  "S4 index.html references /reveal.js externally",
  /<script[^>]*src="\/reveal\.js"[^>]*>/.test(html),
);
const inlineCount = (html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) ?? []).length;
check(
  "S4 inline scripts limited to the pinned boot gate (≤ 1)",
  inlineCount <= 1,
  `${inlineCount} inline script(s)`,
);

console.log(failures ? `\n${failures} check(s) FAILED` : "\nCSP coverage gate: all checks PASS");
process.exit(failures ? 1 : 0);
