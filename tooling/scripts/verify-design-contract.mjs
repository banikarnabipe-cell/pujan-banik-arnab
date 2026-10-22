/**
 * Design-contract verification (v0.6.0 rules) via playwright-core over CDP.
 * Encodes the user's directives as executable checks:
 *   D1. Canvas = #ECECEC exactly in light AND #1E1E1E exactly in dark
 *       (theretriever.app body backgrounds, live-verified 2026-10-22) at
 *       every viewport.
 *   D2. Hero carries the reference's ACTUAL dot pattern: the animated
 *       <canvas class="wave"> (data-speed 0.5, data-alpha 1.6, data-size 1.6,
 *       48x26 grid) — dual linear-gradient mask composited with intersect,
 *       token color #000 in light / #FFF in dark (reference paints .wave
 *       with color: var(--text)), painted pixels present, and ANIMATING
 *       (two canvas samples differ) unless prefers-reduced-motion
 *       (wave.js still frame).
 *   D3. Hero is the ONLY dotted SURFACE (no radial-gradient circle backgrounds
 *       anywhere else, elements and ::before/::after included; no extra
 *       canvas.wave outside the hero). The About decay-*.svg figures are
 *       content <img> illustrations and are checked separately (D5).
 *   D4. No horizontal overflow at any mandated viewport.
 *   D5. Verified reference SVGs reused byte-exact: About states reference
 *       /assets/decay-{1,2,3}.svg and all three load with HTTP 200.
 *   C1. Content sanity: enriched thesis (L18/ANOVA), crusher (QFD), SSC entry,
 *       phone link, résumé download, social links.
 *   A1. Key text contrast still AA+ on the neutral canvas, in BOTH schemes.
 */
import { launchBrowser, resolveOrigin, makeReporter } from "./lib/browser.mjs";

const { origin: SITE, close: closeServer } = await resolveOrigin();
const reporter = makeReporter();
const check = reporter.check;

const EXPECTED_WAVE = { speed: "0.5", alpha: "1.6", size: "1.6", cols: "48", rows: "26" };
const EXPECTED_MASK_X = "linear-gradient(90deg, rgba(0, 0, 0, 0), rgb(0, 0, 0) 42%)";
const EXPECTED_MASK_Y = "linear-gradient(rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0) 100%)";
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

const browser = await launchBrowser();
const ctx = await browser.newContext();

function lum(r, g, b) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg) {
  const L1 = lum(...fg),
    L2 = lum(...bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
const parseRGB = (s) => (s.match(/\d+/g) ?? []).slice(0, 3).map(Number);

for (const [w, h] of VIEWPORTS) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: w, height: h });
  await page.goto(SITE, { waitUntil: "networkidle" });
  const audit = await page.evaluate(
    ({ expected }) => {
      const bodyBg = getComputedStyle(document.documentElement).backgroundColor; // html carries the canvas
      const hero = document.querySelector(".hero");
      const wave = hero ? hero.querySelector(":scope > canvas.wave") : null;
      const ws = wave ? getComputedStyle(wave) : null;
      const others = [];
      for (const el of document.querySelectorAll("body, body *")) {
        for (const pseudo of ["", "::before", "::after"]) {
          const s = getComputedStyle(el, pseudo);
          if (/radial-gradient\(circle/.test(s.backgroundImage || "")) {
            others.push(
              el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0] + pseudo,
            );
          }
        }
      }
      const extraWaves = [...document.querySelectorAll("canvas.wave")].filter(
        (c) => !c.closest(".hero"),
      ).length;
      return {
        bodyBg,
        wavePresent: !!wave,
        isFirst: wave ? wave === hero.firstElementChild : false,
        attrs: wave
          ? {
              speed: wave.dataset.speed,
              alpha: wave.dataset.alpha,
              size: wave.dataset.size,
              cols: wave.dataset.cols,
              rows: wave.dataset.rows,
            }
          : null,
        mask: ws ? ws.maskImage : null,
        color: ws ? ws.color : null,
        opacity: ws ? ws.opacity : null,
        rect: wave
          ? ((r) => ({ w: Math.round(r.width), h: Math.round(r.height) }))(
              wave.getBoundingClientRect(),
            )
          : null,
        others,
        extraWaves,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    },
    { expected: EXPECTED_WAVE },
  );

  // Canvas pixel forensics: painted + animated (skipped pixel diff under reduced motion).
  const pixels = await page.evaluate(async () => {
    const cv = document.querySelector(".hero > canvas.wave");
    if (!cv) return null;
    const grab = () => {
      const c = document.createElement("canvas");
      c.width = cv.width;
      c.height = cv.height;
      const g = c.getContext("2d");
      g.drawImage(cv, 0, 0);
      const d = g.getImageData(0, 0, c.width, Math.min(c.height, 400)).data;
      let non = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) non++;
      return non;
    };
    const a = grab();
    await new Promise((r) => setTimeout(r, 900));
    const b = grab();
    return { a, b, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches };
  });

  const bgOk = audit.bodyBg === "rgb(236, 236, 236)";
  const attrsOk =
    audit.wavePresent &&
    audit.isFirst &&
    audit.attrs.speed === EXPECTED_WAVE.speed &&
    audit.attrs.alpha === EXPECTED_WAVE.alpha &&
    audit.attrs.size === EXPECTED_WAVE.size &&
    audit.attrs.cols === EXPECTED_WAVE.cols &&
    audit.attrs.rows === EXPECTED_WAVE.rows;
  const maskOk =
    audit.mask && audit.mask.includes(EXPECTED_MASK_X) && audit.mask.includes(EXPECTED_MASK_Y);
  const paintOk = pixels && pixels.a > 0;
  // v0.7.0 motion policy: the wave animates for EVERYONE — no reduced-motion
  // still frame anymore (upstream branch patched out; see docs/MOTION.md).
  const animOk = pixels && pixels.a !== pixels.b;
  check(`D1 ${w}px canvas #ECECEC`, bgOk, audit.bodyBg);
  check(
    `D2 ${w}px hero canvas.wave present+first, exact attrs`,
    attrsOk,
    JSON.stringify(audit.attrs),
  );
  check(
    `D2 ${w}px wave mask = reference dual-gradient intersect`,
    maskOk,
    audit.mask?.slice(0, 110) || "none",
  );
  check(
    `D2 ${w}px wave painted (nonzero pixels)`,
    !!paintOk,
    pixels ? `${pixels.a}px` : "no canvas",
  );
  check(
    `D2 ${w}px wave animating (always, per v0.7.0 motion policy)`,
    !!animOk,
    pixels ? `a=${pixels.a} b=${pixels.b}` : "",
  );
  check(
    `D2 ${w}px wave color #000 + full-bleed rect`,
    audit.color === "rgb(0, 0, 0)" && audit.rect.w === w,
    `${audit.color} ${JSON.stringify(audit.rect)}`,
  );
  const wantOpacity = w <= 900 ? "0.45" : "1"; // reference damps the wave on phones
  check(`D2 ${w}px wave opacity ${wantOpacity}`, audit.opacity === wantOpacity, audit.opacity);
  check(
    `D3 ${w}px hero is the only dotted surface`,
    audit.others.length === 0 && audit.extraWaves === 0,
    (audit.others.join(",") || "clean") + ` | extra-waves=${audit.extraWaves}`,
  );
  check(`D4 ${w}px no horizontal overflow`, audit.overflow <= 0, `delta=${audit.overflow}px`);

  // ── Dark scheme pass: exact reference dark palette (live-verified 2026-10-22).
  await page.emulateMedia({ colorScheme: "dark" });
  // Color transitions (e.g. .nav-link 200ms) must settle before measuring,
  // otherwise computed colors are read mid-flight at their light values.
  await page.waitForTimeout(350);
  const dark = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const wave = document.querySelector(".hero > canvas.wave");
    const muted = document.querySelector(".microlabel");
    const body = document.querySelector("main p, .prose p") ?? document.querySelector("p");
    return {
      bodyBg: html.backgroundColor,
      bodyColor: getComputedStyle(document.body).color,
      waveColor: wave ? getComputedStyle(wave).color : null,
      mutedColor: muted ? getComputedStyle(muted).color : null,
      paraColor: body ? getComputedStyle(body).color : null,
    };
  });
  check(
    `D1 ${w}px dark canvas #1E1E1E (reference dark bg)`,
    dark.bodyBg === "rgb(30, 30, 30)",
    dark.bodyBg,
  );
  check(
    `D1 ${w}px dark body text #FFFFFF (ref --text)`,
    dark.bodyColor === "rgb(255, 255, 255)",
    dark.bodyColor,
  );
  check(
    `D2 ${w}px dark wave dots #FFF (ref color: var(--text))`,
    dark.waveColor === "rgb(255, 255, 255)",
    dark.waveColor,
  );
  const darkSurf = parseRGB(dark.bodyBg);
  const darkMutedR = dark.mutedColor ? ratio(parseRGB(dark.mutedColor), darkSurf) : 0;
  const darkParaR = dark.paraColor ? ratio(parseRGB(dark.paraColor), darkSurf) : 0;
  check(`A1 ${w}px dark muted >= 4.5:1 (AA)`, darkMutedR >= 4.5, `${darkMutedR.toFixed(2)}:1`);
  check(`A1 ${w}px dark body text >= 4.5:1 (AA)`, darkParaR >= 4.5, `${darkParaR.toFixed(2)}:1`);
  await page.emulateMedia({ colorScheme: "light" });
  await page.close();
}

// Content + a11y on one desktop page
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SITE, { waitUntil: "networkidle" });
  const c = await page.evaluate(() => {
    const text = document.body.innerText;
    const resume = document.querySelector('a[href="/resume.pdf"]');
    const linkedin = document.querySelector(
      'a[href="https://www.linkedin.com/in/pujan-banik-arnab"]',
    );
    const email = document.querySelector('a[href="mailto:banikarnab.ipe@gmail.com"]');
    const phone = document.querySelector('a[href="tel:+8801792514506"]');
    const h1 = getComputedStyle(document.querySelector("h1"));
    const muted = document.querySelector(".microlabel");
    const body = document.querySelector("main p, .prose p") ?? document.querySelector("p");
    return {
      ssc: text.includes("Sylhet Govt. Pilot High School"),
      l18: text.includes("L18 Taguchi") && text.includes("ANOVA"),
      qfd: text.includes("QFD House of Quality") && text.includes("SolidWorks"),
      addr: text.includes("Jigatola, Dhanmondi"),
      resume: !!resume,
      linkedin: !!linkedin,
      email: !!email,
      phone: !!phone,
      resumeDownload: resume?.hasAttribute("download") ?? false,
      h1Color: h1.color,
      mutedColor: muted ? getComputedStyle(muted).color : null,
      bodyColor: body ? getComputedStyle(body).color : null,
      surface: getComputedStyle(document.documentElement).backgroundColor,
    };
  });
  check("C1 thesis enriched (L18 Taguchi + ANOVA)", c.l18);
  check("C1 crusher enriched (QFD + SolidWorks)", c.qfd);
  check("C1 SSC education entry present", c.ssc);
  check("C1 full address in footer note", c.addr);
  check("C1 social: email + LinkedIn + phone links", c.email && c.linkedin && c.phone);
  check("C1 résumé download action", c.resume && c.resumeDownload);

  // D5: verified reference dot-matrix illustrations reused in About states.
  // (lazy images: scroll the triptych into view and wait before asserting)
  await page.evaluate(() => document.querySelector(".states")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(700);
  const decay = await page.evaluate(() =>
    [...document.querySelectorAll(".states img.state-img")].map((i) => {
      const r = i.getBoundingClientRect();
      return {
        src: new URL(i.currentSrc, location.href).pathname,
        // SVGs with only a viewBox report the browser-default 300x150 intrinsic
        // size in Chromium; layout is governed by the width/height attributes.
        loaded:
          i.complete &&
          i.naturalWidth > 0 &&
          Math.round(r.width) === 320 &&
          Math.round(r.height) === 160,
      };
    }),
  );
  check(
    "D5 About states reuse verified decay SVGs (320x160, loaded)",
    decay.length === 3 &&
      decay.every((d) => d.loaded && /^\/assets\/decay-[123]\.svg$/.test(d.src)),
    JSON.stringify(decay),
  );

  const surface = parseRGB(c.surface);
  const rH1 = ratio(parseRGB(c.h1Color), surface);
  const rMuted = c.mutedColor ? ratio(parseRGB(c.mutedColor), surface) : 0;
  // Contract: EVERY paragraph on the page >= 4.5:1 (WCAG AA, normal text)
  // measured against its EFFECTIVE background (nearest opaque ancestor);
  // paragraphs set in the primary ink (--md-sys-color-on-surface) >= 7:1 (AAA).
  const paras = await page.evaluate(() => {
    const effBg = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && !bg.startsWith("rgba(0, 0, 0, 0") && bg !== "transparent") return bg;
        node = node.parentElement;
      }
      return getComputedStyle(document.documentElement).backgroundColor;
    };
    return [...document.querySelectorAll("p")].map((p) => ({
      col: getComputedStyle(p).color,
      bgCol: effBg(p),
    }));
  });
  const onSurfaceInk = "rgb(19, 19, 19)";
  const ratios = paras.map((p) => ratio(parseRGB(p.col), parseRGB(p.bgCol)));
  const minAA = Math.min(...ratios);
  const inkRatios = paras
    .filter((p) => p.col === onSurfaceInk)
    .map((p) => ratio(parseRGB(p.col), parseRGB(p.bgCol)));
  const minInk = inkRatios.length ? Math.min(...inkRatios) : null;
  check(
    "A1 every paragraph >= 4.5:1 (AA)",
    minAA >= 4.5,
    `min ${minAA.toFixed(2)}:1 across ${ratios.length} paragraphs`,
  );
  check(
    "A1 on-surface ink paragraphs >= 7:1 (AAA)",
    minInk === null || minInk >= 7,
    minInk === null ? "no on-surface paragraphs found" : `min ${minInk.toFixed(2)}:1`,
  );
  check("A1 muted labels >= 4.5:1 (AA)", rMuted >= 4.5, `${rMuted.toFixed(2)}:1`);

  // ── Dark full-page contrast pass (same logic, dark scheme).
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(350);
  const dc = await page.evaluate(() => {
    const effBg = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && !bg.startsWith("rgba(0, 0, 0, 0") && bg !== "transparent") return bg;
        node = node.parentElement;
      }
      return getComputedStyle(document.documentElement).backgroundColor;
    };
    const muted = document.querySelector(".microlabel");
    return {
      surface: getComputedStyle(document.documentElement).backgroundColor,
      mutedColor: muted ? getComputedStyle(muted).color : null,
      paras: [...document.querySelectorAll("p")].map((p) => ({
        col: getComputedStyle(p).color,
        bgCol: effBg(p),
      })),
    };
  });
  const darkInk = "rgb(255, 255, 255)";
  const dRatios = dc.paras.map((p) => ratio(parseRGB(p.col), parseRGB(p.bgCol)));
  const dMinAA = Math.min(...dRatios);
  const dInkRatios = dc.paras
    .filter((p) => p.col === darkInk)
    .map((p) => ratio(parseRGB(p.col), parseRGB(p.bgCol)));
  const dMinInk = dInkRatios.length ? Math.min(...dInkRatios) : null;
  const dSurf = parseRGB(dc.surface);
  const dMutedR = dc.mutedColor ? ratio(parseRGB(dc.mutedColor), dSurf) : 0;
  check(
    "A1 dark: every paragraph >= 4.5:1 (AA)",
    dMinAA >= 4.5,
    `min ${dMinAA.toFixed(2)}:1 across ${dRatios.length} paragraphs`,
  );
  check(
    "A1 dark: on-surface #FFF paragraphs >= 7:1 (AAA)",
    dMinInk === null || dMinInk >= 7,
    dMinInk === null ? "no on-surface paragraphs found" : `min ${dMinInk.toFixed(2)}:1`,
  );
  check("A1 dark: muted labels >= 4.5:1 (AA)", dMutedR >= 4.5, `${dMutedR.toFixed(2)}:1`);
  await page.emulateMedia({ colorScheme: "light" });
  await page.close();
}

await ctx.close();
await browser.close();
await closeServer();
reporter.finish();
