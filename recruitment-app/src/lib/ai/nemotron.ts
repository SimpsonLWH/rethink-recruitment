import { NEMOTRON_BASE_URL, NEMOTRON_MODEL } from "./config";
import { AiRequestError, postJsonWithRetry } from "./http";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callNemotron(
  messages: ChatMessage[],
  options: { maxTokens?: number } = {},
): Promise<{ text: string; latencyMs: number; model: string }> {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) throw new AiRequestError("NVIDIA_API_KEY is not configured.", 0, false);

  const { data, latencyMs } = await postJsonWithRetry(
    NEMOTRON_BASE_URL + "/chat/completions",
    {
      headers: {
        authorization: "Bearer " + key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: {
        model: NEMOTRON_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: options.maxTokens ?? 800,
        stream: false,
      },
      attempts: 3,
      timeoutMs: 20_000,
    },
  );

  const payload = data as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = payload.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new AiRequestError("Nemotron returned an empty response.", 0, true);
  }
  return { text, latencyMs, model: NEMOTRON_MODEL };
}
