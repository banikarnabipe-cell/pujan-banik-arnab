/**
 * Environment emulation verification via playwright-core over CDP:
 * 1. prefers-reduced-motion: reduce → motion STILL runs (v0.7.0 owner policy:
 *    no suppression). Duration tokens intact, observer engaged, wave animates.
 * 2. JS disabled → html.js absent, [data-reveal] fully visible (no-JS fallback)
 * 3. Landscape mobile viewport smoke check
 */
import { launchBrowser, resolveOrigin, screenshotPath, makeReporter } from "./lib/browser.mjs";

const { origin: SITE, close: closeServer } = await resolveOrigin();
const reporter = makeReporter();
const check = reporter.check;

const browser = await launchBrowser();

// Release the browser and the local server even if a check throws, so a failed
// gate does not leave an orphaned Chrome behind.
let cleaned = false;
const cleanup = async () => {
  if (cleaned) return;
  cleaned = true;
  await browser.close().catch(() => {});
  await closeServer();
};
for (const event of ["uncaughtException", "unhandledRejection"]) {
  process.once(event, async (err) => {
    await cleanup();
    console.error(err);
    process.exit(1);
  });
}

// --- 1. reduced motion: policy = motion still runs (no suppression) ---
const ctx1 = await browser.newContext({
  reducedMotion: "reduce",
  viewport: { width: 1280, height: 800 },
});
const p1 = await ctx1.newPage();
await p1.goto(SITE, { waitUntil: "networkidle" });
const rm = await p1.evaluate(() => {
  const html = getComputedStyle(document.documentElement);
  const cv = document.querySelector(".hero > canvas.wave");
  const grab = () => {
    if (!cv) return -1;
    const c = document.createElement("canvas");
    c.width = cv.width;
    c.height = cv.height;
    const g = c.getContext("2d");
    g.drawImage(cv, 0, 0);
    const d = g.getImageData(0, 0, c.width, Math.min(c.height, 300)).data;
    let non = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) non++;
    return non;
  };
  const a = grab();
  return {
    durLong2: html.getPropertyValue("--md-sys-motion-duration-long2").trim(),
    scrollBehavior: html.scrollBehavior,
    noObserve: document.documentElement.classList.contains("no-observe"),
    revealCount: document.querySelectorAll("[data-reveal]").length,
    px1: a,
  };
});
// Wave animation needs two samples in time — separate evaluate.
const rmWaveAnim = await p1.evaluate(async () => {
  const cv = document.querySelector(".hero > canvas.wave");
  if (!cv) return { ok: false, why: "no canvas" };
  const grab = () => {
    const c = document.createElement("canvas");
    c.width = cv.width;
    c.height = cv.height;
    const g = c.getContext("2d");
    g.drawImage(cv, 0, 0);
    const d = g.getImageData(0, 0, c.width, Math.min(c.height, 300)).data;
    let non = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) non++;
    return non;
  };
  const a = grab();
  await new Promise((r) => setTimeout(r, 900));
  const b = grab();
  return { ok: a !== b, why: `a=${a} b=${b}` };
});
const toMs = (v) => {
  const m = String(v).match(/^([\d.]+)(ms|s)$/);
  return m ? Math.round(parseFloat(m[1]) * (m[2] === "s" ? 1000 : 1)) : NaN;
};
check(
  "reduced-motion: duration tokens NOT zeroed (--…long2 = 500ms)",
  toMs(rm.durLong2) === 500,
  `${rm.durLong2} (${toMs(rm.durLong2)}ms)`,
);
check("reduced-motion: smooth scroll retained", rm.scrollBehavior === "smooth", rm.scrollBehavior);
check(
  "reduced-motion: reveal observer engaged (no no-observe)",
  rm.noObserve === false && rm.revealCount > 0,
  `noObserve=${rm.noObserve} reveals=${rm.revealCount}`,
);
check("reduced-motion: hero wave ANIMATES (no suppression)", rmWaveAnim.ok, rmWaveAnim.why);
await p1.screenshot({ path: screenshotPath("env-reduced-motion.png") });
await ctx1.close();

// --- 2. JS disabled ---
const ctx2 = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 1280, height: 800 },
});
const p2 = await ctx2.newPage();
await p2.goto(SITE, { waitUntil: "networkidle" });
const nojs = await p2.evaluate(() => {
  const els = [...document.querySelectorAll("[data-reveal]")];
  const hidden = els.filter((el) => Number(getComputedStyle(el).opacity) < 1);
  const h1 = document.querySelector("h1");
  return {
    total: els.length,
    hidden: hidden.length,
    jsClass: document.documentElement.classList.contains("js"),
    h1Visible: h1 ? Number(getComputedStyle(h1).opacity) : 0,
  };
});
check("no-JS: html.js gate absent", nojs.jsClass === false);
check(
  "no-JS: all content visible",
  nojs.hidden === 0 && nojs.h1Visible === 1,
  `${nojs.hidden}/${nojs.total} hidden`,
);
await ctx2.close();

// --- 3. landscape mobile smoke ---
const ctx3 = await browser.newContext({ viewport: { width: 844, height: 390 } });
const p3 = await ctx3.newPage();
await p3.goto(SITE, { waitUntil: "networkidle" });
const overflow = await p3.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
check(
  "landscape 844x390: no horizontal overflow",
  overflow.scrollW <= overflow.clientW,
  `${overflow.scrollW}px vs ${overflow.clientW}px`,
);
await p3.screenshot({ path: screenshotPath("site-844-landscape.png") });
await ctx3.close();

await cleanup();
reporter.finish();
