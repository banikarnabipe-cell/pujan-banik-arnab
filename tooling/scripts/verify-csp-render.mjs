#!/usr/bin/env node
/**
 * CSP render harness — the regression gate for the "invisible content" bug.
 *
 * Serves apps/web/dist over a local HTTP server that applies the EXACT
 * headers from dist/_headers (the same ones the Cloudflare edge sends),
 * loads the page in headless Chromium, and asserts:
 *   R1. zero console errors (CSP violations surface here)
 *   R2. zero failed network requests
 *   R3. the html.js boot class is present (inline boot script allowed)
 *   R4. EVERY [data-reveal] element reaches .is-in after step-scroll
 *   R5. the hero <h1> is actually visible (computed opacity === "1")
 *
 * Bug class this catches: an inline script that is NOT pinned by the CSP
 * sha256 list in _headers gets blocked on the edge, the IntersectionObserver
 * never starts, and all [data-reveal] content stays opacity:0 — locally
 * invisible only because astro preview sends no CSP. Local QA without this
 * harness CANNOT catch it.
 *
 * Usage:
 *   node tooling/scripts/verify-csp-render.mjs            # serve dist locally
 *   SITE=https://<live-url> node tooling/scripts/verify-csp-render.mjs
 *                                                         # test a deployment
 * Exit code 0 = all assertions pass, 1 = failures (printed with FAIL tags).
 */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const require = createRequire("/home/z/my-project/rea-agent/package.json");
const { chromium } = require("playwright-core");

const CHROME_BIN =
  process.env.CHROME_BIN ??
  "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome";
const DIST = resolve(process.env.DIST ?? "/home/z/my-project/apps/web/dist");
const SITE = process.env.SITE; // e.g. https://pujan-banik-arnab.banikarnab-ipe.workers.dev
const PORT = Number(process.env.PORT ?? 0); // 0 = ephemeral

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

// ---- static server that applies dist/_headers ------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

function parseHeadersFile(text) {
  /** Minimal _headers parser: blocks of `path` + indented `Name: value`. */
  const rules = [];
  let current = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (/^\s/.test(line) && current) {
      const idx = line.indexOf(":");
      if (idx > 0)
        current.headers.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()]);
    } else {
      current = { path: line.trim(), headers: [] };
      rules.push(current);
    }
  }
  return rules;
}

let server = null;
let origin = SITE;
if (!origin) {
  const rules = parseHeadersFile(readFileSync(join(DIST, "_headers"), "utf8"));
  server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let fsPath = join(DIST, urlPath === "/" ? "index.html" : urlPath);
    if (!existsSync(fsPath) || statSync(fsPath).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
      return;
    }
    const headers = { "Content-Type": MIME[extname(fsPath)] ?? "application/octet-stream" };
    for (const rule of rules) {
      if (rule.path === "/*" || urlPath === rule.path) {
        for (const [k, v] of rule.headers) headers[k] = v;
      }
    }
    res.writeHead(200, headers);
    res.end(readFileSync(fsPath));
  });
  await new Promise((ok) => server.listen(PORT, "127.0.0.1", ok));
  origin = `http://127.0.0.1:${server.address().port}`;
  console.log(`serving ${DIST} at ${origin} (with dist/_headers applied)`);
}

// ---- browser assertions ----------------------------------------------------
const consoleErrors = [];
const failedRequests = [];

const browser = await chromium.launch({ headless: true, executablePath: CHROME_BIN });
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("requestfailed", (r) => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));

  await page.goto(origin + "/", { waitUntil: "networkidle" });

  check("R1 no console errors (CSP violations surface here)", consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(" | "));
  check("R2 no failed network requests", failedRequests.length === 0,
    failedRequests.slice(0, 3).join(" | "));

  const boot = await page.evaluate(() => document.documentElement.classList.contains("js"));
  check("R3 html.js boot class present (inline boot allowed by CSP)", boot);

  // step-scroll like device-qa so IntersectionObserver reveals fire.
  // NB: the site sets CSS scroll-behavior: smooth — plain scrollTo() would
  // animate and never reach lower sections within the sweep cadence, so
  // force instant jumps (documented harness artifact from the dark-mode QA).
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += Math.round(innerHeight * 0.8)) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 150));
    }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(800);

  const reveal = await page.evaluate(() => {
    const els = [...document.querySelectorAll("[data-reveal]")];
    return {
      total: els.length,
      revealed: els.filter((e) => e.classList.contains("is-in")).length,
      h1Opacity: getComputedStyle(document.querySelector("h1")).opacity,
    };
  });
  check("R4 [data-reveal] elements exist", reveal.total > 0, `${reveal.total} targets`);
  check("R4 all [data-reveal] revealed after scroll", reveal.revealed === reveal.total,
    `${reveal.revealed}/${reveal.total}`);
  check("R5 hero <h1> visible (computed opacity 1)", reveal.h1Opacity === "1",
    `opacity=${reveal.h1Opacity}`);

  await ctx.close();
} finally {
  await browser.close();
  if (server) server.close();
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nall CSP render checks PASS");
process.exit(failures ? 1 : 0);
