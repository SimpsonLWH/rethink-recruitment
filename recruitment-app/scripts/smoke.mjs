#!/usr/bin/env node
/**
 * Keyless browser smoke test. Runs against a freshly seeded demo.
 *
 *   npm run seed
 *   npm run dev
 *   npm run smoke
 *
 * It mutates demo state (decisions, a match, a message, a generated tailoring
 * draft, one extracted fact). Reseed afterwards for a clean demo.
 */
import { chromium } from "playwright-core";

const base = process.env.RIVET_BASE_URL || "http://localhost:3000";
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const errors = [];

function assert(condition, message) {
  if (!condition) throw new Error("ASSERT: " + message);
}

async function open(browser, cookies) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  if (cookies.length) await context.addCookies(cookies);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push("pageerror " + page.url() + ": " + error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push("console " + page.url() + ": " + message.text());
  });
  return { context, page };
}

async function goto(page, route) {
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90_000 });
  // Next dev compiles on first visit and hydration is not part of DOMContentLoaded.
  await page.waitForTimeout(900);
}

async function main() {
  const probe = await fetch(base + "/api/ai/status").catch(() => null);
  if (!probe || !probe.ok) throw new Error("Rivet is not reachable at " + base + ". Run npm run dev.");
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });

  try {
    console.log("Candidate flow");
    const candidate = await open(browser, [
      { name: "rivet_persona", value: "candidate:cand-aino-vikstrom", url: base },
    ]);
    const page = candidate.page;
    await goto(page, "/discover");
    assert(await page.locator('[data-testid="card-stack"]').count(), "card stack is missing");
    const firstTitle = await page.locator('[data-testid="card-stack"] h2').first().innerText();
    await page.locator('[data-testid="discover-pass"]').click();
    await page.getByText("Passed. No penalty, no ranking.").waitFor({ timeout: 10_000 });
    await page.waitForTimeout(500);
    const secondTitle = await page.locator('[data-testid="card-stack"] h2').first().innerText();
    assert(firstTitle !== secondTitle, "pass did not advance the deck");

    await page.locator('[data-testid="discover-rose"]').click();
    await page.locator('[data-testid="rose-reason"]').fill("Your note on making the day legible is why I stopped scrolling.");
    await page.locator('[data-testid="rose-send"]').click();
    await page.getByText(/Rose sent|It's a match/).first().waitFor({ timeout: 10_000 });
    console.log("  pass, rose, and budget interaction passed");

    await goto(page, "/profile");
    const fact = page.locator('[data-testid="fact-card"]').first();
    await fact.getByText(/^(Link works|Link unreachable)$/).first().waitFor({ timeout: 30_000 });
    const status = await fact.getByText(/^(Link works|Link unreachable)$/).first().innerText();
    assert(status === "Link works" || status === "Link unreachable", "unexpected link status label");
    console.log("  evidence status label:", status);
    await page.locator('[data-testid="highlight-extract"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="highlight-extract"]').click();
    await page.locator('[data-testid="highlight-result"]').first().waitFor({ timeout: 15_000 });
    await page.getByRole("button", { name: "Add to record" }).first().click();
    await page.getByText("Added to your record as Self-claimed.").waitFor({ timeout: 10_000 });
    console.log("  grounded highlight extraction + add passed");

    await goto(page, "/roses");
    await page.locator('[data-testid="rose-match-back"]').first().click();
    await page.waitForURL(/\/matches\/[^/]+$/, { timeout: 20_000 });
    await page.getByText("Mutual match").waitFor();
    await page.locator('[data-testid="message-input"]').fill("Glad we matched. Your accessible forms note is the reason I opened this.");
    await page.locator('[data-testid="message-send"]').click();
    await page.getByText("Glad we matched.", { exact: false }).last().waitFor({ timeout: 10_000 });
    console.log("  rose inbox match-back + message passed");

    await goto(page, "/tailor");
    const start = page.locator('[data-testid="start-tailoring"]').first();
    if (await start.count()) {
      await start.click();
      await page.waitForURL(/\/tailor\/[^/]+$/, { timeout: 90_000 });
    } else {
      const cont = page.locator('a[href^="/tailor/"]').first();
      assert(await cont.count(), "no tailoring start or continue control");
      await cont.click();
      await page.waitForTimeout(800);
    }
    if (/\/tailor\/[^/]+$/.test(new URL(page.url()).pathname)) {
      await page.locator('[data-testid="tailoring-suggestion"]').first().waitFor({ timeout: 20_000 });
      const suggestions = await page.locator('[data-testid="tailoring-suggestion"]').count();
      assert(suggestions > 0, "no tailoring suggestions");
      await page.locator('[data-testid="tailoring-approve-item"]').first().click();
      await page.waitForTimeout(350);
      await page.locator('[data-testid="tailoring-approve-all"]').click();
      await page.waitForURL(/\/preview$/, { timeout: 20_000 });
      await page.getByText("What they see.").waitFor();
      assert(await page.locator('[data-testid="preview-line"]').count(), "approved preview has no lines");
      console.log("  tailoring review, human approval, and employer preview passed");
    } else {
      console.log("  existing approved tailoring opened; preview steps were already covered");
    }
    await candidate.context.close();

    console.log("Employer flow");
    const employer = await open(browser, [
      { name: "rivet_persona", value: "employer:emp-northwind-labs", url: base },
      { name: "rivet_employer_role", value: "role-northwind-product-engineer", url: base },
    ]);
    const epage = employer.page;
    await goto(epage, "/discover");
    assert(await epage.locator('[data-testid="discover-yes"]').count(), "employer decision controls missing");
    await epage.locator('[data-testid="discover-yes"]').click();
    await epage.waitForTimeout(700);
    await goto(epage, "/roses");
    await epage.locator('[data-testid="rose-match-back"]').first().click();
    await epage.waitForURL(/\/matches\/[^/]+$/, { timeout: 20_000 });
    await epage.locator('[data-testid="message-input"]').fill("Thanks for the rose. The shift planner story is the exact problem we're working on.");
    await epage.locator('[data-testid="message-send"]').click();
    await epage.getByText("Thanks for the rose.", { exact: false }).last().waitFor({ timeout: 10_000 });
    await employer.context.close();

    console.log("Employer decision, rose match-back, and message passed");
  } finally {
    await browser.close();
  }

  if (errors.length) {
    console.log("\nConsole/page errors:");
    for (const error of [...new Set(errors)]) console.log("  - " + error);
    throw new Error(errors.length + " browser error(s) captured");
  }
  console.log("\nSmoke test passed. Reseed with: npm run seed");
}

main().catch((error) => {
  console.error("\n" + error.message);
  process.exitCode = 1;
});
