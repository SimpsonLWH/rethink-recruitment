export const NEMOTRON_MODEL = "nvidia/nemotron-3.5-super-vl-120b-a12b";
export const NEMOTRON_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function isNvidiaConfigured() {
  return Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim().length > 0);
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export function isModalConfigured() {
  return Boolean(
    process.env.MODAL_TOKEN_ID?.trim().length && process.env.MODAL_TOKEN_SECRET?.trim().length,
  );
}

export function geminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}
