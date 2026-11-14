export function parseModelJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model output did not contain a JSON object.");
  const candidate = cleaned.slice(start, end + 1);
  return JSON.parse(candidate) as unknown;
}
