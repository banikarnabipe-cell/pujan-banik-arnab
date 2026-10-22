#!/usr/bin/env node
/**
 * CSP hash regenerator: extracts ALL inline scripts from dist/index.html,
 * computes their sha256 digests, and rewrites the script-src hash list in
 * apps/web/public/_headers. Run AFTER `pnpm build` (the built page contains
 * the exact script bytes the browser will execute).
 *
 * v0.7.1: previously pinned only the html.js boot gate — when Astro
 * auto-inlined the reveal observer (small processed <script>), it shipped
 * unpinned and was CSP-blocked on the edge (content invisible). Now every
 * inline script is pinned, and the result is self-verified with the same
 * logic the CI gate (verify-csp.mjs) enforces.
 *
 * Usage: node tooling/scripts/csp-hash.mjs
 * Exit 0 = _headers updated + coverage verified; 1 = inconsistent dist.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractInlineScripts, cspHashFor, verifyCspCoverage } from "./lib/csp.mjs";

// Repo-relative so the tool works from any checkout location.
const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const DIST = join(REPO_ROOT, "apps/web/dist");
const HEADERS = join(REPO_ROOT, "apps/web/public/_headers");

const html = readFileSync(join(DIST, "index.html"), "utf8");
const inline = extractInlineScripts(html);
if (inline.length === 0) {
  console.error("FAIL: no inline scripts found in dist/index.html (unexpected)");
  process.exit(1);
}

const hashes = inline.map((body) => cspHashFor(body));

const headers = readFileSync(HEADERS, "utf8");
if (!/script-src[^;]*'sha256-[^']+'/.test(headers)) {
  console.error("FAIL: no sha256 hash token found in _headers");
  process.exit(1);
}

const updated = headers.replace(
  /'sha256-[^']+'((?:\s*'sha256-[^']+')*)/,
  hashes.join(" "),
);
writeFileSync(HEADERS, updated);
console.log(`pinned ${hashes.length} inline script hash(es):`);
for (const h of hashes) console.log(`  ${h}`);

// Self-verify with the shared gate logic (dist copy lags public/_headers by
// one build, so verify against the file we just wrote).
const coverage = verifyCspCoverage(html, updated);
if (!coverage.ok) {
  console.error("FAIL: coverage inconsistent after rewrite", coverage);
  process.exit(1);
}
console.log("self-check OK: every inline script is pinned, no stale pins.");
console.log("_headers updated.");
