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
import { launchBrowser, resolveOrigin, makeReporter } from "./lib/browser.mjs";

const reporter = makeReporter();
const check = reporter.check;

// ---- site under test --------------------------------------------------------
// lib/browser.mjs serves apps/web/dist with the real dist/_headers applied,
// so the browser enforces the production Content-Security-Policy here.
const { origin, close: closeServer } = await resolveOrigin();

// ---- browser assertions ----------------------------------------------------
const consoleErrors = [];
const failedRequests = [];

const browser = await launchBrowser();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("requestfailed", (r) => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));

  await page.goto(origin + "/", { waitUntil: "networkidle" });

  check(
    "R1 no console errors (CSP violations surface here)",
    consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(" | "),
  );
  check(
    "R2 no failed network requests",
    failedRequests.length === 0,
    failedRequests.slice(0, 3).join(" | "),
  );

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
  check(
    "R4 all [data-reveal] revealed after scroll",
    reveal.revealed === reveal.total,
    `${reveal.revealed}/${reveal.total}`,
  );
  check(
    "R5 hero <h1> visible (computed opacity 1)",
    reveal.h1Opacity === "1",
    `opacity=${reveal.h1Opacity}`,
  );

  await ctx.close();
} finally {
  await browser.close();
  await closeServer();
}

reporter.finish();
