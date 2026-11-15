#!/usr/bin/env node
/**
 * Accessibility and print audit for the pre-screen surface.
 *
 * Prereqs: npm run seed, npm run dev or npm start.
 *
 *   RIVET_BASE_URL=http://localhost:3000 npm run audit:a11y
 *
 * This is a focused structural audit, not a replacement for a full WCAG
 * review: it checks landmarks, headings, accessible names, overflow, skip
 * navigation, dialog focus, Escape, focus return, and print media.
 */
import { chromium } from "playwright-core";

const base = process.env.RIVET_BASE_URL || "http://localhost:3000";
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const results = [];

function assert(condition, message) {
  if (!condition) throw new Error("ASSERT: " + message);
}

function note(message) {
  results.push("  ✓ " + message);
  console.log("  ✓ " + message);
}

async function open(browser, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addCookies([
    { name: "rivet_persona", value: "employer:emp-northwind-labs", url: base },
    { name: "rivet_employer_role", value: "role-northwind-product-engineer", url: base },
  ]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push("pageerror " + page.url() + ": " + error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push("console " + page.url() + ": " + message.text());
  });
  return { context, page, errors };
}

async function goto(page, route) {
  const response = await page.goto(base + route, { waitUntil: "networkidle", timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  return response;
}

async function structuralAudit(page, label) {
  const audit = await page.evaluate(() => {
    function visible(element) {
      if (element.tagName === "INPUT" && element.type === "hidden") return false;
      if (!element.getClientRects().length) return false;
      if (element.checkVisibility && !element.checkVisibility()) return false;
      return true;
    }

    function nameOf(element) {
      const aria = element.getAttribute("aria-label");
      if (aria && aria.trim()) return aria.trim();
      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const text = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ")
          .trim();
        if (text) return text;
      }
      if (element.labels && element.labels.length) {
        const text = Array.from(element.labels).map((label) => label.textContent ?? "").join(" ").trim();
        if (text) return text;
      }
      const placeholder = element.getAttribute("placeholder");
      if (placeholder && placeholder.trim()) return placeholder.trim();
      const text = (element.innerText ?? element.textContent ?? "").trim();
      if (text) return text;
      const title = element.getAttribute("title");
      if (title && title.trim()) return title.trim();
      const image = element.querySelector("img[alt]");
      if (image?.getAttribute("alt")?.trim()) return image.getAttribute("alt").trim();
      return "";
    }

    const visibleControls = Array.from(document.querySelectorAll("a[href], button, input, textarea, select")).filter(visible);
    const unnamed = visibleControls
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: (element.textContent ?? "").trim().slice(0, 60),
        html: element.outerHTML.slice(0, 160),
        name: nameOf(element),
      }))
      .filter((entry) => !entry.name);

    const imagesMissingAlt = Array.from(document.querySelectorAll("img")).filter(
      (image) => !image.hasAttribute("alt"),
    ).length;
    const headingCount = document.querySelectorAll("h1").length;
    const mains = document.querySelectorAll("main").length;
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;

    return { unnamed, imagesMissingAlt, headingCount, mains, overflow, controls: visibleControls.length };
  });

  assert(audit.mains === 1, label + ": expected one main landmark, found " + audit.mains);
  assert(audit.headingCount === 1, label + ": expected one h1, found " + audit.headingCount);
  assert(audit.imagesMissingAlt === 0, label + ": " + audit.imagesMissingAlt + " image(s) without an alt attribute");
  assert(audit.overflow <= 0, label + ": horizontal overflow of " + audit.overflow + "px");
  assert(
    audit.unnamed.length === 0,
    label + ": controls without an accessible name: " + JSON.stringify(audit.unnamed, null, 2),
  );
  note(label + ": landmark, heading, alt text, overflow and " + audit.controls + " accessible control names");
}

async function skipLinkAudit(page, label) {
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      text: (active?.textContent ?? "").trim(),
      href: active?.getAttribute("href") ?? "",
    };
  });
  assert(skip.text === "Skip to content", label + ": first Tab did not focus the skip link (got " + JSON.stringify(skip) + ")");
  assert(skip.href === "#main", label + ": skip link does not target #main");
  note(label + ": skip link is the first keyboard stop");
}

async function dialogAudit(page, label) {
  const trigger = page.getByRole("button", { name: /Record a decision/ }).first();
  await trigger.waitFor({ timeout: 20_000 });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10_000 });
  const focusInside = await page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")));
  assert(focusInside, label + ": focus did not move into the decision dialog");
  const labelled = await page.evaluate(() => {
    const dialog = document.querySelector("[role=dialog]");
    if (!dialog) return false;
    return Boolean(dialog.getAttribute("aria-labelledby") || dialog.getAttribute("aria-label"));
  });
  assert(labelled, label + ": decision dialog has no accessible name");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached", timeout: 10_000 });
  const focusReturned = await page.evaluate(() =>
    (document.activeElement?.textContent ?? "").includes("Record a decision"),
  );
  assert(focusReturned, label + ": focus did not return to the decision trigger");
  note(label + ": dialog focus, accessible name, Escape and focus return");
}

async function printAudit(page, label) {
  await page.emulateMedia({ media: "print" });
  const print = await page.evaluate(() => {
    const header = document.querySelector("header");
    const nav = document.querySelector("nav");
    const footer = document.querySelector("footer");
    const main = document.querySelector("main");
    const style = (element) => (element ? getComputedStyle(element).display : "missing");
    return {
      header: style(header),
      nav: style(nav),
      footer: style(footer),
      main: style(main),
      text: (main?.textContent ?? "").length,
    };
  });
  assert(print.header === "none", label + ": app header is not hidden in print");
  assert(print.nav === "none", label + ": navigation is not hidden in print");
  assert(print.footer === "none", label + ": footer is not hidden in print");
  assert(print.main !== "none" && print.text > 1000, label + ": print layout has no readable packet content");
  await page.emulateMedia({ media: "screen" });
  note(label + ": print hides chrome and keeps the packet content");
}

async function main() {
  try {
    const probe = await fetch(base + "/api/health");
    if (!probe.ok) throw new Error("status " + probe.status);
  } catch {
    throw new Error("Rivet is not reachable at " + base + ". Start it with: npm run dev");
  }

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });
  const allErrors = [];

  try {
    const desktop = await open(browser, { width: 1440, height: 1000 });
    const pages = [
      { route: "/", label: "landing" },
      { route: "/enter", label: "entry" },
      { route: "/prescreen", label: "pre-screen desk" },
      { route: "/prescreen/role-northwind-product-engineer", label: "role queue" },
      { route: "/prescreen/role-northwind-product-engineer/cand-aino-vikstrom", label: "packet" },
    ];
    for (const entry of pages) {
      const response = await goto(desktop.page, entry.route);
      assert(response?.status() === 200, entry.label + ": expected 200, got " + response?.status());
      await structuralAudit(desktop.page, entry.label + " (1440)");
    }

    await goto(desktop.page, "/prescreen/role-northwind-product-engineer/cand-aino-vikstrom");
    await skipLinkAudit(desktop.page, "packet");
    await dialogAudit(desktop.page, "packet");
    await printAudit(desktop.page, "packet");
    allErrors.push(...desktop.errors);
    await desktop.context.close();

    const mobile = await open(browser, { width: 390, height: 844 });
    for (const entry of [
      { route: "/", label: "landing" },
      { route: "/prescreen", label: "pre-screen desk" },
      { route: "/prescreen/role-northwind-product-engineer", label: "role queue" },
      { route: "/prescreen/role-northwind-product-engineer/cand-noor-salmi", label: "packet" },
    ]) {
      await goto(mobile.page, entry.route);
      await structuralAudit(mobile.page, entry.label + " (390)");
    }
    allErrors.push(...mobile.errors);
    await mobile.context.close();
  } finally {
    await browser.close();
  }

  if (allErrors.length) {
    console.log("\nConsole/page errors:");
    for (const error of [...new Set(allErrors)]) console.log("  - " + error);
    throw new Error(allErrors.length + " browser error(s) captured");
  }

  console.log("\nAccessibility and print audit passed.");
  console.log(results.join("\n"));
}

main().catch((error) => {
  console.error("\n" + error.message);
  process.exitCode = 1;
});
