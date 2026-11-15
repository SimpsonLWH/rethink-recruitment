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
    if (message.type() === "error") errors.push("console " + page.url() + ": " + message.text() + " @ " + (message.location()?.url ?? "unknown"));
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
    const candidateCannotScreen = await page.request.post(base + "/api/screening/role-northwind-product-engineer/cand-aino-vikstrom", {
      data: { action: "reopen" },
    });
    assert(candidateCannotScreen.status() === 403, "a candidate can call the employer pre-screen API");
    const candidateCannotExport = await page.request.get(base + "/api/screening/role-northwind-product-engineer/cand-aino-vikstrom/export");
    assert(candidateCannotExport.status() === 403, "a candidate can export an employer pre-screen record");
    console.log("  sample candidate login and dashboard passed, pre-screen API is employer-only");

    await goto(page, "/assessments/assess-javascript-v1-medium");
    assert(await page.locator("[data-testid=assessment-detail]").count(), "assessment detail is missing");
    assert((await page.getByText(/Final score: 80\/100/i).count()) > 0, "seeded final score is not visible");
    assert((await page.getByText(/Assessment closed/i).count()) > 0, "closed assessment state is missing");
    assert((await page.locator("[data-testid=start-assessment]").count()) === 0, "closed assessment still offers a start button");
    console.log("  seeded final score and closed assessment passed");

    await goto(page, "/assessments/assess-algorithms-v1-medium");
    assert(!(await page.locator("[data-testid=start-assessment]").isDisabled()), "assessment start is unexpectedly disabled");
    await page.locator("[data-testid=start-assessment]").click();
    await page.locator("[data-testid=oa-overlay]").waitFor({ timeout: 20_000 });
    await fillCode(
      page,
      "al1-m1",
      "function twoSum(numbers, target) {\n  const seen = new Map();\n  for (let i = 0; i < numbers.length; i += 1) {\n    const need = target - numbers[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(numbers[i], i);\n  }\n  return [];\n}",
    );
    await page.locator("[data-testid=run-examples]").click();
    await page.locator("[data-testid=example-check-result]").waitFor({ timeout: 20_000 });
    assert((await page.locator("[data-testid=example-check-result]").innerText()).includes("1 of 1"), "public example check did not run");
    await page.locator("[data-testid=problem-tab-1]").click();
    await fillCode(
      page,
      "al1-m2",
      "function longestUniqueRun(text) {\n  const last = new Map();\n  let start = 0;\n  let best = 0;\n  for (let i = 0; i < text.length; i += 1) {\n    const ch = text[i];\n    if (last.has(ch) && last.get(ch) >= start) start = last.get(ch) + 1;\n    last.set(ch, i);\n    best = Math.max(best, i - start + 1);\n  }\n  return best;\n}",
    );
    assert(!(await page.locator("[data-testid=assessment-submit]").isDisabled()), "assessment submit stayed disabled");
    await page.locator("[data-testid=assessment-submit]").click();
    await page.locator("[data-testid=submit-confirm-dialog]").waitFor({ timeout: 10_000 });
    await page.locator("[data-testid=confirm-submit]").click();
    await page.locator("[data-testid=assessment-result]").waitFor({ timeout: 30_000 });
    const resultText = await page.locator("[data-testid=assessment-result]").innerText();
    assert(resultText.includes("100/100"), "assessment result does not show the expected score");
    assert(resultText.includes("Algorithms"), "assessment result does not name the assessment family");
    assert((await page.getByText(/No retake/i).count()) > 0, "result does not state the one-attempt rule");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("[data-testid=assessment-detail]").waitFor({ timeout: 20_000 });
    const reloadedText = await page.locator("body").innerText();
    assert(reloadedText.includes("Final score: 100/100"), "result did not survive a reload");
    assert((await page.locator("[data-testid=start-assessment]").count()) === 0, "submitted assessment still offers a start button");
    const secondStart = await page.request.post(base + "/api/assessments/assess-algorithms-v1-medium/attempts");
    assert(secondStart.status() === 409, "a second sitting was not rejected with 409");
    assert((await page.locator("body").innerText()).includes("Final score: 100/100"), "assessment list does not show the final score");
    const policy = (await fetch(base + "/enter")).headers.get("permissions-policy") ?? "";
    assert(policy.includes("camera=()"), "Permissions-Policy header is missing");
    assert(!policy.includes("browsing-topics"), "Permissions-Policy still contains browsing-topics");
    const missingAttempt = await page.goto(base + "/assessments/attempts/does-not-exist", { waitUntil: "domcontentloaded" });
    assert(missingAttempt.status() === 200, "a missing attempt should recover, not 404");
    assert(await page.locator("[data-testid=attempt-unavailable]").count(), "missing-attempt recovery page is missing");
    console.log("  OA runner, example check, final submission and one-and-done rule passed");

    // Lockdown quant sitting through the API: answer keys stay hidden, the
    // integrity report is summarised on the server, and the score is unaffected.
    const quantStart = await page.request.post(base + "/api/assessments/assess-quant-v1-mental-math/attempts");
    assert(quantStart.ok(), "quant lockdown sitting did not start");
    const quantAttempt = (await quantStart.json()).attempt;
    assert(quantAttempt.assessment.proctoring === "LOCKDOWN", "quant sitting is not in lockdown mode");
    assert(quantAttempt.assessment.durationMinutes === 8, "quant sitting has no timer");
    assert(quantAttempt.problems.every((problem) => problem.examples.length === 0), "a quant answer key leaked to the browser");
    const quantAnswers = { "qm1-1": "1081", "qm1-2": "96", "qm1-3": "7/16", "qm1-4": "9", "qm1-5": "6993", "qm1-6": "4096", "qm1-7": "-1", "qm1-8": "4225" };
    const quantSubmit = await page.request.post(base + "/api/assessments/attempts/" + quantAttempt.id + "/submit", {
      data: {
        submissions: quantAnswers,
        assessmentId: quantAttempt.assessment.id,
        integrity: { events: [{ type: "fullscreen_exit", atSeconds: 40 }, { type: "paste_blocked", atSeconds: 50 }], autoSubmitted: false, reason: null },
      },
    });
    assert(quantSubmit.ok(), "quant lockdown submission failed");
    const quantResult = await quantSubmit.json();
    assert(quantResult.marking.score === 100, "quant reference answers did not score 100");
    assert(quantResult.result.integrity?.mode === "LOCKDOWN", "integrity summary was not stored");
    assert(quantResult.result.integrity?.violations === 1, "lockdown violation count is wrong");
    console.log("  timed lockdown quant sitting, hidden answer keys and integrity record passed");

    await goto(page, "/learn/quant/game-ev");
    await page.locator("[data-testid=practice-solver] input[id^=practice-]").fill("0.2");
    await page.locator("[data-testid=practice-run]").click();
    await waitForText(page, "[data-testid=practice-results]", "Correct");
    assert((await page.getByText(/Why it works/).count()) > 0, "practice explanation did not appear after a correct answer");
    console.log("  Prepare practice check passed");

    await goto(page, "/profile/edit");
    assert(await page.locator("[data-testid=profile-editor]").count(), "profile editor is missing");
    assert((await page.getByText(/Let teams find me in discovery/i).count()) > 0, "discovery opt-in control is missing");
    assert((await page.getByText(/No CV, no upload/i).count()) > 0, "profile editor still implies a CV");
    console.log("  structured profile and discovery opt-in passed");

    await goto(page, "/discover");
    const feedText = await page.locator("body").innerText();
    assert(await page.locator("[data-testid=evidence-status]").count(), "candidate card has no evidence status");
    await page.locator("[data-testid=evidence-status]").first().hover();
    assert(await page.getByText(/Required evidence/i).first().isVisible(), "evidence hover did not reveal requirements");
    assert(/likes left/i.test(feedText), "candidate card has no like allowance");
    assert(/Priority intros? left/i.test(feedText), "candidate card has no Priority-intro allowance");
    assert(!/(\d+% match|match percentage badge)/i.test(feedText), "candidate feed claims a match percentage");
    await page.keyboard.press("ArrowLeft");
    await page.locator("[data-testid=shortcut-confirm]").waitFor({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    assert(!(await page.locator("[data-testid=shortcut-confirm]").count()), "shortcut confirmation did not cancel");
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
    await np.locator("[data-testid=cv-skip]").click();
    await np.waitForURL(/\/dashboard/, { timeout: 20_000 });
    await np.locator("[data-testid=candidate-dashboard]").waitFor({ timeout: 20_000 });
    assert((await np.locator("body").innerText()).includes("No CV. That is fine."), "skip-CV dashboard copy is missing");
    await goto(np, "/onboarding/cv");
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
    await formSelects.nth(1).selectOption("assess-javascript-v1-medium");
    await nr.getByText("+ Add another assessment requirement").click();
    await nr.locator("[data-testid=role-card-form] select").nth(2).selectOption("assess-algorithms-v1-medium");
    await nr.locator("[data-testid=role-card-form] input[type=number]").nth(1).fill("60");
    await nr.locator("[data-testid=save-role-card]").click();
    await nr.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await nr.locator("[data-testid=recruiter-dashboard]").waitFor({ timeout: 20_000 });
    assert(await nr.locator("[data-testid=recruiter-dashboard]").count(), "new recruiter did not reach the dashboard");
    const recruiterText = await nr.locator("body").innerText();
    assert(recruiterText.includes("Smoke Platform Engineer"), "new recruiter role is missing");
    assert(recruiterText.includes("JavaScript") && recruiterText.includes("Algorithms"), "multi-OA requirements are missing");
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
    {
      const quant = await open(browser, []);
      await goto(quant.page, "/enter");
      await quant.page.locator("[data-testid=sample-quant-employer]").click();
      await quant.page.waitForURL(/\/dashboard/, { timeout: 20_000 });
      await goto(quant.page, "/assessments");
      assert((await quant.page.getByText(/Test library/).count()) > 0, "employer test library is missing");
      assert((await quant.page.locator("[data-testid=start-assessment]").count()) === 0, "employer can start a test");
      await quant.context.close();
      console.log("  quant recruiter sample login and test library passed");
    }
    assert(await epage.locator("[data-testid=recruiter-dashboard]").count(), "sample employer did not reach the dashboard");
    console.log("  sample employer login and dashboard passed");

    await goto(epage, "/prescreen");
    assert(await epage.locator("[data-testid=prescreen-desk]").count(), "pre-screen desk is missing");
    const deskText = await epage.locator("body").innerText();
    assert(deskText.includes("No CV keywords"), "pre-screen desk does not state the no-CV-scan promise");
    assert(deskText.includes("Recent decisions"), "pre-screen desk has no decision record");
    assert(await epage.locator('a[href^="/prescreen/role-"]').count(), "pre-screen has no role queues");
    console.log("  pre-screen desk, role queues and decision record passed");

    await epage.locator('a[href^="/prescreen/role-"]').first().click();
    await epage.waitForURL(/\/prescreen\/[^/]+$/, { timeout: 20_000 });
    await epage.locator("[data-testid=prescreen-role]").waitFor({ timeout: 20_000 });
    assert(await epage.locator("[data-testid=prescreen-role]").count(), "pre-screen role queue is missing");
    assert((await epage.getByText(/The screening plan/i).count()) > 0, "screening plan is missing");
    assert((await epage.getByText(/Event order, never a score order/i).count()) > 0, "queue does not state its order");
    await epage.getByRole("button", { name: "Edit plan" }).click();
    await epage.getByRole("dialog").waitFor({ timeout: 10_000 });
    assert((await epage.getByText(/Edit the screening plan/i).count()) > 0, "plan editor did not open");
    await epage.getByRole("dialog").locator("label", { hasText: "Label" }).first().locator("input").fill("JavaScript: Data handling (smoke plan)");
    await epage.getByRole("dialog").getByRole("button", { name: "Save plan" }).click();
    await epage.getByText("Plan v2").first().waitFor({ timeout: 20_000 });
    assert((await epage.locator("body").innerText()).includes("smoke plan"), "saved plan label is missing");
    console.log("  pre-screen queue, plan editor and plan version passed");

    await goto(epage, "/prescreen/role-northwind-product-engineer/cand-priya-raman");
    await epage.getByText("frozen at decision").first().waitFor({ timeout: 20_000 });
    const frozenText = await epage.locator("body").innerText();
    assert(frozenText.includes("Plan v1"), "decided packet did not keep the v1 snapshot");
    assert(frozenText.includes("role plan is now v2"), "decided packet did not warn about the newer plan");
    console.log("  frozen decision snapshot passed");

    await goto(epage, "/prescreen/role-northwind-product-engineer/cand-aino-vikstrom");
    assert(await epage.locator("[data-testid=prescreen-packet]").count(), "pre-screen packet is missing");
    const packetText = await epage.locator("body").innerText();
    assert(packetText.includes("Pre-screen brief"), "packet brief is missing");
    assert(packetText.includes("Conversation kit"), "conversation kit is missing");
    assert(packetText.includes("Audit trail"), "audit trail is missing");
    assert(packetText.includes("Claims: checked or still prose"), "claim ledger is missing");
    assert(packetText.includes("Work sample, question by question"), "work sample breakdown is missing");
    assert(packetText.includes("5/5 checks"), "question-level work sample checks are missing");
    assert(packetText.includes("Plan v2"), "open packet did not use the current plan version");
    const claimCard = epage.locator("article", { hasText: "I prototype with real copy" });
    await claimCard.getByRole("button", { name: "Checked" }).click();
    await claimCard.getByText("Checked", { exact: true }).first().waitFor({ timeout: 15_000 });
    await epage.getByRole("button", { name: "Add a note" }).click();
    await epage.locator("#screening-note").fill("Smoke note: artifact opened and the claim was checked.");
    await epage.getByRole("button", { name: "Save note" }).click();
    await epage.getByText("Smoke note: artifact opened and the claim was checked.").waitFor({ timeout: 15_000 });
    await epage.waitForTimeout(900);
    await epage.getByRole("button", { name: /Record a decision/ }).click();
    await epage.getByRole("dialog").waitFor({ timeout: 10_000 });
    await epage.getByRole("dialog").getByText("Move to interview", { exact: true }).click();
    await epage.getByRole("dialog").locator("#decision-reason").fill("Assessment above the bar, artifact checked, and the conversation kit is ready.");
    await epage.getByRole("dialog").getByRole("checkbox").check();
    await epage.getByRole("dialog").getByRole("button", { name: "Save decision" }).click();
    await epage.getByText("Moved to interview").first().waitFor({ timeout: 15_000 });
    const exportResponse = await epage.request.get(base + "/api/screening/role-northwind-product-engineer/cand-aino-vikstrom/export");
    assert(exportResponse.status() === 200, "pre-screen export did not return a record");
    assert((exportResponse.headers()["content-disposition"] ?? "").includes("attachment"), "pre-screen export is not a download");
    const exported = await exportResponse.json();
    assert(exported.decision.status === "ADVANCE", "exported decision is missing");
    assert(exported.plan.version >= 2, "exported plan version is stale");
    assert(exported.claims.length > 0 && exported.auditTrail.length > 0, "exported record is incomplete");
    console.log("  pre-screen packet, claim check, note, human decision and export passed");

    await goto(epage, "/roles/new");
    assert(await epage.locator("[data-testid=role-card-form]").count(), "role-card form is missing");
    assert((await epage.getByText(/New role card/i).count()) > 0, "role-card heading is missing");
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
    assert(await epage.locator("[data-testid=employer-assessment-evidence]").count(), "employer card has no evidence status");
    await epage.locator("[data-testid=evidence-status]").first().hover();
    assert(await epage.getByText(/Required evidence/i).first().isVisible(), "employer evidence hover did not reveal requirements");
    assert((await epage.getByText(/Below your stated bar/i).count()) > 0, "below-bar section is missing");
    assert((await epage.getByText(/No assessment yet/i).count()) > 0, "no-evidence section is missing");

    await epage.locator("[data-testid=read-evidence]").click();
    await epage.locator("[data-testid=evidence-reading]").waitFor({ timeout: 30_000 });
    await epage.getByText(/Deterministic reading|Nemotron/i).first().waitFor({ timeout: 30_000 });
    assert(
      (await epage.getByText(/Covered by the record|Open questions/i).count()) > 0,
      "evidence reading did not show its evidence sections",
    );
    await epage.keyboard.press("ArrowLeft");
    assert(
      !(await epage.locator("[data-testid=shortcut-confirm]").count()),
      "an arrow key decided behind the open evidence reading",
    );
    await epage.keyboard.press("Escape");
    await epage.locator("[data-testid=evidence-reading]").waitFor({ state: "detached", timeout: 10_000 });
    console.log("  evidence reading, engine label and dialog keyboard guard passed");

    await epage.keyboard.press("ArrowLeft");
    await epage.locator("[data-testid=shortcut-confirm]").waitFor({ timeout: 10_000 });
    await epage.keyboard.press("Escape");
    assert(!(await epage.locator("[data-testid=shortcut-confirm]").count()), "employer shortcut confirmation did not cancel");
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