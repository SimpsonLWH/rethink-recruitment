#!/usr/bin/env node
/**
 * Rivet visual verification.
 *
 * Prereqs:
 *   1. npm run seed   (fresh demo state)
 *   2. npm run dev    (server on http://localhost:3000)
 *   3. npm run screenshots
 *
 * Uses the system Chrome through playwright-core. Override with CHROME_PATH and
 * RIVET_BASE_URL if needed. Screenshots land in ./screenshots and are part of
 * the deliverable.
 */
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.RIVET_BASE_URL || "http://localhost:3000";
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = path.resolve("screenshots");
const candidateCookie = { name: "rivet_persona", value: "candidate:cand-aino-vikstrom", url: base };
const employerCookies = [
  { name: "rivet_persona", value: "employer:emp-northwind-labs", url: base },
  { name: "rivet_employer_role", value: "role-northwind-product-engineer", url: base },
];

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
  await page.waitForTimeout(450);
}

async function shot(page, name, fullPage = false) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outDir, name), fullPage });
  console.log("  saved " + name);
}

async function waitForToasts(page) {
  await page
    .locator("[data-sonner-toast]")
    .first()
    .waitFor({ state: "detached", timeout: 8_000 })
    .catch(() => {});
  await page.waitForTimeout(300);
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
    console.log("Landing and entry");
    const publicDesktop = await open(browser);
    await go(publicDesktop.page, "/");
    await shot(publicDesktop.page, "landing-desktop.png");
    await go(publicDesktop.page, "/enter?side=candidate");
    await shot(publicDesktop.page, "enter-candidate.png");
    await go(publicDesktop.page, "/about-ai");
    await shot(publicDesktop.page, "about-ai.png");
    await publicDesktop.context.close();

    console.log("Candidate flow");
    const cand = await open(browser, { cookies: [candidateCookie] });
    await go(cand.page, "/discover");
    await shot(cand.page, "discover-candidate.png");
    await go(cand.page, "/profile");
    await cand.page
      .locator('[data-testid="fact-card"]')
      .first()
      .getByText(/^(Link works|Link unreachable)$/)
      .first()
      .waitFor({ timeout: 30_000 })
      .catch(() => console.warn("  warning: no link-status badge yet (link check may be offline)"));
    await shot(cand.page, "profile-candidate.png");
    await go(cand.page, "/matches");
    await shot(cand.page, "matches-candidate.png");
    const firstMatch = cand.page.locator('a[href^="/matches/"]').first();
    if (await firstMatch.count()) {
      const href = await firstMatch.getAttribute("href");
      await go(cand.page, href);
      await shot(cand.page, "match-thread.png");
    }
    await go(cand.page, "/roses");
    await shot(cand.page, "rose-inbox.png");
    await go(cand.page, "/tailor");
    await shot(cand.page, "tailor-index.png");
    const start = cand.page.locator('[data-testid="start-tailoring"]').first();
    const hasStart = await start.count();
    if (hasStart) {
      await start.click();
      await cand.page.waitForURL(/\/tailor\/[^/]+$/, { timeout: 90_000 });
      await waitForToasts(cand.page);
      await cand.page.waitForTimeout(500);
    } else {
      const continueLink = cand.page.locator('a[href^="/tailor/"]').first();
      if (await continueLink.count()) await continueLink.click();
      await cand.page.waitForTimeout(500);
    }
    if (!/\/tailor\/[^/]+$/.test(new URL(cand.page.url()).pathname)) {
      console.warn("  warning: tailoring review did not open at the expected route: " + cand.page.url());
    } else {
      await cand.page.locator('[data-testid="tailoring-suggestion"]').first().waitFor({ timeout: 20_000 });
      await shot(cand.page, "tailor-review.png");
      const approveButtons = cand.page.locator('[data-testid="tailoring-approve-item"]');
      const count = await approveButtons.count();
      for (let index = 0; index < Math.min(2, count); index += 1) {
        await approveButtons.nth(index).click();
        await cand.page.waitForTimeout(350);
      }
      const approveAll = cand.page.locator('[data-testid="tailoring-approve-all"]');
      if (await approveAll.count()) {
        await approveAll.click();
        await cand.page.waitForURL(/\/preview$/, { timeout: 30_000 });
        await waitForToasts(cand.page);
        await cand.page.waitForTimeout(500);
        await shot(cand.page, "tailor-preview.png");
      }
    }
    await cand.page.setViewportSize({ width: 390, height: 844 });
    await go(cand.page, "/discover");
    await shot(cand.page, "discover-candidate-mobile.png");
    await cand.context.close();

    console.log("Employer flow");
    const emp = await open(browser, { cookies: employerCookies });
    await go(emp.page, "/discover");
    await shot(emp.page, "discover-employer.png");
    await go(emp.page, "/candidates/cand-aino-vikstrom");
    await shot(emp.page, "candidate-profile-employer.png");
    const askInput = emp.page.locator('[data-testid="ask-profile-input"]');
    if (await askInput.count()) {
      await askInput.fill("What does this person want in a team?");
      await emp.page.locator('[data-testid="ask-profile-send"]').click();
      await emp.page.locator('[data-testid="ask-profile-answer"]').waitFor({ timeout: 20_000 }).catch(() => {});
      await shot(emp.page, "candidate-ask.png");
    }
    await emp.context.close();

    console.log("Mobile entry");
    const mobile = await open(browser, { mobile: true });
    await go(mobile.page, "/");
    await shot(mobile.page, "landing-mobile.png");
    await go(mobile.page, "/enter?side=candidate");
    await shot(mobile.page, "enter-mobile.png");
    await mobile.context.close();
  } finally {
    await browser.close();
  }

  console.log("\nScreenshots written to " + outDir);
  if (failedRequests.length) {
    console.log("\nFailed requests (non-static):");
    for (const item of [...new Set(failedRequests)]) console.log("  - " + item);
  }
  if (consoleErrors.length) {
    console.log("\nConsole/page errors:");
    for (const item of [...new Set(consoleErrors)]) console.log("  - " + item);
    process.exitCode = 1;
  } else {
    console.log("\nNo console/page errors captured.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
