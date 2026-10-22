// Visual QA capture: step-scrolls the page so scroll-reveals fire, then takes
// full-page screenshots at the mandated viewports.
//
// Replaces the previous bash script, which needed an external `agent-browser`
// CLI that is not part of this repo and could not run anywhere it was not
// hand-installed. This version uses the repo's own playwright-core.
import { launchBrowser, resolveOrigin, screenshotPath } from "./lib/browser.mjs";

const VIEWPORTS = [
  [320, 568],
  [375, 812],
  [414, 896],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];

const { origin: SITE, close: closeServer } = await resolveOrigin();
const browser = await launchBrowser();
let failures = 0;

for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: "networkidle" });
  // step-scroll to trigger the IntersectionObserver reveals
  await page.evaluate(async () => {
    const total = document.body.scrollHeight;
    for (let y = 0; y <= total; y += Math.round(innerHeight * 0.8)) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 150));
    }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(600);
  try {
    await page.screenshot({ path: screenshotPath(`site-${w}.png`), fullPage: true });
    console.log(`${w} OK`);
  } catch (err) {
    failures++;
    console.log(`${w} FAIL — ${err.message}`);
  }
  await ctx.close();
}

await browser.close();
await closeServer();
process.exit(failures ? 1 : 0);
