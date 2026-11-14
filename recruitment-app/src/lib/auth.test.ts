import { describe, expect, it } from "vitest";
import { hashDemoPassword, verifyDemoPassword } from "./auth";

describe("demo account passwords", () => {
  it("hashes and verifies a password without storing it in plain text", () => {
    const { hash, salt } = hashDemoPassword("secret123");
    expect(hash).not.toContain("secret123");
    expect(salt).toHaveLength(32);
    expect(verifyDemoPassword("secret123", hash, salt)).toBe(true);
    expect(verifyDemoPassword("wrong", hash, salt)).toBe(false);
  });
});
