import axios from "axios";
import {
  AI_ERROR,
  CONTRACT_VERSION,
  REVIEW_TYPES,
  REVIEW_TYPE_VALUES,
  assertReviewResult,
  providerError,
  validateReviewRequest,
} from "./provider.js";

export const GEMINI_PROVIDER_ID = "gemini";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_MODEL = "gemini-flash-lite-latest";
const DEFAULT_TIMEOUT_MS = 60_000;

const REVIEW_TYPE_PROMPTS = Object.freeze({
  [REVIEW_TYPES.EXPLAIN]:
    "Explain what the submitted program does in plain language for a competitive programming student.",
  [REVIEW_TYPES.LINE_BY_LINE]:
    "Walk through the important parts of the program and explain how the main blocks work.",
  [REVIEW_TYPES.CORRECTNESS]:
    "Discuss likely correctness risks relative to typical problem constraints. Do not claim the program is correct or incorrect as a fact.",
  [REVIEW_TYPES.COMPLEXITY]:
    "Discuss plausible time and auxiliary space complexity with assumptions. Mark uncertainty clearly.",
  [REVIEW_TYPES.OPTIMIZATION]:
    "Suggest concrete optimizations when defensible, including trade-offs and preconditions.",
  [REVIEW_TYPES.EDGE_CASES]:
    "List edge cases and adversarial inputs worth considering. Do not claim they were executed.",
});

const SYSTEM_RULES = `You are CodeTrack's static code-review assistant for competitive programming.

Hard rules:
- You never execute, run, compile, or verify the submitted program.
- You never claim the solution is proven correct or incorrect.
- Base comments only on the provided source and optional analysis context.
- Return ONLY valid JSON matching the schema below. No markdown fences.

JSON schema:
{
  "summary": "string, <= 400 words",
  "comments": [
    {
      "topic": "short label",
      "body": "helpful explanation",
      "severity": "info|warning|error",
      "confidence": 0.0
    }
  ],
  "limitations": [
    "must include that the code was not executed, tested, or verified"
  ]
}

Keep comments to at most 8 items. Be specific to the submitted code.`;

const extractJsonObject = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
};

const buildPrompt = (request) => {
  const parts = [
    SYSTEM_RULES,
    "",
    `Review type: ${request.reviewType}`,
    `Instruction: ${REVIEW_TYPE_PROMPTS[request.reviewType]}`,
    `Programming language: ${request.programmingLanguage || "unknown"}`,
    `Problem title: ${request.problemTitle || "unknown"}`,
  ];

  if (request.problemStatement) {
    parts.push("", "Problem statement:", request.problemStatement.slice(0, 8000));
  }

  if (request.analysisContext) {
    parts.push(
      "",
      "Static analysis context (heuristic, may be wrong):",
      JSON.stringify(request.analysisContext).slice(0, 12000)
    );
  }

  parts.push("", "Submitted source code:", request.sourceCode);
  return parts.join("\n");
};

const callGemini = async (prompt, { model, apiKey, timeoutMs }) => {
  const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`;
  try {
    const response = await axios.post(
      url,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      },
      {
        timeout: timeoutMs,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
      }
    );

    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    if (!text) {
      throw providerError(
        "Gemini returned an empty review",
        AI_ERROR.INVALID_RESULT,
        502
      );
    }
    return text;
  } catch (error) {
    if (error.name === "AiProviderError") throw error;
    const status = error.response?.status || 502;
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Gemini request failed";
    throw providerError(message, AI_ERROR.INVALID_RESULT, status >= 400 ? status : 502);
  }
};

const mapModelJsonToReview = (parsed, request) => {
  const comments = Array.isArray(parsed?.comments)
    ? parsed.comments
        .filter((c) => c && typeof c === "object")
        .slice(0, 8)
        .map((c) => ({
          topic: String(c.topic || "note").slice(0, 80),
          body: String(c.body || "").slice(0, 4000),
          ...(c.severity ? { severity: String(c.severity) } : {}),
          ...(typeof c.confidence === "number"
            ? { confidence: c.confidence }
            : {}),
        }))
        .filter((c) => c.body.trim().length > 0)
    : [];

  if (comments.length === 0) {
    comments.push({
      topic: "review",
      body: String(parsed?.summary || "The model returned a brief review without structured comments."),
      severity: "info",
      confidence: 0.4,
    });
  }

  let limitations = Array.isArray(parsed?.limitations)
    ? parsed.limitations.map((l) => String(l)).filter(Boolean)
    : [];
  const join = limitations.join("\n");
  if (!/not executed, tested, or verified/i.test(join)) {
    limitations = [
      ...limitations,
      "This AI review is static only — the submitted code was not executed, tested, or verified.",
    ];
  }

  return {
    contractVersion: CONTRACT_VERSION,
    providerId: GEMINI_PROVIDER_ID,
    mock: false,
    deterministic: false,
    generatedByModel: true,
    executed: false,
    verified: false,
    reviewType: request.reviewType,
    programmingLanguage: request.programmingLanguage,
    problemTitle: request.problemTitle,
    summary: String(parsed?.summary || "AI code review completed.").slice(0, 2000),
    comments,
    limitations: limitations.slice(0, 12),
    sourceBytes: request.sourceBytes,
    hasProblemStatement: request.problemStatement != null,
    hasAnalysisContext: request.analysisContext != null,
  };
};

/**
 * @param {object} input
 * @param {object} [options]
 */
export const generateCodeReview = async (input, options) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw providerError(
        "GEMINI_API_KEY is not configured",
        AI_ERROR.CREDENTIALS_NOT_ACCEPTED,
        503
      );
    }

    const request = validateReviewRequest(input, options);
    const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
    const timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;
    const prompt = buildPrompt(request);
    const rawText = await callGemini(prompt, { model, apiKey, timeoutMs });
    const parsed = extractJsonObject(rawText);
    if (!parsed) {
      throw providerError(
        "Gemini returned non-JSON review output",
        AI_ERROR.INVALID_RESULT,
        502
      );
    }
    return assertReviewResult(mapModelJsonToReview(parsed, request), request);
  } catch (error) {
    if (error?.name === "AiProviderError") throw error;
    throw providerError(
      "AI code review could not be completed",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }
};

export const geminiProvider = Object.freeze({
  id: GEMINI_PROVIDER_ID,
  supportedReviewTypes: REVIEW_TYPE_VALUES,
  generateCodeReview,
});
