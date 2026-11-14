export class AiRequestError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status = 0, retryable = false) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt: number) {
  const base = Math.min(8000, 600 * 2 ** attempt);
  return base + Math.floor(Math.random() * 500);
}

export async function postJsonWithRetry(
  url: string,
  options: {
    headers: Record<string, string>;
    body: unknown;
    attempts?: number;
    timeoutMs?: number;
  },
): Promise<{ data: unknown; latencyMs: number }> {
  const attempts = options.attempts ?? 3;
  const timeoutMs = options.timeoutMs ?? 20_000;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const started = Date.now();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(options.body),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
      const text = await response.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const error = new AiRequestError(
          "AI request failed with status " + response.status,
          response.status,
          retryable,
        );
        if (retryable && attempt < attempts - 1) {
          const retryAfter = Number(response.headers.get("retry-after"));
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            await sleep(Math.min(retryAfter * 1000, 8000));
          } else {
            await sleep(retryDelay(attempt));
          }
          continue;
        }
        throw error;
      }

      if (!data) throw new AiRequestError("AI response was not valid JSON.", response.status, true);
      return { data, latencyMs: Date.now() - started };
    } catch (error) {
      lastError = error;
      const retryable = !(error instanceof AiRequestError) || error.retryable;
      if (retryable && attempt < attempts - 1) {
        await sleep(retryDelay(attempt));
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AiRequestError("AI request failed after retries.", 0, false);
}
