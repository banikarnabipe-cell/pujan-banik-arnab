/**
 * Portable browser harness for the QA gates.
 *
 * Why this exists: the gates used to resolve `playwright-core` from an
 * absolute path in a DIFFERENT repo and to attach to a hand-started Chrome
 * over CDP on a hardcoded port, so they could only run on one machine. They
 * now resolve everything relative to this repo:
 *
 *   - playwright-core comes from this repo's own node_modules
 *   - the browser is launched by the gate itself (no external CDP endpoint),
 *     using an already-installed Chrome/Edge via `channel`, so CI does not
 *     need to download a browser
 *   - the site is served from apps/web/dist with the REAL dist/_headers
 *     applied, so the gates exercise the production Content-Security-Policy
 *     instead of a header-less preview server
 *
 * Environment overrides (all optional):
 *   SITE        point the gate at an already-running URL (e.g. a live deploy)
 *   CHROME_BIN  explicit browser executable
 *   PW_CHANNEL  playwright channel: "chrome" (default) | "msedge" | "chrome-beta"
 *   DIST        directory to serve (default apps/web/dist)
 *   OUT_DIR     where screenshots are written (default tool-results/qa)
 */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

// lib/browser.mjs lives one level deeper than the scripts that used to
// compute this, so the repo root is four levels up from this file.
export const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
export const DIST = resolve(process.env.DIST ?? join(REPO_ROOT, "apps/web/dist"));
export const OUT_DIR = resolve(process.env.OUT_DIR ?? join(REPO_ROOT, "tool-results/qa"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/** Minimal Cloudflare `_headers` parser: blocks of `path` + indented `Name: value`. */
function parseHeadersFile(text) {
  const rules = [];
  let current = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (/^\s/.test(line) && current) {
      const idx = line.indexOf(":");
      if (idx > 0) current.headers.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()]);
    } else {
      current = { path: line.trim(), headers: [] };
      rules.push(current);
    }
  }
  return rules;
}

/**
 * Does a `_headers` rule path apply to this request path?
 *
 * Cloudflare matches `/*` for everything, an exact path for that path, and a
 * trailing `*` as a prefix (e.g. `/assets/*`). Matching only `/*` and exact
 * paths would silently ignore a prefix rule, and the gate would then be
 * testing a different security policy than production.
 */
function ruleMatches(rulePath, urlPath) {
  if (rulePath === "/*") return true;
  if (rulePath.endsWith("*")) return urlPath.startsWith(rulePath.slice(0, -1));
  return urlPath === rulePath;
}

/**
 * Serve apps/web/dist with dist/_headers applied — the same headers the
 * Cloudflare edge sends. Returns { origin, close }.
 */
export async function serveDist() {
  const headersPath = join(DIST, "_headers");
  if (!existsSync(headersPath)) {
    throw new Error(`dist/_headers not found in ${DIST} — run \`pnpm build\` first.`);
  }
  const rules = parseHeadersFile(readFileSync(headersPath, "utf8"));
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    // resolve() collapses "..", and the prefix check refuses anything that
    // still points outside dist. Without it a request for
    // "/..%2f..%2fpackage.json" would read files above the served root.
    const fsPath = resolve(DIST, "." + (urlPath === "/" ? "/index.html" : urlPath));
    if (fsPath !== DIST && !fsPath.startsWith(DIST + sep)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("forbidden");
      return;
    }
    if (!existsSync(fsPath) || statSync(fsPath).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
      return;
    }
    const headers = { "Content-Type": MIME[extname(fsPath)] ?? "application/octet-stream" };
    for (const rule of rules) {
      if (ruleMatches(rule.path, urlPath)) {
        for (const [k, v] of rule.headers) headers[k] = v;
      }
    }
    res.writeHead(200, headers);
    res.end(readFileSync(fsPath));
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(() => done())),
  };
}

/** Common install locations, tried in order when a channel lookup fails. */
const CHROME_PATHS = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

/**
 * Launch a browser. Uses an already-installed Chrome/Edge by channel unless
 * overridden, and falls back to the well-known install paths so the gates
 * still run on a CI image where the channel lookup does not resolve.
 */
export async function launchBrowser() {
  const explicit = process.env.CHROME_BIN;
  if (explicit) return chromium.launch({ headless: true, executablePath: explicit });

  const channel = process.env.PW_CHANNEL ?? "chrome";
  const attempts = [
    { channel },
    ...CHROME_PATHS.filter((p) => existsSync(p)).map((executablePath) => ({ executablePath })),
    { channel: "msedge" },
  ];
  let lastError;
  for (const opts of attempts) {
    try {
      return await chromium.launch({ headless: true, ...opts });
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `Could not launch a browser. Tried channel "${channel}" and ${attempts.length - 1} known install paths. ` +
      `Set CHROME_BIN to a Chrome/Edge executable to override.\n${lastError?.message ?? ""}`,
  );
}

/**
 * Resolve the origin under test: an explicit SITE if provided, otherwise a
 * local server over dist with the production headers applied.
 */
export async function resolveOrigin() {
  if (process.env.SITE) return { origin: process.env.SITE, close: async () => {} };
  const served = await serveDist();
  console.log(`serving ${DIST} at ${served.origin} (with dist/_headers applied)`);
  return { origin: served.origin, close: served.close };
}

/** Write a screenshot into the gitignored tool-results directory. */
export function screenshotPath(name) {
  mkdirSync(OUT_DIR, { recursive: true });
  return join(OUT_DIR, name);
}

/** Shared PASS/FAIL reporter so every gate prints the same shape. */
export function makeReporter() {
  let failures = 0;
  return {
    check(name, ok, detail = "") {
      if (!ok) failures++;
      console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
    },
    get failures() {
      return failures;
    },
    finish() {
      console.log(failures ? `\n${failures} check(s) FAILED` : "\nall checks PASS");
      // Set the code rather than calling process.exit(): exiting immediately
      // can truncate stdout when it is piped.
      process.exitCode = failures ? 1 : 0;
    },
  };
}
