#!/usr/bin/env node
/**
 * Keyless browser smoke test. Runs against a freshly seeded demo.
 *
 *   npm run seed
 *   npm run dev
 *   npm run smoke
 *
 * It mutates demo state (passes, priority intros, a match, a message, a
 * generated tailoring draft, one extracted fact, one employer Q&A run).
 * Reseed afterwards for a clean demo.
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

async function waitForCount(page, selector, count, timeout = 30_000) {
  await page.waitForFunction(
    ([sel, n]) => document.querySelectorAll(sel).length >= n,
    [selector, count],
    { timeout },
  );
}

async function waitForText(page, selector, text, timeout = 20_000) {
  await page.waitForFunction(
    ([sel, value]) => document.querySelector(sel)?.textContent?.includes(value) === true,
    [selector, text],
    { timeout },
  );
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

    assert(
      (await page.locator('[data-testid="discover-priority-intro"]').innerText()).includes("2 priority intros left"),
      "candidate priority-intro allowance label is missing",
    );
    await page.locator('[data-testid="discover-priority-intro"]').click();
    await page.locator('[data-testid="priority-intro-send"]').waitFor({ timeout: 5_000 });
    assert(await page.locator('[data-testid="priority-intro-send"]').isDisabled(), "priority intro sent without a reason");
    await page.locator('[data-testid="priority-intro-reason"]').fill("Your note on making the day legible is why I stopped scrolling.");
    assert(!(await page.locator('[data-testid="priority-intro-send"]').isDisabled()), "priority intro send did not enable after a reason");
    await page.locator('[data-testid="priority-intro-send"]').click();
    await page.getByText(/Priority intro sent|It's a match/).first().waitFor({ timeout: 10_000 });
    await page.waitForFunction(
      () => document.querySelector('[data-testid="discover-priority-intro"]')?.textContent?.includes("1 priority intro left") === true,
      null,
      { timeout: 10_000 },
    );
    console.log("  pass, required-reason priority intro, and allowance label passed");

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

    await goto(page, "/priority-intros");
    await page.locator('[data-testid="priority-intro-match-back"]').first().click();
    await page.waitForURL(/\/matches\/[^/]+$/, { timeout: 20_000 });
    await page.getByText("Mutual match").waitFor();
    await page.locator('[data-testid="message-input"]').fill("Glad we matched. Your accessible forms note is the reason I opened this.");
    await page.locator('[data-testid="message-send"]').click();
    await page.getByText("Glad we matched.", { exact: false }).last().waitFor({ timeout: 10_000 });
    console.log("  priority-intro inbox match-back + message passed");

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
      const source = await page.locator('[data-testid="tailoring-source-claim"]').first().innerText();
      const suggested = await page.locator('[data-testid="tailoring-suggestion-text"]').first().innerText();
      assert(source !== suggested, "tailoring fallback emitted a near-copy equal to the source");
      assert(!suggested.startsWith(source.slice(0, 24)), "tailoring fallback kept the same opening");
      assert(suggested.toLowerCase().includes("increased from") || !suggested.includes("went from"), "tailoring fallback did not visibly change the result wording");
      console.log("  tailoring fallback visibly changed a line; source trace preserved");
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
    await waitForCount(epage, '[data-testid="review-card"]', 1);
    const cardName = await epage.locator('[data-testid="review-card"] h2').innerText();
    assert(cardName.includes("Noor Salmi"), "expected the portfolio candidate Noor first");
    assert(await epage.locator('[data-testid="review-module-achievement"]').count(), "portfolio achievement module missing");
    assert(await epage.locator('[data-testid="review-module-project"]').count(), "portfolio project module missing");
    assert(await epage.locator('[data-testid="review-module-timeline"]').count(), "portfolio timeline missing");
    assert(await epage.locator('[data-testid="review-module-skills"]').count(), "portfolio skills module missing");
    assert((await epage.locator('[data-testid="review-card"] img').count()) > 0, "portfolio project image missing");
    assert((await epage.locator('a[href^="/candidates/"]').count()) === 0, "full profile is linked before interest");
    await epage.locator('[data-testid="review-module-project"]').click();
    await epage.locator('[data-testid="review-evidence-sheet"]').waitFor({ timeout: 5_000 });
    assert(await epage.locator('[data-testid="review-evidence-sheet"]').getByText("Self-claimed").count(), "evidence sheet has no provenance");
    await epage.keyboard.press("Escape");
    await epage.waitForTimeout(250);
    console.log("  rich portfolio card + evidence sheet passed");

    await epage.locator('[data-testid="feed-input"]').fill("React, at least 2 years, finance background");
    await epage.locator('[data-testid="feed-parse"]').click();
    await waitForCount(epage, '[data-testid="feed-criterion"]', 3, 15_000);
    await epage.waitForFunction(
      () => document.querySelector('[data-testid="feed-parse"]')?.textContent?.includes("Parse") === true,
      null,
      { timeout: 15_000 },
    );
    const criterionInputs = await epage.locator('[data-testid="feed-criterion"] input').evaluateAll((inputs) =>
      inputs.map((input) => input.value),
    );
    assert(criterionInputs.includes("React"), "parsed skill React missing");
    assert(criterionInputs.includes("finance"), "parsed domain finance missing");
    assert(criterionInputs.includes("2"), "parsed 2+ years missing");
    await epage.locator('[data-testid="feed-apply"]').click();
    await epage.locator('[data-testid="feed-summary"]').waitFor({ timeout: 5_000 });
    const summary = await epage.locator('[data-testid="feed-summary"]').innerText();
    assert(summary.includes("1") && summary.includes("in your feed"), "feed summary lacks in-feed count");
    assert(summary.includes("8") && summary.includes("not stated"), "feed summary lacks not-stated count");
    assert(summary.includes("1") && summary.includes("outside your criteria"), "feed summary lacks outside count");
    assert(await epage.locator('[data-testid="not-stated-section"]').count(), "not-stated section is missing");
    assert(await epage.locator('[data-testid="outside-criteria"]').count(), "outside-criteria section is missing");
    await epage.locator('[data-testid="review-why"]').click();
    await epage.locator('[data-testid="feed-why-sheet"]').waitFor({ timeout: 5_000 });
    const whyText = await epage.locator('[data-testid="feed-why-sheet"]').innerText();
    assert(whyText.includes("36") && whyText.includes("months"), "experience evidence explanation missing");
    await epage.keyboard.press("Escape");
    await epage.waitForTimeout(250);
    await epage.locator('[data-testid="feed-broaden"]').click();
    await waitForText(epage, '[data-testid="feed-summary"]', "Not-stated profiles are included in the deck.", 10_000);
    await epage.locator('[data-testid="feed-reset"]').click();
    await epage.waitForFunction(() => document.querySelectorAll('[data-testid="feed-summary"]').length === 0, null, { timeout: 5_000 });
    console.log("  feed parse, editable criteria, apply, why, broaden and reset passed");

    await epage.locator('[data-testid="discover-pass"]').click();
    await epage.waitForTimeout(600);
    const secondName = await epage.locator('[data-testid="review-card"] h2').innerText();
    assert(secondName.includes("Elias Nieminen"), "expected the non-portfolio candidate after Noor");
    assert(await epage.locator('[data-testid="review-module-responsibility"]').count(), "non-portfolio responsibility module missing");
    assert(await epage.locator('[data-testid="review-module-availability"]').count(), "non-portfolio availability module missing");
    assert((await epage.locator('[data-testid="review-card"] img').count()) === 0, "non-portfolio card forced placeholder imagery");
    console.log("  rich non-portfolio card passed");

    await epage.locator('[data-testid="discover-priority-intro"]').click();
    await epage.locator('[data-testid="priority-intro-send"]').waitFor({ timeout: 5_000 });
    assert(await epage.locator('[data-testid="priority-intro-send"]').isDisabled(), "employer priority intro sent without a reason");
    await epage.locator('[data-testid="priority-intro-reason"]').fill("Your stock-count rebuild is the kind of detail this role lives on.");
    await epage.locator('[data-testid="priority-intro-send"]').click();
    await epage.getByText(/Priority intro sent|It's a match/).first().waitFor({ timeout: 10_000 });
    await epage.waitForTimeout(500);
    await epage.getByText("Full profile and employer Q&A are unlocked.", { exact: false }).waitFor();
    assert((await epage.locator('a[href^="/candidates/"]').count()) > 0, "full profile did not unlock after interest");
    await epage.waitForFunction(
      () => document.querySelector('[data-testid="discover-priority-intro"]')?.textContent?.includes("0 priority intros left") === true,
      null,
      { timeout: 10_000 },
    );
    console.log("  employer priority intro with required reason and full-profile unlock passed");

    await goto(epage, "/priority-intros");
    await epage.locator('[data-testid="priority-intro-match-back"]').first().click();
    await epage.waitForURL(/\/matches\/[^/]+$/, { timeout: 20_000 });
    await epage.locator('[data-testid="message-input"]').fill("Thanks for the priority intro. The consent-first story is the exact problem we are working on.");
    await epage.locator('[data-testid="message-send"]').click();
    await epage.getByText("Thanks for the priority intro.", { exact: false }).last().waitFor({ timeout: 10_000 });
    console.log("  employer inbox match-back + message passed");

    await goto(epage, "/candidates/cand-aino-vikstrom");
    await epage.locator('[data-testid="ask-profile-input"]').fill("What does Aino want in a team?");
    await epage.locator('[data-testid="ask-profile-send"]').click();
    await epage.locator('[data-testid="ask-profile-answer"]').waitFor({ timeout: 20_000 });
    const answer = await epage.locator('[data-testid="ask-profile-answer"]').innerText();
    assert(answer.toLowerCase().includes("sources"), "employer Q&A did not show sources");
    assert(answer.toLowerCase().includes("team") || answer.toLowerCase().includes("argue"), "employer Q&A answer did not use the record");
    console.log("  employer Q&A with citations passed");
    await employer.context.close();
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
