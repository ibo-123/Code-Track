import { mockProvider } from "./mockProvider.js";
import { geminiProvider } from "./geminiProvider.js";
import { REVIEW_TYPE_VALUES } from "./provider.js";

/**
 * Resolve the active AI review provider from env.
 * AI_PROVIDER=gemini|mock (default: gemini when GEMINI_API_KEY is set, else mock)
 */
export const getActiveProvider = () => {
  const preferred = String(process.env.AI_PROVIDER || "")
    .trim()
    .toLowerCase();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  if (preferred === "mock") return mockProvider;
  if (preferred === "gemini" || (!preferred && hasGemini)) {
    if (!hasGemini) return mockProvider;
    return geminiProvider;
  }
  return hasGemini ? geminiProvider : mockProvider;
};

export { REVIEW_TYPE_VALUES, mockProvider, geminiProvider };
