// Device emulation captures: iPhone 14 (390x844@3, DPR 3 capped 2) & Pixel 7 (412x915@2.6)
import { launchBrowser, resolveOrigin, screenshotPath } from "./lib/browser.mjs";

const devices = [
  {
    name: "iphone14",
    width: 390,
    height: 844,
    dpr: 3,
    mobile: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    name: "pixel7",
    width: 412,
    height: 915,
    dpr: 2.625,
    mobile: true,
    ua: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  },
];

const { origin: SITE, close: closeServer } = await resolveOrigin();
const browser = await launchBrowser();
let overflows = 0;

for (const d of devices) {
  // deviceScaleFactor / userAgent / isMobile were declared but never applied —
  // the sweep was viewport-only, so the DPR and mobile-UA claims were false.
  const ctx = await browser.newContext({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: Math.min(d.dpr, 2),
    userAgent: d.ua,
    isMobile: d.mobile,
    hasTouch: d.mobile,
  });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: "networkidle" });
  // step scroll to fire reveals
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += Math.round(innerHeight * 0.8)) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({
    dw: document.documentElement.scrollWidth,
    iw: innerWidth,
  }));
  const bad = m.dw > m.iw;
  if (bad) overflows++;
  console.log(`${d.name}: scrollWidth=${m.dw} innerWidth=${m.iw} ${bad ? "OVERFLOW" : "ok"}`);
  await page.screenshot({ path: screenshotPath(`device-${d.name}.png`), fullPage: true });
  await ctx.close();
}

await browser.close();
await closeServer();
process.exit(overflows ? 1 : 0);
