// Live-browser forensics of https://theretriever.app/ dot-pattern visuals.
// Launches its own browser, extracts computed styles, runs the console
// diagnostic, samples canvas pixels, captures screenshots.
import fs from "node:fs";
import { launchBrowser, REPO_ROOT } from "./lib/browser.mjs";
import { join } from "node:path";

const OUT = join(REPO_ROOT, "tool-results/ref-forensics");
fs.mkdirSync(OUT, { recursive: true });

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const network = [];
page.on("response", (r) => {
  const u = r.url();
  if (/\.(svg|png|jpe?g|webp|avif|css|js)(\?|#|$)/i.test(u))
    network.push({ url: u, status: r.status(), type: r.headers()["content-type"] || "" });
});

await page.goto("https://theretriever.app/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);

// ── A. DOM structure + computed styles of hero/wave ─────────────────────────
const dom = await page.evaluate(() => {
  const pick = (el, props) => {
    const s = getComputedStyle(el);
    const o = {};
    for (const p of props) o[p] = s.getPropertyValue(p);
    const r = el.getBoundingClientRect();
    o._rect = {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
    return o;
  };
  const hero = document.querySelector(".hero");
  const wave = document.querySelector("canvas.wave");
  const wrap = hero?.querySelector(":scope > .wrap");
  const out = {
    heroTag: hero ? hero.tagName + "." + hero.className : null,
    heroStyles: hero
      ? pick(hero, ["position", "overflow", "padding", "background", "z-index"])
      : null,
    waveOuterHTML: wave ? wave.outerHTML : null,
    waveStyles: wave
      ? pick(wave, [
          "position",
          "inset",
          "width",
          "height",
          "z-index",
          "color",
          "opacity",
          "pointer-events",
          "mask-image",
          "-webkit-mask-image",
          "mask-composite",
          "-webkit-mask-composite",
          "background-image",
          "display",
        ])
      : null,
    wrapStyles: wrap
      ? pick(wrap, ["position", "z-index", "display", "grid-template-columns"])
      : null,
    heroParentChain: (() => {
      let c = hero,
        chain = [];
      for (let i = 0; i < 4 && c; i++) {
        chain.push(c.tagName + "." + String(c.className).split(" ").join("."));
        c = c.parentElement;
      }
      return chain;
    })(),
    canvases: [...document.querySelectorAll("canvas")].map((c) => ({
      cls: c.className,
      data: { ...c.dataset },
      rect: ((r) => ({ w: Math.round(r.width), h: Math.round(r.height) }))(
        c.getBoundingClientRect(),
      ),
      visible: c.checkVisibility ? c.checkVisibility() : true,
    })),
    waveColor: wave ? getComputedStyle(wave).color : null,
    darkScheme: matchMedia("(prefers-color-scheme: dark)").matches,
  };
  return out;
});

// ── B. The task's console diagnostic ─────────────────────────────────────────
const diagnostic = await page.evaluate(() => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
  };
  const selector = (el) => {
    const cls =
      typeof el.className === "string"
        ? el.className.trim().split(/\s+/).slice(0, 3).join(".")
        : "";
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (cls ? "." + cls : "");
  };
  const results = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const pseudoStyles = ["::before", "::after"]
      .map((pseudo) => {
        const s = getComputedStyle(el, pseudo);
        return {
          pseudo,
          content: s.content,
          backgroundImage: s.backgroundImage,
          maskImage: s.maskImage,
          webkitMaskImage: s.webkitMaskImage,
          opacity: s.opacity,
          position: s.position,
          animationName: s.animationName,
          animationDuration: s.animationDuration,
        };
      })
      .filter(
        (p) =>
          p.content !== "none" &&
          (p.backgroundImage !== "none" ||
            p.maskImage !== "none" ||
            p.webkitMaskImage !== "none" ||
            p.animationName !== "none"),
      );
    const isImageOrCanvas = /^(IMG|SVG|CANVAS)$/.test(el.tagName);
    if (
      style.backgroundImage !== "none" ||
      style.maskImage !== "none" ||
      style.webkitMaskImage !== "none" ||
      isImageOrCanvas ||
      pseudoStyles.length
    ) {
      results.push({
        element: selector(el),
        tag: el.tagName,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        image: el.currentSrc || "",
        backgroundImage: style.backgroundImage,
        backgroundSize: style.backgroundSize,
        backgroundPosition: style.backgroundPosition,
        maskImage: style.maskImage,
        opacity: style.opacity,
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        pseudoStyles,
      });
    }
  }
  const resources = performance
    .getEntriesByType("resource")
    .map((r) => r.name)
    .filter((url) => /\.(svg|png|jpe?g|webp|avif)(\?|#|$)/i.test(url));
  return { results, resources };
});

// ── C. Canvas pixel forensics: painted? animated? ────────────────────────────
const pixels = await page.evaluate(async () => {
  const cv = document.querySelector("canvas.wave");
  if (!cv) return null;
  const grab = () => {
    const c = document.createElement("canvas");
    c.width = cv.width;
    c.height = cv.height;
    const g = c.getContext("2d");
    g.drawImage(cv, 0, 0);
    const d = g.getImageData(0, 0, c.width, Math.min(c.height, 400)).data;
    let non = 0,
      sum = 0;
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] > 0) {
        non++;
        sum += d[i];
      }
    }
    return { nonZeroAlpha: non, avgAlpha: non ? +(sum / non).toFixed(2) : 0 };
  };
  const a = grab();
  await new Promise((r) => setTimeout(r, 1500));
  const b = grab();
  const mask =
    getComputedStyle(cv).webkitMaskImage !== "none"
      ? getComputedStyle(cv).webkitMaskImage.slice(0, 160)
      : "none";
  return {
    sampleA: a,
    sampleB: b,
    animated: a.nonZeroAlpha !== b.nonZeroAlpha,
    dpr: devicePixelRatio,
    maskImageFirst160: mask,
  };
});

// ── D. Screenshots: desktop hero (t0/t1 for animation proof), decay section ──
const hero = await page.$(".hero");
await hero.screenshot({ path: `${OUT}/ref-hero-desktop-t0.png` });
await page.waitForTimeout(1500);
await hero.screenshot({ path: `${OUT}/ref-hero-desktop-t1.png` });
await page.evaluate(() => {
  const el = [...document.querySelectorAll(".kicker")].find((k) =>
    /What deleted means/.test(k.textContent),
  );
  el?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/ref-decay-section.png` });

// ── E. Mobile viewport wave opacity ──────────────────────────────────────────
const mpage = await ctx.newPage();
await mpage.setViewportSize({ width: 390, height: 844 });
await mpage.goto("https://theretriever.app/", { waitUntil: "networkidle", timeout: 60000 });
await mpage.waitForTimeout(800);
const mobile = await mpage.evaluate(() => {
  const w = document.querySelector(".hero > .wave");
  const s = getComputedStyle(w);
  const r = w.getBoundingClientRect();
  return {
    opacity: s.opacity,
    maskImage: s.maskImage.slice(0, 120),
    rect: { w: Math.round(r.width), h: Math.round(r.height) },
  };
});
await (await mpage.$(".hero")).screenshot({ path: `${OUT}/ref-hero-mobile-390.png` });

fs.writeFileSync(
  `${OUT}/report.json`,
  JSON.stringify(
    { dom, diagnostic, pixels, mobile, network: network.filter((n) => /theretriever/.test(n.url)) },
    null,
    2,
  ),
);
console.log("DOM:", JSON.stringify(dom, null, 1).slice(0, 2200));
console.log("\nPIXELS:", JSON.stringify(pixels));
console.log("\nMOBILE:", JSON.stringify(mobile));
console.log(
  "\nDIAG_RESULTS:",
  diagnostic.results.length,
  "| RESOURCES:",
  diagnostic.resources.filter((r) => /decay|wave|\.svg/.test(r)).join(", "),
);
console.log("NET(decay/wave):", JSON.stringify(network.filter((n) => /decay|wave/.test(n.url))));
await ctx.close();
await browser.close();
console.log("DONE ->", OUT);
