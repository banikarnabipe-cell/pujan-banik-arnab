// Capture our implementation's hero + About triptych at reference-equivalent
// viewports for side-by-side comparison with tool-results/ref-forensics/*.png.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire("/home/z/my-project/rea-agent/package.json");
const { chromium } = require("playwright-core");
const CDP = process.env.CDP_ENDPOINT || "http://127.0.0.1:46049";
const OUT = "/home/z/my-project/tool-results/impl-captures";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.connectOverCDP(CDP);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
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
await m.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await m.waitForTimeout(900);
await (await m.$(".hero")).screenshot({ path: `${OUT}/impl-hero-mobile-390.png` });

console.log("CONSOLE/NETWORK ERRORS:", errors.length ? errors : "none");
await ctx.close(); await browser.close();
console.log("DONE ->", OUT);
