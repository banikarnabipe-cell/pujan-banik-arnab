#!/usr/bin/env node
/**
 * CSP hash helper: extracts the inline bootstrap script (html.js gate) from
 * dist/index.html, computes its sha256, and rewrites the script-src hash in
 * apps/web/public/_headers. Run AFTER `pnpm build` (the built page contains
 * the exact script bytes the browser will execute).
 * Usage: node tooling/scripts/csp-hash.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const DIST = "/home/z/my-project/apps/web/dist/index.html";
const HEADERS = "/home/z/my-project/apps/web/public/_headers";

const html = readFileSync(DIST, "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const bootstrap = scripts.find((s) => s.includes('classList.add("js")'));
if (!bootstrap) {
  console.error("FAIL: inline bootstrap script not found in dist/index.html");
  process.exit(1);
}
const hash = `'sha256-${createHash("sha256").update(bootstrap, "utf8").digest("base64")}'`;

const headers = readFileSync(HEADERS, "utf8");
if (!/script-src[^;]*'sha256-[^']+'/.test(headers)) {
  console.error("FAIL: no sha256 hash token found in _headers");
  process.exit(1);
}
const updated = headers.replace(/'sha256-[^']+'/, hash);
writeFileSync(HEADERS, updated);
console.log(`CSP script hash: ${hash}`);
console.log("_headers updated.");
