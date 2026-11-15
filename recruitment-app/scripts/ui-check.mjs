#!/usr/bin/env node
/**
 * Public-surface visual and interaction checks.
 *
 * Prereqs:
 *   1. npm run seed
 *   2. npm run dev
 *   3. RIVET_BASE_URL=http://localhost:3000 npm run check:ui
 *
 * Uses system Chrome through playwright-core. It does not mutate demo data.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const base = process.env.RIVET_BASE_URL || "http://localhost:3000";
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const failures = [];
const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push(name);
  } catch (error) {
    failures.push(name + ": " + (error instanceof Error ? error.message : String(error)));
  }
}

function attachErrors(page, errors) {
  page.on("pageerror", (error) => errors.push("pageerror: " + error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push("console: " + message.text());
  });
}

async function dimensions(locator) {
  const box = await locator.boundingBox();
  assert.ok(box, "element has no box");
  return box;
}

async function runLanding(browser, viewport, label) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  attachErrors(page, errors);
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);

  const layout = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const header = document.querySelector('[data-testid="landing-header-cta"]');
    const hiring = document.querySelector('[data-testid="landing-cta-hiring"]');
    const candidate = document.querySelector('[data-testid="landing-cta-candidate"]');
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const logoStrokes = [...document.querySelectorAll('a[aria-label="Rivet home"] svg circle')].map(
      (circle) => circle.getAttribute("stroke") || circle.getAttribute("fill"),
    );
    const brandGreen = [...document.querySelectorAll("*")]
      .map((element) => {
        const style = getComputedStyle(element);
        return style.backgroundColor + " " + style.color + " " + style.borderColor;
      })
      .filter((value) => /22, 131, 63|46, 200, 102/.test(value));
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      h1Height: h1 ? h1.getBoundingClientRect().height : 0,
      h1LineHeight: h1Style ? Number.parseFloat(h1Style.lineHeight) : 0,
      headerHeight: header ? header.getBoundingClientRect().height : 0,
      hiringHeight: hiring ? hiring.getBoundingClientRect().height : 0,
      candidateHeight: candidate ? candidate.getBoundingClientRect().height : 0,
      logoStrokes,
      brandGreen,
      html: document.documentElement.innerHTML,
    };
  });

  check(label + " no horizontal overflow", () => {
    assert.equal(layout.scrollWidth, layout.innerWidth);
  });
  check(label + " headline is at most two lines", () => {
    assert.ok(layout.h1LineHeight > 0, "missing line-height");
    assert.ok(layout.h1Height <= layout.h1LineHeight * 2.2, "headline wraps beyond two lines");
  });
  check(label + " header CTA at least 40px", () => {
    assert.ok(layout.headerHeight >= 40, "header CTA is " + layout.headerHeight + "px");
  });
  check(label + " hero CTAs are at least 48px and equal", () => {
    assert.ok(layout.hiringHeight >= 48, "hiring CTA is " + layout.hiringHeight + "px");
    assert.ok(layout.candidateHeight >= 48, "candidate CTA is " + layout.candidateHeight + "px");
    assert.equal(layout.hiringHeight, layout.candidateHeight);
  });
  check(label + " logo uses the warm maroon", () => {
    assert.ok(layout.logoStrokes.includes("#A64056"), "logo strokes: " + layout.logoStrokes.join(", "));
  });
  check(label + " no brand green", () => {
    assert.equal(layout.brandGreen.length, 0, layout.brandGreen.join(" | "));
    assert.ok(!/16833F|2EC866/i.test(layout.html), "old green hex is still in the markup");
  });

  await page.locator('[data-testid="landing-side-toggle-employer"]').click();
  await page.waitForTimeout(500);
  const employer = await page.evaluate(() => ({
    pressed: document.querySelector('[data-testid="landing-side-toggle-employer"]')?.getAttribute("aria-pressed"),
    side: document.querySelector('[data-testid="landing-side-panel"]')?.getAttribute("data-side"),
    text: document.querySelector('[data-testid="landing-side-panel"]')?.textContent || "",
  }));
  check(label + " side switcher changes panel", () => {
    assert.equal(employer.pressed, "true");
    assert.equal(employer.side, "employer");
    assert.match(employer.text, /Evidence record/i);
  });

  await page.locator('[data-testid="landing-question-1"]').click();
  await page.waitForTimeout(400);
  const question = await page.evaluate(() => {
    const button = document.querySelector('[data-testid="landing-question-1"]');
    const panel = document.querySelector('[data-testid="landing-question-panel-1"]');
    return {
      expanded: button?.getAttribute("aria-expanded"),
      height: panel?.getBoundingClientRect().height || 0,
    };
  });
  check(label + " question accordion opens", () => {
    assert.equal(question.expanded, "true");
    assert.ok(question.height > 20, "answer did not expand");
  });
  check(label + " no console or page errors", () => {
    assert.equal(errors.length, 0, errors.join("; "));
  });

  await context.close();
}

async function runReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  attachErrors(page, errors);
  await page.goto(base + "/", { waitUntil: "networkidle", timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => {
    const style = (selector) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element) : null;
    };
    return {
      h1Opacity: style("h1")?.opacity,
      eyebrowOpacity: style('[data-motion-reveal]')?.opacity,
      recordOpacity: style('#product [class*="max-w-[540px]"]')?.opacity,
    };
  });
  check("reduced motion keeps content visible", () => {
    assert.equal(state.h1Opacity, "1");
    assert.equal(state.eyebrowOpacity, "1");
    assert.equal(state.recordOpacity, "1");
  });
  check("reduced motion has no console or page errors", () => {
    assert.equal(errors.length, 0, errors.join("; "));
  });
  await context.close();
}

async function runPublicSpacing(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  attachErrors(page, errors);
  await page.goto(base + "/enter", { waitUntil: "networkidle", timeout: 90_000 });
  const links = await page.evaluate(() =>
    ["create-candidate", "evidence-link", "create-hiring", "matching-link"].map((id) => {
      const element = document.querySelector('[data-testid="' + id + '"]');
      return { id, height: element ? element.getBoundingClientRect().height : 0 };
    }),
  );
  check("/enter secondary links are 40px", () => {
    for (const link of links) assert.ok(link.height >= 40, link.id + " is " + link.height + "px");
  });
  await page.goto(base + "/how-it-works", { waitUntil: "networkidle", timeout: 90_000 });
  const signIn = await page.locator('[data-testid="how-it-works-signin"]').boundingBox();
  check("/how-it-works header CTA is 40px", () => {
    assert.ok(signIn, "missing sign-in CTA");
    assert.ok(signIn.height >= 40, "sign-in CTA is " + signIn.height + "px");
  });
  check("/enter and /how-it-works have no console or page errors", () => {
    assert.equal(errors.length, 0, errors.join("; "));
  });
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  try {
    await runLanding(browser, { width: 1440, height: 1000 }, "desktop");
    await runLanding(browser, { width: 390, height: 844 }, "mobile");
    await runLanding(browser, { width: 320, height: 760 }, "small");
    await runReducedMotion(browser);
    await runPublicSpacing(browser);
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error("\nUI check failed:");
    for (const failure of failures) console.error("  - " + failure);
    process.exit(1);
  }
  console.log("UI check passed: " + checks.length + " assertions");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
