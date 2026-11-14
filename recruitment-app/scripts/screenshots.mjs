#!/usr/bin/env node
/**
 * Rivet pivot visual verification.
 *
 * Prereqs:
 *   1. npm run seed
 *   2. npm run dev
 *   3. RIVET_BASE_URL=http://localhost:3000 npm run screenshots
 *
 * Uses system Chrome through playwright-core. The script mutates demo state by
 * taking one assessment; reseed afterwards for a clean demo.
 */
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.RIVET_BASE_URL || "http://localhost:3000";
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = path.resolve("screenshots");
const candidateCookie = [{ name: "rivet_persona", value: "candidate:cand-aino-vikstrom", url: base }];
const employerCookies = [
  { name: "rivet_persona", value: "employer:emp-northwind-labs", url: base },
  { name: "rivet_employer_role", value: "role-northwind-product-engineer", url: base },
];

const consoleErrors = [];
const failedRequests = [];

async function open(browser, { mobile = false, cookies = [] } = {}) {
  const viewport = mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
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
  await page.waitForTimeout(650);
}

async function shot(page, name, fullPage = false) {
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, name), fullPage });
  console.log("  saved " + name);
}

async function fillCode(page, problemId, code) {
  const editor = page.locator("[data-testid=assessment-code]");
  await editor.locator(".monaco-editor").waitFor({ timeout: 30_000 });
  await page.waitForFunction(
    (id) => Boolean(globalThis.monaco?.editor.getModels().some((model) => model.uri.path.endsWith("/" + id + ".js"))),
    problemId,
    { timeout: 30_000 },
  );
  await page.evaluate(
    ({ id, nextCode }) => {
      const model = globalThis.monaco.editor.getModels().find((entry) => entry.uri.path.endsWith("/" + id + ".js"));
      model.setValue(nextCode);
    },
    { id: problemId, nextCode: code },
  );
  await page.waitForTimeout(150);
}

async function takeAssessment(page) {
  await go(page, "/assessments/assess-algorithms-v1-medium");
  await page.locator("[data-testid=start-assessment]").click();
  await page.locator("[data-testid=oa-overlay]").waitFor({ timeout: 20_000 });
  await fillCode(
    page,
    "al1-m1",
    "function twoSum(numbers, target) {\n  const seen = new Map();\n  for (let i = 0; i < numbers.length; i += 1) {\n    const need = target - numbers[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(numbers[i], i);\n  }\n  return [];\n}",
  );
  await page.locator("[data-testid=run-examples]").click();
  await page.locator("[data-testid=example-check-result]").waitFor({ timeout: 20_000 });
  await page.locator("[data-testid=oa-overlay]").evaluate((element) => element.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await shot(page, "assessment-runner-desktop.png");
  await page.locator("[data-testid=problem-tab-1]").click();
  await fillCode(
    page,
    "al1-m2",
    "function longestUniqueRun(text) {\n  const last = new Map();\n  let start = 0;\n  let best = 0;\n  for (let i = 0; i < text.length; i += 1) {\n    const ch = text[i];\n    if (last.has(ch) && last.get(ch) >= start) start = last.get(ch) + 1;\n    last.set(ch, i);\n    best = Math.max(best, i - start + 1);\n  }\n  return best;\n}",
  );
  await page.locator("[data-testid=assessment-submit]").click();
  await page.locator("[data-testid=submit-confirm-dialog]").waitFor({ timeout: 10_000 });
  await page.locator("[data-testid=confirm-submit]").click();
  await page.locator("[data-testid=assessment-result]").waitFor({ timeout: 30_000 });
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
    console.log("Desktop · entry and account setup");
    const entry = await open(browser, {});
    await go(entry.page, "/enter");
    await shot(entry.page, "login-entry-desktop.png", true);
    await go(entry.page, "/signup?side=candidate");
    await shot(entry.page, "signup-candidate-desktop.png", true);
    const freshCandidate = await open(browser, {});
    const fp = freshCandidate.page;
    await go(fp, "/signup?side=candidate");
    await fp.locator("[data-testid=signup-name]").fill("Screenshot Candidate");
    await fp.locator("[data-testid=signup-email]").fill("screenshot-candidate-" + Date.now() + "@demo.rivet");
    await fp.locator("[data-testid=signup-password]").fill("secret123");
    await fp.locator("[data-testid=signup-submit]").click();
    await fp.waitForURL(/\/onboarding\/cv/, { timeout: 20_000 });
    await shot(fp, "candidate-cv-onboarding-desktop.png", true);
    await freshCandidate.context.close();
    await entry.context.close();

    console.log("Desktop · candidate");
    const candidate = await open(browser, { cookies: candidateCookie });
    const cp = candidate.page;
    await go(cp, "/dashboard");
    await shot(cp, "candidate-dashboard-desktop.png", true);
    await go(cp, "/assessments");
    await shot(cp, "assessments-catalogue-desktop.png");
    await go(cp, "/assessments/assess-algorithms-v1-medium");
    await shot(cp, "assessment-detail-desktop.png", true);
    await go(cp, "/profile/edit");
    await shot(cp, "candidate-profile-edit-desktop.png", true);
    await go(cp, "/invitations");
    await shot(cp, "candidate-invitations-desktop.png");
    await go(cp, "/updates");
    await shot(cp, "candidate-updates-desktop.png");
    await takeAssessment(cp);
    await shot(cp, "assessment-result-desktop.png");
    await go(cp, "/discover");
    await cp.locator("[data-testid=candidate-feed]").waitFor({ timeout: 30_000 });
    await shot(cp, "candidate-feed-desktop.png");
    await cp.locator("[data-testid=evidence-status]").first().hover();
    await cp.getByText("Required evidence").first().waitFor({ state: "visible", timeout: 10_000 });
    await shot(cp, "candidate-evidence-detail-desktop.png");
    await candidate.context.close();

    console.log("Desktop · employer");
    const employer = await open(browser, { cookies: employerCookies });
    const ep = employer.page;
    await go(ep, "/dashboard");
    await shot(ep, "recruiter-dashboard-desktop.png", true);
    await go(ep, "/onboarding/role");
    await shot(ep, "recruiter-onboarding-desktop.png", true);
    await go(ep, "/discover");
    await ep.locator("[data-testid=review-card]").waitFor({ timeout: 30_000 });
    const actionBox = await ep.locator("[data-testid=review-actions]").boundingBox();
    if (actionBox && actionBox.y + actionBox.height > 1000) {
      console.warn("  WARN: review actions extend past the 1000px first view at " + (actionBox.y + actionBox.height));
    }
    await shot(ep, "employer-feed-desktop.png");
    await go(ep, "/roles/new");
    await shot(ep, "employer-role-card-desktop.png");
    await go(ep, "/discovery");
    await shot(ep, "employer-discovery-desktop.png");
    await go(ep, "/matches");
    await ep.locator("a[href^='/matches/']").first().click();
    await ep.waitForURL(/\/matches\/[^/]+$/, { timeout: 20_000 });
    await shot(ep, "employer-match-stage-desktop.png");
    await employer.context.close();

    console.log("Mobile");
    const mobileCandidate = await open(browser, { mobile: true, cookies: candidateCookie });
    const mcp = mobileCandidate.page;
    await go(mcp, "/discover");
    await shot(mcp, "candidate-feed-mobile.png");
    await go(mcp, "/assessments");
    await shot(mcp, "assessments-catalogue-mobile.png");
    await mobileCandidate.context.close();

    const mobileEmployer = await open(browser, { mobile: true, cookies: employerCookies });
    const mep = mobileEmployer.page;
    await go(mep, "/discover");
    await shot(mep, "employer-feed-mobile.png");
    await mobileEmployer.context.close();
  } finally {
    await browser.close();
  }

  if (consoleErrors.length || failedRequests.length) {
    console.log("\nBrowser errors:");
    for (const error of [...new Set(consoleErrors)]) console.log("  - " + error);
    for (const request of [...new Set(failedRequests)]) console.log("  - request: " + request);
    throw new Error(consoleErrors.length + failedRequests.length + " browser issue(s) captured");
  }
  console.log("\nScreenshots saved. Reseed afterwards: npm run seed");
}

main().catch((error) => {
  console.error("\n" + error.message);
  process.exitCode = 1;
});
