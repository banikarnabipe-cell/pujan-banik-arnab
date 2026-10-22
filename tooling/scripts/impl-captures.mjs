// Capture our implementation's hero + About triptych at reference-equivalent
// viewports for side-by-side comparison with tool-results/ref-forensics/*.png.
import fs from "node:fs";
import { launchBrowser, resolveOrigin, REPO_ROOT } from "./lib/browser.mjs";
import { join } from "node:path";

const OUT = join(REPO_ROOT, "tool-results/impl-captures");
fs.mkdirSync(OUT, { recursive: true });

const { origin: SITE, close: closeServer } = await resolveOrigin();
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
});

await page.goto(SITE, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const hero = await page.$(".hero");
await hero.screenshot({ path: `${OUT}/impl-hero-desktop-t0.png` });
await page.waitForTimeout(1500);
await hero.screenshot({ path: `${OUT}/impl-hero-desktop-t1.png` });

// About triptych with decay SVGs
await page.evaluate(() => document.querySelector(".states")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/impl-about-states.png` });

// Mobile hero (reference: opacity 0.45 damping)
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 844 });
await m.goto(SITE, { waitUntil: "networkidle" });
await m.waitForTimeout(900);
await (await m.$(".hero")).screenshot({ path: `${OUT}/impl-hero-mobile-390.png` });

console.log("CONSOLE/NETWORK ERRORS:", errors.length ? errors : "none");
await ctx.close();
await browser.close();
await closeServer();
console.log("DONE ->", OUT);
process.exit(errors.length ? 1 : 0);
