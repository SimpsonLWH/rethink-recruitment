import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReadingInput } from "./reading-types";

const { callNemotronMock, repoMock } = vi.hoisted(() => ({
  callNemotronMock: vi.fn(),
  repoMock: {
    getCachedAi: vi.fn(),
    saveAiCache: vi.fn(),
    recordAiRun: vi.fn(),
  },
}));

vi.mock("./nemotron", () => ({
  callNemotron: callNemotronMock,
}));

vi.mock("@/lib/repo", () => ({
  getRepository: () => repoMock,
}));

const { readEvidence } = await import("./orchestrator");

const input: ReadingInput = {
  role: {
    id: "role-1",
    title: "Product Engineer",
    summary: "Build accessible public services.",
    problemNow: "The consent flow is hard to read.",
    first90: "Ship the first release.",
    skills: ["React", "Accessibility"],
  },
  candidateId: "cand-1",
  facts: [
    {
      id: "fact-a",
      prompt: "A project I am proud of",
      claim: "I rebuilt the returns flow and made the interface more accessible.",
      skills: ["React", "Accessibility"],
      hasEvidenceLink: true,
    },
  ],
  requirements: [
    {
      id: "assessment:js",
      kind: "ASSESSMENT",
      label: "JavaScript · v1 · medium",
      status: "met",
      detail: "Recorded 70 against a stated bar of 70.",
      factIds: [],
      requiredScore: 70,
      recordedScore: 70,
    },
    {
      id: "signal:react",
      kind: "SIGNAL",
      label: "React",
      status: "met",
      detail: "React is stated directly in the source fact.",
      factIds: ["fact-a"],
    },
  ],
};

const validReading = {
  summary: "The record shows the assessment and React evidence. Both stated requirements are covered.",
  covered: [
    {
      requirementId: "assessment:js",
      note: "Recorded 70 against a stated bar of 70.",
      factIds: [],
      quote: null,
    },
    {
      requirementId: "signal:react",
      note: "React is stated directly in the source fact.",
      factIds: ["fact-a"],
      quote: "made the interface more accessible",
    },
  ],
  gaps: [],
  questions: ["Ask for a concrete example of the accessibility work."],
  caveats: ["Advisory reading only."],
};

describe("readEvidence orchestration", () => {
  beforeEach(() => {
    process.env.NVIDIA_API_KEY = "test-key";
    callNemotronMock.mockReset();
    repoMock.getCachedAi.mockReset().mockResolvedValue(null);
    repoMock.saveAiCache.mockReset().mockResolvedValue(undefined);
    repoMock.recordAiRun.mockReset().mockResolvedValue(undefined);
  });

  afterAll(() => {
    delete process.env.NVIDIA_API_KEY;
  });

  it("records a live reading and caches the validated output", async () => {
    callNemotronMock.mockResolvedValue({
      text: JSON.stringify(validReading),
      latencyMs: 12,
      model: "nvidia/test-model",
      usage: { totalTokens: 42 },
    });

    const result = await readEvidence(input);

    expect(result.engine).toBe("nemotron-live");
    expect(result.mode).toBe("LIVE");
    expect(result.reading.covered).toHaveLength(2);
    expect(result.latencyMs).toBe(12);
    expect(repoMock.saveAiCache).toHaveBeenCalledTimes(1);
    expect(repoMock.recordAiRun).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "reading", mode: "LIVE", status: "ok" }),
    );
  });

  it("uses the cache without calling the provider", async () => {
    repoMock.getCachedAi.mockResolvedValue(JSON.stringify(validReading));

    const result = await readEvidence(input);

    expect(result.engine).toBe("nemotron-cache");
    expect(result.mode).toBe("LIVE");
    expect(callNemotronMock).not.toHaveBeenCalled();
  });

  it("falls back after invalid output and one repair", async () => {
    callNemotronMock.mockResolvedValue({
      text: "not json",
      latencyMs: 3,
      model: "nvidia/test-model",
    });

    const result = await readEvidence(input);

    expect(result.engine).toBe("fallback");
    expect(result.mode).toBe("FALLBACK");
    expect(result.fallbackReason).toBe("invalid_output");
    expect(callNemotronMock).toHaveBeenCalledTimes(2);
    expect(repoMock.saveAiCache).not.toHaveBeenCalled();
    expect(repoMock.recordAiRun).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "reading", mode: "FALLBACK" }),
    );
  });

  it("does not call the provider without a key", async () => {
    delete process.env.NVIDIA_API_KEY;

    const result = await readEvidence(input);

    expect(result.engine).toBe("fallback");
    expect(result.fallbackReason).toBe("no_key");
    expect(callNemotronMock).not.toHaveBeenCalled();
  });
});
