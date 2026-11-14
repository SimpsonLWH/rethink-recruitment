#!/usr/bin/env node
/**
 * Keyless browser smoke test for the assessment-backed pivot.
 * Runs against a freshly seeded demo.
 *
 *   npm run seed
 *   npm run dev
 *   RIVET_BASE_URL=http://localhost:3000 npm run smoke
 *
 * It mutates demo state (one assessment, one Like, one invitation response,
 * one employer pass). Reseed afterwards for a clean demo.
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
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
  await page.waitForTimeout(700);
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

    await goto(page, "/assessments/assess-backend-design-v1-advanced");
    assert(await page.locator("[data-testid=assessment-detail]").count(), "assessment detail is missing");
    assert((await page.getByText(/next retake opens after|Retake after/i).count()) > 0, "cooldown state is not visible");
    assert(await page.locator("[data-testid=start-assessment]").isDisabled(), "cooldown did not disable the start button");
    console.log("  working assessment and cooldown passed");

    await goto(page, "/assessments/assess-algorithms-v1-medium");
    assert(!(await page.locator("[data-testid=start-assessment]").isDisabled()), "assessment start is unexpectedly disabled");
    await page.locator("[data-testid=start-assessment]").click();
    await page.waitForURL(/\/assessments\/attempts\//, { timeout: 20_000 });
    for (let index = 0; index < 4; index++) {
      await page.locator("[data-testid=assessment-option-a]").click();
      if (index < 3) await page.locator("[data-testid=assessment-next]").click();
    }
    assert(!(await page.locator("[data-testid=assessment-submit]").isDisabled()), "assessment submit stayed disabled");
    await page.locator("[data-testid=assessment-submit]").click();
    await page.locator("[data-testid=assessment-result]").waitFor({ timeout: 20_000 });
    const resultText = await page.locator("[data-testid=assessment-result]").innerText();
    assert(resultText.includes("/100"), "assessment result does not show a score");
    assert(resultText.includes("Algorithms"), "assessment result does not name the assessment family");
    console.log("  random-pool assessment, submit and result passed");

    await goto(page, "/profile/edit");
    assert(await page.locator("[data-testid=profile-editor]").count(), "profile editor is missing");
    assert((await page.getByText(/Let teams find me in discovery/i).count()) > 0, "discovery opt-in control is missing");
    assert((await page.getByText(/No CV, no upload/i).count()) > 0, "profile editor still implies a CV");
    console.log("  structured profile and discovery opt-in passed");

    await goto(page, "/discover");
    const feedText = await page.locator("body").innerText();
    assert(/evidence for this role/i.test(feedText), "candidate card has no evidence block");
    assert(feedText.includes("Likes left"), "candidate card has no Like allowance");
    assert(feedText.includes("Priority intros left"), "candidate card has no Priority-intro allowance");
    assert(!/(\d+% match|match percentage badge)/i.test(feedText), "candidate feed claims a match percentage");
    await page.locator("[data-testid=discover-yes]").click();
    await page.waitForTimeout(900);
    if ((await page.getByText(/It's a match/i).count()) > 0) {
      await page.keyboard.press("Escape");
    }
    assert((await page.locator("[data-testid=candidate-feed]").count()) > 0, "candidate feed disappeared after a decision");
    console.log("  evidence feed, Like cap and Priority-intro cap passed");

    await goto(page, "/invitations");
    assert(await page.locator("[data-testid=invitation-list]").count(), "candidate invitation inbox is missing");
    await page.locator("[data-testid=accept-invitation]").first().click();
    await page.waitForTimeout(1200);
    const invitationText = await page.locator("body").innerText();
    assert(
      invitationText.includes("Interest recorded") || invitationText.includes("Accepted"),
      "invitation acceptance did not record interest",
    );
    console.log("  invitation acceptance without an automatic match passed");

    await goto(page, "/updates");
    const updatesText = await page.locator("body").innerText();
    assert(/not selected at this stage/i.test(updatesText), "friendly seeded outcome is missing");
    assert(!updatesText.toLowerCase().includes("reviewed"), "outcome claims an invented review");
    console.log("  honest outcome wording passed");
    await candidate.context.close();

    console.log("Employer flow");
    const employer = await open(browser, [
      { name: "rivet_persona", value: "employer:emp-northwind-labs", url: base },
      { name: "rivet_employer_role", value: "role-northwind-product-engineer", url: base },
    ]);
    const epage = employer.page;

    await goto(epage, "/roles/new");
    assert(await epage.locator("[data-testid=role-card-form]").count(), "role-card form is missing");
    assert((await epage.getByText(/What would convince you/i).count()) > 0, "need-capture prompt is missing");
    assert((await epage.getByText(/The evidence you accept/i).count()) > 0, "assessment-bar section is missing");
    console.log("  role-card need-capture form passed");

    await goto(epage, "/discovery");
    assert((await epage.getByText(/Relevant non-swipers/i).count()) > 0, "discovery lane is missing");
    assert(await epage.locator("[data-testid=open-invite]").count(), "discovery invite control is missing");
    await epage.locator("[data-testid=open-invite]").first().click();
    assert(await epage.locator("[data-testid=invite-dialog]").count(), "invite dialog is missing");
    assert((await epage.getByText(/message only/i).count()) > 0, "invite dialog does not explain message-only semantics");
    await epage.getByRole("button", { name: "Cancel" }).click();
    console.log("  discovery lane and message-only invitation passed");

    await goto(epage, "/discover");
    assert(await epage.locator("[data-testid=review-card]").count(), "employer review card is missing");
    assert((await epage.getByText(/Stated evidence bar/i).count()) > 0, "employer card has no stated bar");
    assert((await epage.getByText(/Below your stated bar/i).count()) > 0, "below-bar section is missing");
    assert((await epage.getByText(/No assessment yet/i).count()) > 0, "no-evidence section is missing");
    await epage.locator("[data-testid=discover-pass]").click();
    await epage.waitForTimeout(800);
    console.log("  mixed feed, below-bar visibility and human pass passed");

    await goto(epage, "/matches");
    assert((await epage.getByText(/Intro call|Event-day meeting|Interview|Closed/i).count()) > 0, "match stage label is missing");
    await epage.locator("a[href^='/matches/']").first().click();
    await epage.waitForURL(/\/matches\/[^/]+$/, { timeout: 20_000 });
    assert((await epage.getByText(/Current stage:/i).count()) > 0, "match stage strip is missing");
    assert(await epage.locator("[data-testid=match-stage-control]").count(), "employer stage control is missing");
    console.log("  next-step stage workflow passed");
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
