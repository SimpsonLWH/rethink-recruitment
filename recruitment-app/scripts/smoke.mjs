#!/usr/bin/env node
/**
 * Keyless browser smoke test for the assessment-backed pivot.
 * Runs against a freshly seeded demo.
 *
 *   npm run seed
 *   npm run dev
 *   RIVET_BASE_URL=http://localhost:3000 npm run smoke
 *
 * It mutates demo state (temporary candidate/hiring accounts, one assessment,
 * one Like, one invitation response, one employer pass). Reseed afterwards.
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
    const candidate = await open(browser, []);
    const page = candidate.page;
    await goto(page, "/enter");
    assert(await page.locator("[data-testid=candidate-account-panel]").count(), "candidate account panel is missing");
    await page.locator("[data-testid=sample-candidate]").click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await page.locator("[data-testid=candidate-dashboard]").waitFor({ timeout: 20_000 });
    assert(await page.locator("[data-testid=candidate-dashboard]").count(), "sample candidate did not reach the dashboard");
    console.log("  sample candidate login and dashboard passed");

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
      /interest recorded|accepted/i.test(invitationText),
      "invitation acceptance did not record interest",
    );
    console.log("  invitation acceptance without an automatic match passed");

    await goto(page, "/updates");
    const updatesText = await page.locator("body").innerText();
    assert(/not selected at this stage/i.test(updatesText), "friendly seeded outcome is missing");
    assert(!updatesText.toLowerCase().includes("reviewed"), "outcome claims an invented review");
    console.log("  honest outcome wording passed");
    await candidate.context.close();

    console.log("New candidate signup");
    const newCandidate = await open(browser, []);
    const np = newCandidate.page;
    const candidateEmail = "smoke-candidate-" + Date.now() + "@demo.rivet";
    await goto(np, "/signup?side=candidate");
    await np.locator("[data-testid=signup-name]").fill("Smoke Candidate");
    await np.locator("[data-testid=signup-email]").fill(candidateEmail);
    await np.locator("[data-testid=signup-password]").fill("secret123");
    await np.locator("[data-testid=signup-submit]").click();
    await np.waitForURL(/\/onboarding\/cv/, { timeout: 20_000 });
    assert(await np.locator("[data-testid=candidate-cv-onboarding]").count(), "candidate CV onboarding is missing");
    await np.locator("input[value=aino-vikstrom]").check();
    await np.locator("[data-testid=cv-sample-submit]").click();
    await np.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await np.locator("[data-testid=candidate-dashboard]").waitFor({ timeout: 20_000 });
    assert(await np.locator("[data-testid=candidate-dashboard]").count(), "new candidate did not reach the dashboard");
    assert((await np.locator("body").innerText()).includes("aino-vikstrom-sample.pdf"), "sample CV was not recorded");
    console.log("  create candidate account + CV sample + dashboard passed");
    await newCandidate.context.close();

    console.log("New recruiter signup");
    const newRecruiter = await open(browser, []);
    const nr = newRecruiter.page;
    const recruiterEmail = "smoke-recruiter-" + Date.now() + "@demo.rivet";
    await goto(nr, "/signup?side=employer");
    await nr.locator("[data-testid=signup-name]").fill("Smoke Hiring Co");
    await nr.locator("[data-testid=signup-email]").fill(recruiterEmail);
    await nr.locator("[data-testid=signup-password]").fill("secret123");
    await nr.locator("[data-testid=signup-submit]").click();
    await nr.waitForURL(/\/onboarding\/role/, { timeout: 20_000 });
    assert(await nr.locator("[data-testid=recruiter-onboarding]").count(), "recruiter onboarding is missing");
    await nr.getByLabel("Role title").fill("Smoke Platform Engineer");
    const formSelects = nr.locator("[data-testid=role-card-form] select");
    await formSelects.nth(1).selectOption("assess-backend-design-v1-advanced");
    await nr.getByText("+ Add another assessment requirement").click();
    await nr.locator("[data-testid=role-card-form] select").nth(2).selectOption("assess-algorithms-v1-medium");
    await nr.locator("[data-testid=role-card-form] input[type=number]").nth(1).fill("60");
    await nr.locator("[data-testid=save-role-card]").click();
    await nr.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await nr.locator("[data-testid=recruiter-dashboard]").waitFor({ timeout: 20_000 });
    assert(await nr.locator("[data-testid=recruiter-dashboard]").count(), "new recruiter did not reach the dashboard");
    const recruiterText = await nr.locator("body").innerText();
    assert(recruiterText.includes("Smoke Platform Engineer"), "new recruiter role is missing");
    assert(recruiterText.includes("Backend design") && recruiterText.includes("Algorithms"), "multi-OA requirements are missing");
    console.log("  create hiring account + multi-OA requirements + dashboard passed");
    await newRecruiter.context.close();

    console.log("Employer flow");
    const employer = await open(browser, []);
    const epage = employer.page;
    await goto(epage, "/enter");
    assert(await epage.locator("[data-testid=employer-account-panel]").count(), "employer account panel is missing");
    await epage.locator("[data-testid=sample-employer]").click();
    await epage.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await epage.locator("[data-testid=recruiter-dashboard]").waitFor({ timeout: 20_000 });
    assert(await epage.locator("[data-testid=recruiter-dashboard]").count(), "sample employer did not reach the dashboard");
    console.log("  sample employer login and dashboard passed");

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