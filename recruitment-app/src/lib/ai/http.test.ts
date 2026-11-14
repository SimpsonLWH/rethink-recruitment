import { afterEach, describe, expect, it, vi } from "vitest";
import { postJsonWithRetry } from "./http";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AI HTTP retry policy", () => {
  it("retries a 429 and succeeds on the next attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "rate limited" }), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await postJsonWithRetry("https://example.com/v1", {
      headers: { "content-type": "application/json" },
      body: { hello: "world" },
      attempts: 3,
      timeoutMs: 1000,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ ok: true });
  });

  it("gives up after the configured attempts", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify({}), { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      postJsonWithRetry("https://example.com/v1", {
        headers: { "content-type": "application/json" },
        body: {},
        attempts: 2,
        timeoutMs: 1000,
      }),
    ).rejects.toThrow(/status 503/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
