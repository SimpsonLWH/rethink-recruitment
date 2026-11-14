import { describe, expect, it } from "vitest";
import {
  NEAR_COPY_THRESHOLD,
  isNearCopy,
  normalizeForCompare,
  rewriteClaimForRole,
  similarity,
} from "./rewrite";
import type { RewriteRole } from "./rewrite";

const role: RewriteRole = {
  title: "Product Engineer",
  skills: ["Frontend", "Accessibility"],
  employer: { name: "Northwind Labs" },
};

const designRole: RewriteRole = {
  title: "Product Engineer",
  skills: ["Design systems", "Frontend"],
  employer: { name: "Northwind Labs" },
};

function numbersIn(value: string): string[] {
  return value.match(/\d[\d,]*(?:\.\d+)?%?/g) ?? [];
}

function urlsIn(value: string): string[] {
  return (value.match(/https?:\/\/[^\s<>"')]+/g) ?? []).map((url) => url.replace(/[.,;:!?]+$/, ""));
}

describe("normalizeForCompare", () => {
  it("lowercases, strips punctuation and collapses whitespace", () => {
    expect(normalizeForCompare("  I  Rebuilt the FLOW. ")).toBe("i rebuilt the flow");
    expect(normalizeForCompare("At Lumen Retail, I rebuilt it!")).toBe("at lumen retail i rebuilt it");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeForCompare("   ")).toBe("");
  });
});

describe("similarity", () => {
  it("is 1 for identical text and 0 for disjoint text", () => {
    expect(similarity("Rebuilt the returns flow.", "rebuilt the returns flow")).toBe(1);
    expect(similarity("alpha beta gamma delta", "one two three four")).toBe(0);
  });

  it("is deterministic and symmetric", () => {
    const a = "rebuilt the returns flow and made it accessible";
    const b = "rebuilt the returns flow for first time shoppers";
    expect(similarity(a, b)).toBe(similarity(a, b));
    expect(similarity(a, b)).toBe(similarity(b, a));
    expect(similarity(a, b)).toBeGreaterThan(0);
    expect(similarity(a, b)).toBeLessThan(1);
  });

  it("stays within 0 and 1", () => {
    const pairs: Array<[string, string]> = [
      ["", ""],
      ["", "abc"],
      ["abc", "abcdef"],
      ["abc def", "abc def"],
    ];
    for (const [a, b] of pairs) {
      const value = similarity(a, b);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("isNearCopy", () => {
  const source = "I rebuilt the returns flow and made the interface more accessible.";

  it("treats normalised-equal text as a near copy", () => {
    expect(isNearCopy(source, "i rebuilt  the returns flow and made the interface more accessible")).toBe(true);
  });

  it("treats a long claim with one word removed as a near copy", () => {
    const long = Array.from({ length: 24 }, (_value, index) => "word" + index).join(" ");
    const shorter = long.split(" ").slice(0, 23).join(" ");
    expect(similarity(long, shorter)).toBeGreaterThanOrEqual(NEAR_COPY_THRESHOLD);
    expect(isNearCopy(long, shorter)).toBe(true);
  });

  it("accepts the deterministic tightening of a short first-person claim", () => {
    const tightened = "Rebuilt the returns flow and made the interface more accessible.";
    expect(similarity(source, tightened)).toBeLessThan(NEAR_COPY_THRESHOLD);
    expect(isNearCopy(source, tightened)).toBe(false);
  });

  it("is true for an empty candidate", () => {
    expect(isNearCopy(source, "   ")).toBe(true);
  });
});

describe("rewriteClaimForRole", () => {
  it("strips leading filler and drops the first-person frame", () => {
    const source = "I think I rebuilt the checkout flow at Lumen Retail.";
    const result = rewriteClaimForRole(source, role);
    expect(result).not.toBeNull();
    expect(result).not.toMatch(/^i think/i);
    expect(result).not.toMatch(/^i\b/i);
    expect(result).toMatch(/^Rebuilt/);
    expect(result).toContain("Lumen Retail");
    expect(normalizeForCompare(result ?? "")).not.toBe(normalizeForCompare(source));
    expect(isNearCopy(source, result ?? "")).toBe(false);
  });

  it("moves the location out of the opening clause and leads with the action", () => {
    const source = "At Lumen Retail, I rebuilt the returns flow for first-time shoppers.";
    const result = rewriteClaimForRole(source, role);
    expect(result).not.toBeNull();
    expect(result).toMatch(/^Rebuilt/);
    expect(result).toContain("at Lumen Retail");
    expect(result).not.toMatch(/^At Lumen Retail, I\b/);
    expect(similarity(source, result ?? "")).toBeLessThan(NEAR_COPY_THRESHOLD);
  });

  it("tightens safe phrasing (went from, so that, in order to, a number of)", () => {
    const source =
      "A number of small fixes went from planned to shipped in order to unblock the team, so that the queue cleared.";
    const result = rewriteClaimForRole(source, role);
    expect(result).not.toBeNull();
    expect(result).toContain("Several");
    expect(result).toContain("increased from");
    expect(result).not.toMatch(/\ba number of\b/i);
    expect(result).not.toMatch(/(?:^|\s)in order to\b/i);
    expect(result).not.toMatch(/\bso that\b/i);
    expect(result).not.toMatch(/\brose\b/i);
  });

  it("removes really/actually/basically and other filler adverbs", () => {
    const source = "Honestly, I really actually basically rebuilt the returns flow.";
    const result = rewriteClaimForRole(source, role);
    expect(result).not.toBeNull();
    expect(result).not.toMatch(/\b(?:really|actually|basically|honestly)\b/i);
    expect(result).not.toMatch(/^I\b/);
    expect(result).toMatch(/^Rebuilt/);
  });

  it("puts the metric result sentence last after the context", () => {
    const source = "Completion went from 40% to 61% in six weeks. I rebuilt the returns flow at Lumen Retail.";
    const result = rewriteClaimForRole(source, role);
    expect(result).not.toBeNull();
    expect(result).toMatch(/six weeks\.$/);
    expect(result!.indexOf("Lumen Retail")).toBeLessThan(result!.indexOf("61%"));
    expect(result).toContain("increased from");
    expect(result).not.toMatch(/\brose\b/i);
  });

  it("uses the role to lead with the most relevant sentence", () => {
    const source = "I wrote the usage notes for the team. I rebuilt the design system in the storefront.";
    const result = rewriteClaimForRole(source, designRole);
    expect(result).not.toBeNull();
    expect(result!.startsWith("Rebuilt the design system")).toBe(true);
    expect(result).toContain("Wrote the usage notes");
  });

  it("preserves names, numbers and URLs and invents no links or numbers", () => {
    const source =
      "At Lumen Retail, I rebuilt the checkout flow so that first-time shoppers could finish it; completion went from 41% to 63% in six weeks. Notes are at https://example.com/?evidence=checkout.";
    const result = rewriteClaimForRole(source, role, { module: "PROJECT", organisation: "Lumen Retail" });
    expect(result).not.toBeNull();
    expect(result).toContain("Lumen Retail");
    expect(result).toContain("41%");
    expect(result).toContain("63%");
    expect(result).toContain("https://example.com/?evidence=checkout");
    expect(numbersIn(result!).sort()).toEqual(numbersIn(source).sort());
    expect(urlsIn(result!)).toEqual(urlsIn(source));
    expect(result).not.toContain("https://invented");
  });

  it("never adds provenance or injects the role employer", () => {
    const source = "At Lumen Retail, I rebuilt the returns flow.";
    const result = rewriteClaimForRole(source, role, {
      module: "PROJECT",
      organisation: "Lumen Retail",
      title: "Returns rebuild",
    });
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).not.toContain("provenance");
    expect(result!.toLowerCase()).not.toContain("self_claimed");
    expect(result!.toLowerCase()).not.toContain("employer_confirmed");
    expect(result).not.toContain("Northwind Labs");
  });

  it("returns null for claims with no honest rewrite", () => {
    expect(rewriteClaimForRole("People who argue about the problem before the solution.", role)).toBeNull();
    expect(
      rewriteClaimForRole("BSc in Computer Science from a fictional Finnish university, 2017–2020.", role),
    ).toBeNull();
    expect(rewriteClaimForRole("Small, senior-ish, writes down decisions.", role)).toBeNull();
  });

  it("never returns a source-equal or near-copy rewrite", () => {
    const claims = [
      "I rebuilt the returns flow and made the interface more accessible.",
      "At Lumen Retail, I rebuilt the returns flow so that first-time shoppers could finish it.",
      "I think I wrote a number of scripts in order to automate the release.",
      "Honestly, I really rebuilt the checkout flow.",
      "I led the migration of the billing service and the team kept shipping.",
      "I wrote the internal service template our six teams now start from and it actually gets used.",
    ];
    for (const claim of claims) {
      const result = rewriteClaimForRole(claim, role);
      if (result === null) continue;
      expect(normalizeForCompare(result)).not.toBe(normalizeForCompare(claim));
      expect(isNearCopy(claim, result)).toBe(false);
      expect(similarity(claim, result)).toBeLessThan(NEAR_COPY_THRESHOLD);
    }
  });

  it("is deterministic", () => {
    const source = "I think I rebuilt the returns flow at Lumen Retail.";
    expect(rewriteClaimForRole(source, role)).toBe(rewriteClaimForRole(source, role));
  });
});
