#!/usr/bin/env node
/**
 * Rivet visual verification (second pass).
 *
 * Prereqs:
 *   1. npm run seed   (fresh demo state)
 *   2. npm run dev    (server on http://localhost:3000)
 *   3. npm run screenshots
 *
 * Uses the system Chrome through playwright-core. Override with CHROME_PATH and
 * RIVET_BASE_URL if needed. Screenshots land in ./screenshots and are part of
 * the deliverable. The script mutates state; reseed afterwards.
 */
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.RIVET_BASE_URL || "http://localhost:3000";
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = path.resolve("screenshots");
const employerCookies = [
  { name: "rivet_persona", value: "employer:emp-northwind-labs", url: base },
  { name: "rivet_employer_role", value: "role-northwind-product-engineer", url: base },
];
const candidateCookie = [{ name: "rivet_persona", value: "candidate:cand-aino-vikstrom", url: base }];

const consoleErrors = [];
const failedRequests = [];

async function open(browser, { mobile = false, cookies = [] } = {}) {
  const viewport = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  if (cookies.length) await context.addCookies(cookies);
  const page = await context.newPage();
  page.on("pageerror", (error) => consoleErrors.push("pageerror " + page.url() + ": " + error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push("console " + page.url() + ": " + message.text());
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (/favicon|_next\/static|hot-update|\.map|__nextjs/.test(url)) return;
    failedRequests.push(url + " — " + (request.failure()?.errorText ?? "failed"));
  });
  return { context, page };
}

async function go(page, route) {
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

async function shot(page, name, fullPage = false) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outDir, name), fullPage });
  console.log("  saved " + name);
}

async function waitForFeedParse(page) {
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="feed-criterion"]').length >= 3, null, {
    timeout: 15_000,
  });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="feed-parse"]')?.textContent?.includes("Parse") === true,
    null,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(250);
}

async function loadFeed(page, text) {
  await page.locator('[data-testid="feed-input"]').fill(text);
  await page.locator('[data-testid="feed-parse"]').click();
  await waitForFeedParse(page);
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  try {
    const probe = await fetch(base + "/api/ai/status");
    if (!probe.ok) throw new Error("status " + probe.status);
  } catch {
    throw new Error("Rivet is not reachable at " + base + ". Start it with: npm run dev");
  }
  if (!(await fs.stat(chromePath).catch(() => null))) {
    throw new Error("Chrome not found at " + chromePath + ". Set CHROME_PATH.");
  }

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  try {
    console.log("Desktop · employer review");
    const employer = await open(browser, { cookies: employerCookies });
    const ep = employer.page;
    await go(ep, "/discover");
    await ep.locator('[data-testid="review-card"]').waitFor({ timeout: 30_000 });
    const actionBox = await ep.locator('[data-testid="review-actions"]').boundingBox();
    if (actionBox && actionBox.y + actionBox.height > 900) {
      console.warn("  WARN: review actions extend past the 900px first view at " + (actionBox.y + actionBox.height));
    }
    await shot(ep, "review-portfolio-desktop.png");

    await ep.locator('[data-testid="review-module-project"]').click();
    await ep.locator('[data-testid="review-evidence-sheet"]').waitFor({ timeout: 5_000 });
    await shot(ep, "review-evidence-desktop.png");
    await ep.keyboard.press("Escape");
    await ep.waitForTimeout(300);

    await loadFeed(ep, "React, at least 2 years, finance background");
    await shot(ep, "feed-parsed-desktop.png", true);
    await ep.locator('[data-testid="feed-apply"]').click();
    await ep.locator('[data-testid="feed-summary"]').waitFor({ timeout: 5_000 });
    await shot(ep, "feed-applied-desktop.png", true);
    await ep.locator('[data-testid="review-why"]').click();
    await ep.locator('[data-testid="feed-why-sheet"]').waitFor({ timeout: 5_000 });
    await shot(ep, "feed-why-desktop.png");
    await ep.keyboard.press("Escape");
    await ep.waitForTimeout(250);
    await ep.locator('[data-testid="feed-reset"]').click();
    await ep.waitForTimeout(350);

    console.log("Mobile · employer review");
    const mobileEmployer = await open(browser, { mobile: true, cookies: employerCookies });
    const mp = mobileEmployer.page;
    await go(mp, "/discover");
    await shot(mp, "review-mobile.png");
    await loadFeed(mp, "React, at least 2 years, finance background");
    await mp.locator('[data-testid="feed-apply"]').click();
    await mp.locator('[data-testid="feed-summary"]').waitFor({ timeout: 5_000 });
    await mp.locator('[data-testid="feed-panel"]').scrollIntoViewIfNeeded();
    await mp.waitForTimeout(350);
    await shot(mp, "feed-mobile.png");
    await mobileEmployer.context.close();

    await ep.locator('[data-testid="discover-pass"]').click();
    await ep.waitForTimeout(600);
    await ep.locator('[data-testid="review-card"]').waitFor({ timeout: 10_000 });
    await ep.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 8_000 }).catch(() => {});
    await ep.waitForTimeout(250);
    await shot(ep, "review-nonportfolio-desktop.png");
    await ep.locator('[data-testid="discover-priority-intro"]').click();
    await ep.locator('[data-testid="priority-intro-send"]').waitFor({ timeout: 5_000 });
    await shot(ep, "priority-intro-dialog.png");
    await ep.keyboard.press("Escape");
    await ep.waitForTimeout(250);

    await go(ep, "/priority-intros");
    await shot(ep, "priority-intro-inbox.png");

    await go(ep, "/how-it-works");
    await shot(ep, "how-it-works.png", true);
    await ep.evaluate(() => document.getElementById("ai")?.scrollIntoView({ block: "start" }));
    await ep.waitForTimeout(350);
    await shot(ep, "ai-audit.png");

    await go(ep, "/matches");
    await shot(ep, "matches-employer.png");
    await ep.locator('a[href^="/matches/"]').first().click();
    await ep.waitForTimeout(600);
    await shot(ep, "match-thread.png");

    await go(ep, "/candidates/cand-aino-vikstrom");
    await shot(ep, "candidate-profile-employer.png");
    await ep.locator('[data-testid="ask-profile-input"]').fill("What does Aino want in a team?");
    await ep.locator('[data-testid="ask-profile-send"]').click();
    await ep.locator('[data-testid="ask-profile-answer"]').waitFor({ timeout: 20_000 });
    await ep.locator('[data-testid="ask-profile-answer"]').scrollIntoViewIfNeeded();
    await ep.waitForTimeout(300);
    await shot(ep, "candidate-ask.png");

    await go(ep, "/enter?side=employer");
    await shot(ep, "enter-employer.png");
    await go(ep, "/enter?side=candidate");
    await shot(ep, "enter-candidate.png");
    await go(ep, "/");
    await shot(ep, "landing-desktop.png");
    await employer.context.close();

    console.log("Desktop · candidate record and tailoring");
    const candidate = await open(browser, { cookies: candidateCookie });
    const cp = candidate.page;
    await go(cp, "/discover");
    await shot(cp, "discover-candidate.png");
    await go(cp, "/matches");
    await shot(cp, "matches-candidate.png");
    await go(cp, "/profile");
    await shot(cp, "profile-candidate.png");
    await go(cp, "/tailor");
    await shot(cp, "tailor-index.png");
    const start = cp.locator('[data-testid="start-tailoring"]').first();
    if (await start.count()) {
      await start.click();
      await cp.waitForURL(/\/tailor\/[^/]+$/, { timeout: 90_000 });
    } else {
      await cp.locator('a[href^="/tailor/"]').first().click();
      await cp.waitForTimeout(900);
    }
    await cp.locator('[data-testid="tailoring-suggestion"]').first().waitFor({ timeout: 20_000 });
    await cp.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 8_000 }).catch(() => {});
    await cp.waitForTimeout(250);
    await shot(cp, "tailor-review.png");
    const patchResponse = cp.waitForResponse(
      (response) => response.url().includes("/api/ai/tailor/items/") && response.request().method() === "PATCH",
      { timeout: 15_000 },
    );
    await cp.locator('[data-testid="tailoring-approve-item"]').first().click();
    await patchResponse;
    await cp.waitForFunction(
      () => document.querySelector('[data-testid="tailoring-approve-all"]')?.hasAttribute("disabled") === false,
      null,
      { timeout: 10_000 },
    );
    await cp.waitForTimeout(300);
    await cp.locator('[data-testid="tailoring-approve-all"]').click();
    await cp.waitForURL(/\/preview$/, { timeout: 20_000 });
    await cp.getByText("What they see.").waitFor();
    await cp.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 8_000 }).catch(() => {});
    await cp.waitForTimeout(250);
    await shot(cp, "tailor-preview.png");
    await candidate.context.close();

    console.log("Mobile · candidate and public");
    const mobileCandidate = await open(browser, { mobile: true, cookies: candidateCookie });
    const mcp = mobileCandidate.page;
    await go(mcp, "/discover");
    await shot(mcp, "discover-candidate-mobile.png");
    await go(mcp, "/profile");
    await shot(mcp, "profile-candidate-mobile.png");
    await mobileCandidate.context.close();

    const mobilePublic = await open(browser, { mobile: true });
    const publicPage = mobilePublic.page;
    await go(publicPage, "/");
    await shot(publicPage, "landing-mobile.png");
    await go(publicPage, "/enter");
    await shot(publicPage, "enter-mobile.png");
    await mobilePublic.context.close();
  } finally {
    await browser.close();
  }

  if (consoleErrors.length || failedRequests.length) {
    console.log("\nBrowser problems:");
    for (const error of [...new Set(consoleErrors)]) console.log("  error: " + error);
    for (const failure of [...new Set(failedRequests)]) console.log("  request: " + failure);
    throw new Error(consoleErrors.length + failedRequests.length + " browser problem(s) captured");
  }
  console.log("\nScreenshots captured. Inspect every image, then reseed with: npm run seed");
}

main().catch((error) => {
  console.error("\n" + error.message);
  process.exitCode = 1;
});