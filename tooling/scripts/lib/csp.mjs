/**
 * Shared CSP coverage helpers.
 *
 * Single source of truth for "which inline scripts exist in the built page
 * and which sha256 hashes does _headers pin". Used by:
 *   - tooling/scripts/csp-hash.mjs   (regenerates the hash list after build)
 *   - tooling/scripts/verify-csp.mjs (static CI gate — no browser needed)
 *
 * The invariant: EVERY <script> without a src attribute in dist/index.html
 * must have its sha256 pinned in the script-src directive of dist/_headers.
 * An unpinned inline script is silently blocked by the edge and has already
 * caused one production incident (v0.7.1: reveal observer never ran, all
 * [data-reveal] content invisible — see docs/HANDOFF.md).
 */
import { createHash } from "node:crypto";

/** Extract the exact bytes of every inline script from built HTML. */
export function extractInlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => m[1],
  );
}

/** sha256 → base64 digest of a script body, in CSP source-expression form. */
export function cspHashFor(scriptBody) {
  return `'sha256-${createHash("sha256").update(scriptBody, "utf8").digest("base64")}'`;
}

/** Pull the pinned sha256 hashes (quoted CSP tokens) out of a _headers file. */
export function parseCspHashes(headersText) {
  // NB: comment lines may mention "script-src" too — only a line carrying an
  // actual sha256 token counts (the directive line itself).
  const line = headersText
    .split("\n")
    .find((l) => l.includes("script-src") && l.includes("'sha256-"));
  if (!line) return [];
  return [...line.matchAll(/'sha256-[A-Za-z0-9+/=]+'/g)].map((m) => m[0]);
}

/**
 * Verify dist/index.html ↔ dist/_headers consistency.
 * Returns { ok, inlineCount, pinnedCount, missing[], unpinned[] }.
 */
export function verifyCspCoverage(indexHtml, headersText) {
  const inline = extractInlineScripts(indexHtml);
  const pinned = new Set(parseCspHashes(headersText));
  const computed = inline.map((body) => cspHashFor(body));
  const missing = computed.filter((h) => !pinned.has(h)); // inline but NOT pinned → blocked on edge
  const unpinned = [...pinned].filter((h) => !computed.includes(h)); // stale pins
  return {
    ok: missing.length === 0 && unpinned.length === 0 && inline.length > 0,
    inlineCount: inline.length,
    pinnedCount: pinned.size,
    missing,
    unpinned,
  };
}
