import { geminiModel } from "./config";
import { AiRequestError, postJsonWithRetry } from "./http";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGemini(
  messages: ChatMessage[],
  options: { maxTokens?: number } = {},
): Promise<{ text: string; latencyMs: number; model: string }> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new AiRequestError("GEMINI_API_KEY is not configured.", 0, false);
  const model = geminiModel();
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(key);

  const { data, latencyMs } = await postJsonWithRetry(endpoint, {
    headers: { "content-type": "application/json" },
    body: {
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: options.maxTokens ?? 800,
        responseMimeType: "application/json",
      },
    },
    attempts: 3,
    timeoutMs: 20_000,
  });

  const payload = data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new AiRequestError("Gemini returned an empty response.", 0, true);
  return { text, latencyMs, model };
}
