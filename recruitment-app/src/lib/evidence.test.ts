import { describe, expect, it } from "vitest";
import { LINK_STATUS_LABEL, PROVENANCE_LABEL, normalizeLinkStatus } from "./evidence";

describe("evidence display language", () => {
  it("uses exactly the two mechanical link-status strings", () => {
    expect(LINK_STATUS_LABEL.WORKS).toBe("Link works");
    expect(LINK_STATUS_LABEL.UNREACHABLE).toBe("Link unreachable");
    expect(Object.values(LINK_STATUS_LABEL).some((label) => /verif|true|truth/i.test(label))).toBe(false);
  });

  it("keeps provenance as exactly two independent states", () => {
    expect(PROVENANCE_LABEL.SELF_CLAIMED).toBe("Self-claimed");
    expect(PROVENANCE_LABEL.EMPLOYER_CONFIRMED).toBe("Employer-confirmed");
    expect(normalizeLinkStatus("WORKS")).toBe("WORKS");
    expect(normalizeLinkStatus("MAYBE")).toBeNull();
  });
});
