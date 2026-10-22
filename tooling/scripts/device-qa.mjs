// Device emulation captures: iPhone 14 (390x844@3, DPR 3 capped 2) & Pixel 7 (412x915@2.6)
import { createRequire } from "node:module";
const require = createRequire("/home/z/my-project/rea-agent/package.json");
const { chromium } = require("playwright-core");
const CDP = process.env.CDP_ENDPOINT || "http://127.0.0.1:46049";
const devices = [
  { name: "iphone14", width: 390, height: 844, dpr: 3, mobile: true, ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { name: "pixel7", width: 412, height: 915, dpr: 2.625, mobile: true, ua: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36" },
];
const browser = await chromium.connectOverCDP(CDP);
const ctx = await browser.newContext();
for (const d of devices) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: d.width, height: d.height });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  // step scroll to fire reveals
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += Math.round(innerHeight * 0.8)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({ dw: document.documentElement.scrollWidth, iw: innerWidth }));
  console.log(`${d.name}: scrollWidth=${m.dw} innerWidth=${m.iw} ${m.dw > m.iw ? "OVERFLOW" : "ok"}`);
  await page.screenshot({ path: `tool-results/qa/device-${d.name}.png`, fullPage: true });
  await page.close();
}
await ctx.close();
await browser.close();
