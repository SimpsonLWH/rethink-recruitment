import { describe, expect, it } from "vitest";
import type { AiRunView } from "@/lib/repo";
import type { LiveEvidenceEntry } from "./live-evidence";
import { deriveSurfaceStatus, type SurfaceStatusInput } from "./status";

let runSequence = 0;

function makeRun(input: {
  kind?: string;
  mode: "LIVE" | "FALLBACK";
  createdAt?: string;
}): AiRunView {
  runSequence += 1;
  const live = input.mode === "LIVE";
  return {
    id: "run-" + runSequence,
    kind: input.kind ?? "extract",
    provider: live ? "nvidia" : "local",
    model: live ? "nvidia/nemotron-3.5-super-vl-120b-a12b" : "deterministic-local",
    mode: input.mode,
    status: live ? "ok" : "local-fallback",
    createdAt: input.createdAt ?? "2026-11-14T09:00:00.000Z",
  };
}

function makeEvidence(overrides: Partial<LiveEvidenceEntry> = {}): LiveEvidenceEntry {
  return {
    surface: "extract",
    provider: "NVIDIA",
    model: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    capturedAt: "2026-11-14T09:00:00.000Z",
    file: "audit/live/extract-2026-11-14.json",
    sha256: "0".repeat(64),
    redactions: ["Authorization header"],
    ...overrides,
  };
}

function derive(overrides: Partial<SurfaceStatusInput> = {}) {
  return deriveSurfaceStatus({
    surface: "extract",
    runs: [],
    evidence: [],
    configured: false,
    ...overrides,
  });
}

describe("deriveSurfaceStatus", () => {
  it("reports implemented-not-run when nothing has run and no evidence exists", () => {
    const result = derive();
    expect(result.status).toBe("implemented-not-run");
    expect(result.hasLiveRun).toBe(false);
    expect(result.hasEvidence).toBe(false);
    expect(result.lastLiveAt).toBeNull();
    expect(result.label).not.toMatch(/captured evidence/i);
  });

  it("does not claim live-with-evidence for a LIVE run without captured evidence", () => {
    const createdAt = "2026-11-14T10:15:00.000Z";
    const result = derive({ runs: [makeRun({ mode: "LIVE", createdAt })], configured: true });
    expect(result.status).toBe("implemented-not-run");
    expect(result.status).not.toBe("live-with-evidence");
    expect(result.hasLiveRun).toBe(true);
    expect(result.hasEvidence).toBe(false);
    expect(result.lastLiveAt).toBe(createdAt);
  });

  it("reports live-with-evidence only when a LIVE run and an evidence entry both exist", () => {
    const createdAt = "2026-11-14T10:15:00.000Z";
    const result = derive({
      runs: [makeRun({ mode: "LIVE", createdAt })],
      evidence: [makeEvidence()],
      configured: true,
    });
    expect(result.status).toBe("live-with-evidence");
    expect(result.hasLiveRun).toBe(true);
    expect(result.hasEvidence).toBe(true);
    expect(result.lastLiveAt).toBe(createdAt);
  });

  it("reports demo-fallback when only deterministic fallback runs have happened", () => {
    const result = derive({
      runs: [makeRun({ mode: "FALLBACK" }), makeRun({ mode: "FALLBACK" })],
    });
    expect(result.status).toBe("demo-fallback");
    expect(result.hasLiveRun).toBe(false);
    expect(result.hasEvidence).toBe(false);
    expect(result.lastLiveAt).toBeNull();
    expect(result.label).toMatch(/Demo fallback/i);
  });

  it("ignores evidence captured for a different surface", () => {
    const result = derive({
      runs: [makeRun({ mode: "LIVE" })],
      evidence: [makeEvidence({ surface: "ask" })],
      configured: true,
    });
    expect(result.hasEvidence).toBe(false);
    expect(result.status).toBe("implemented-not-run");
  });

  it("uses the most recent LIVE run for lastLiveAt and ignores later fallback rows", () => {
    const result = derive({
      runs: [
        makeRun({ mode: "LIVE", createdAt: "2026-11-14T08:00:00.000Z" }),
        makeRun({ mode: "LIVE", createdAt: "2026-11-14T09:30:00.000Z" }),
        makeRun({ mode: "FALLBACK", createdAt: "2026-11-14T11:00:00.000Z" }),
      ],
      evidence: [makeEvidence()],
    });
    expect(result.lastLiveAt).toBe("2026-11-14T09:30:00.000Z");
    expect(result.status).toBe("live-with-evidence");
  });

  it("uses configuration only for the label, never for a live claim", () => {
    const unconfigured = derive({ configured: false });
    const configured = derive({ configured: true });
    expect(unconfigured.status).toBe("implemented-not-run");
    expect(configured.status).toBe("implemented-not-run");
    expect(unconfigured.label).toMatch(/not configured/i);
    expect(configured.label).toMatch(/configured/i);
    expect(configured.label).not.toMatch(/captured evidence/i);
  });
});
