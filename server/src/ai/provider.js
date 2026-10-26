import { MAX_SOURCE_BYTES } from "../analysis/version.js";

/**
 * Phase 4 provider contract (plain JavaScript).
 *
 * A provider is an object with:
 *
 *   generateCodeReview(input, options) => Promise<CodeReview>
 *
 * `validateReviewRequest` and `assertReviewResult` are the shared checks.
 * Passing them means the value has a safe shape and size. It does not mean
 * the review is correct, complete, or produced by a trustworthy model.
 *
 * Request policy:
 *   - `sourceCode` is required. Blank-after-trim is missing. The original
 *     string is kept as-is, including leading and trailing whitespace.
 *     Size uses UTF-8 bytes (`Buffer.byteLength`), shared with Phase 3
 *     `MAX_SOURCE_BYTES`.
 *   - `reviewType` must be one of the six supported types, exact match.
 *   - Optional `programmingLanguage`, `problemTitle`, and `problemStatement`
 *     must be strings. They are trimmed; a blank value becomes null.
 *     Limits are UTF-8 bytes.
 *   - Optional `analysisContext` must be a JSON-safe plain object. The
 *     request stores a deep clone, not the caller's object. Cycles, custom
 *     prototypes, functions, dates, and oversized trees are rejected.
 *   - Unknown input properties are rejected. Credential-like names are
 *     rejected without copying their values into the error.
 *   - `options` allows only `timeoutMs` (integer milliseconds, 1..120000).
 *     Any other option name is rejected. `null` options mean {}.
 *
 * Result policy:
 *   - Every provider returns the same allowlisted fields below.
 *   - `executed` and `verified` must be the boolean `false`.
 *   - Optional comment `severity` (`info` | `warning` | `error`) and
 *     `confidence` (0..1) are checked when present. The mock omits them.
 *   - Source-bearing properties (`sourceCode`, `source`, `code`,
 *     `submissionSource`) are rejected. When the request is available, a
 *     long source string must not be copied into the text fields.
 *   - Unknown result properties are rejected. Model JSON is untrusted.
 *
 * Errors are `AiProviderError` (`error.name`) with `.code` and `.status`.
 * Unexpected throws become a fixed message so a getter cannot leak a secret
 * through `error.message`.
 */

export { MAX_SOURCE_BYTES };

export const CONTRACT_VERSION = "1";

export const REVIEW_TYPES = Object.freeze({
  EXPLAIN: "explain",
  LINE_BY_LINE: "line_by_line",
  CORRECTNESS: "correctness",
  COMPLEXITY: "complexity",
  OPTIMIZATION: "optimization",
  EDGE_CASES: "edge_cases",
});

export const REVIEW_TYPE_VALUES = Object.freeze(Object.values(REVIEW_TYPES));

export const REVIEW_LIMITS = Object.freeze({
  LANGUAGE_BYTES: 80,
  TITLE_BYTES: 300,
  STATEMENT_BYTES: 50_000,
  ANALYSIS_CONTEXT_BYTES: 100_000,
  ANALYSIS_MAX_DEPTH: 12,
  ANALYSIS_MAX_NODES: 2_000,
  ANALYSIS_MAX_KEYS: 40,
  ANALYSIS_MAX_ARRAY: 500,
  ANALYSIS_MAX_STRING_BYTES: 20_000,
  TIMEOUT_MS_MIN: 1,
  TIMEOUT_MS_MAX: 120_000,
  SUMMARY_BYTES: 2_000,
  COMMENT_TOPIC_BYTES: 80,
  COMMENT_BODY_BYTES: 4_000,
  MAX_COMMENTS: 30,
  LIMITATION_BYTES: 500,
  MAX_LIMITATIONS: 12,
  SOURCE_ECHO_MIN_BYTES: 16,
});

export const REVIEW_INPUT_FIELDS = Object.freeze([
  "sourceCode",
  "programmingLanguage",
  "reviewType",
  "problemTitle",
  "problemStatement",
  "analysisContext",
]);

export const REVIEW_OPTION_FIELDS = Object.freeze(["timeoutMs"]);

export const REVIEW_RESULT_FIELDS = Object.freeze([
  "contractVersion",
  "providerId",
  "mock",
  "deterministic",
  "generatedByModel",
  "executed",
  "verified",
  "reviewType",
  "programmingLanguage",
  "problemTitle",
  "summary",
  "comments",
  "limitations",
  "sourceBytes",
  "hasProblemStatement",
  "hasAnalysisContext",
]);

export const COMMENT_SEVERITY_VALUES = Object.freeze([
  "info",
  "warning",
  "error",
]);

export const AI_ERROR = Object.freeze({
  INVALID_INPUT: "INVALID_INPUT",
  SOURCE_MISSING: "SOURCE_MISSING",
  SOURCE_TOO_LARGE: "SOURCE_TOO_LARGE",
  UNSUPPORTED_REVIEW_TYPE: "UNSUPPORTED_REVIEW_TYPE",
  CREDENTIALS_NOT_ACCEPTED: "CREDENTIALS_NOT_ACCEPTED",
  INVALID_RESULT: "INVALID_RESULT",
});

const REVIEW_TYPE_SET = new Set(REVIEW_TYPE_VALUES);
const INPUT_FIELDS = new Set(REVIEW_INPUT_FIELDS);
const OPTION_FIELDS = new Set(REVIEW_OPTION_FIELDS);
const RESULT_FIELDS = new Set(REVIEW_RESULT_FIELDS);
const COMMENT_FIELDS = new Set(["topic", "body", "severity", "confidence"]);
const SEVERITY_SET = new Set(COMMENT_SEVERITY_VALUES);
const SOURCE_FIELDS = new Set([
  "sourceCode",
  "source",
  "code",
  "submissionSource",
]);
const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const CREDENTIAL_KEY =
  /api[-_]?key|secret|token|password|authorization|credential/i;
const SAFE_KEY = /^[A-Za-z][A-Za-z0-9_]{0,40}$/;
const PROVIDER_ID_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;
const LIMITATIONS_MUST_ADMIT = /not executed, tested, or verified/i;
const ERROR_BRAND = Symbol("codetrack.ai.providerError");

/**
 * Match the error objects used by the analysis service: Error + code + status.
 */
export const providerError = (message, code, status = 400) => {
  const error = new Error(message);
  error.name = "AiProviderError";
  error.code = code;
  error.status = status;
  Object.defineProperty(error, ERROR_BRAND, { value: true });
  return error;
};

const isProviderError = (error) => Boolean(error && error[ERROR_BRAND]);

/**
 * Run `fn`. Known provider errors pass through. Any other throw becomes a
 * fixed AiProviderError so the original message cannot leak.
 */
export const guardProviderCall = (fn, message, code, status = 500) => {
  try {
    return fn();
  } catch (error) {
    if (isProviderError(error)) throw error;
    throw providerError(message, code, status);
  }
};

const isPlainObject = (value) => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const utf8Bytes = (value) => Buffer.byteLength(value, "utf8");

const keyIsSafeToName = (key) =>
  SAFE_KEY.test(key) && !CREDENTIAL_KEY.test(key) && !DANGEROUS_KEYS.has(key);

const rejectUnknown = (label, key, code, status = 400) => {
  throw providerError(
    keyIsSafeToName(key)
      ? `${label} contains an unsupported property: ${key}`
      : `${label} contains an unsupported property`,
    code,
    status
  );
};

const assertKnownKeys = (value, allowed, label, code, status = 400) => {
  const keys = Object.keys(value);
  for (const key of keys) {
    if (CREDENTIAL_KEY.test(key)) {
      throw providerError(
        `${label} must not include credentials`,
        AI_ERROR.CREDENTIALS_NOT_ACCEPTED,
        400
      );
    }
  }
  if (keys.length > allowed.size) {
    throw providerError(
      `${label} contains an unsupported property`,
      code,
      status
    );
  }
  for (const key of keys) {
    if (DANGEROUS_KEYS.has(key) || !allowed.has(key)) {
      rejectUnknown(label, key, code, status);
    }
  }
};

const optionalText = (value, field, maxBytes) => {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw providerError(`${field} must be a string`, AI_ERROR.INVALID_INPUT);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (utf8Bytes(trimmed) > maxBytes) {
    throw providerError(
      `${field} exceeds ${maxBytes} bytes`,
      AI_ERROR.INVALID_INPUT
    );
  }
  return trimmed;
};

const sanitizeContext = (root) => {
  let nodes = 0;
  let usedBytes = 0;

  const fail = (message, code = AI_ERROR.INVALID_INPUT) => {
    throw providerError(message, code);
  };

  const account = (bytes) => {
    usedBytes += bytes;
    if (usedBytes > REVIEW_LIMITS.ANALYSIS_CONTEXT_BYTES) {
      fail(
        `analysisContext exceeds ${REVIEW_LIMITS.ANALYSIS_CONTEXT_BYTES} bytes`
      );
    }
  };

  const walk = (value, depth, stack) => {
    nodes += 1;
    if (nodes > REVIEW_LIMITS.ANALYSIS_MAX_NODES) {
      fail("analysisContext is too large");
    }

    if (value === null) return null;

    const type = typeof value;
    if (type === "string") {
      const bytes = utf8Bytes(value);
      if (bytes > REVIEW_LIMITS.ANALYSIS_MAX_STRING_BYTES) {
        fail("analysisContext contains a string that is too long");
      }
      account(bytes);
      return value;
    }
    if (type === "number") {
      if (!Number.isFinite(value)) {
        fail("analysisContext contains a value that cannot be stored");
      }
      return value;
    }
    if (type === "boolean") return value;
    if (type !== "object") {
      fail("analysisContext contains a value that cannot be stored");
    }

    if (stack.has(value)) {
      fail("analysisContext contains a circular reference");
    }
    if (depth >= REVIEW_LIMITS.ANALYSIS_MAX_DEPTH) {
      fail("analysisContext is too deeply nested");
    }

    stack.add(value);
    try {
      if (Array.isArray(value)) {
        if (value.length > REVIEW_LIMITS.ANALYSIS_MAX_ARRAY) {
          fail("analysisContext contains an array that is too long");
        }
        const clone = [];
        for (let index = 0; index < value.length; index += 1) {
          if (!Object.prototype.hasOwnProperty.call(value, index)) {
            fail("analysisContext contains an array with a missing entry");
          }
          clone.push(walk(value[index], depth + 1, stack));
        }
        return clone;
      }

      if (!isPlainObject(value)) {
        fail("analysisContext contains a value that cannot be stored");
      }
      if (Object.getOwnPropertySymbols(value).length > 0) {
        fail("analysisContext contains a value that cannot be stored");
      }

      const keys = Object.keys(value);
      if (keys.length > REVIEW_LIMITS.ANALYSIS_MAX_KEYS) {
        fail("analysisContext contains an object with too many properties");
      }

      const clone = {};
      for (const key of keys) {
        if (CREDENTIAL_KEY.test(key)) {
          fail(
            "analysisContext must not include credentials",
            AI_ERROR.CREDENTIALS_NOT_ACCEPTED
          );
        }
        if (DANGEROUS_KEYS.has(key) || !keyIsSafeToName(key)) {
          fail("analysisContext contains an unsupported property");
        }
        Object.defineProperty(clone, key, {
          value: walk(value[key], depth + 1, stack),
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      return clone;
    } finally {
      stack.delete(value);
    }
  };

  const clone = walk(root, 0, new Set());
  let serializedBytes = 0;
  try {
    serializedBytes = utf8Bytes(JSON.stringify(clone));
  } catch {
    fail("analysisContext contains a value that cannot be stored");
  }
  if (serializedBytes > REVIEW_LIMITS.ANALYSIS_CONTEXT_BYTES) {
    fail(
      `analysisContext exceeds ${REVIEW_LIMITS.ANALYSIS_CONTEXT_BYTES} bytes`
    );
  }
  return clone;
};

const validateReviewRequestInner = (input, options) => {
  if (!isPlainObject(input)) {
    throw providerError(
      "Review input must be an object",
      AI_ERROR.INVALID_INPUT
    );
  }

  assertKnownKeys(input, INPUT_FIELDS, "Review input", AI_ERROR.INVALID_INPUT);

  if (typeof input.sourceCode !== "string" || input.sourceCode.trim() === "") {
    throw providerError("Source code is required", AI_ERROR.SOURCE_MISSING);
  }

  const sourceBytes = utf8Bytes(input.sourceCode);
  if (sourceBytes > MAX_SOURCE_BYTES) {
    throw providerError(
      `Source exceeds ${MAX_SOURCE_BYTES} byte limit`,
      AI_ERROR.SOURCE_TOO_LARGE,
      413
    );
  }

  if (
    typeof input.reviewType !== "string" ||
    !REVIEW_TYPE_SET.has(input.reviewType)
  ) {
    throw providerError(
      `Unsupported review type. Allowed: ${REVIEW_TYPE_VALUES.join(", ")}`,
      AI_ERROR.UNSUPPORTED_REVIEW_TYPE
    );
  }

  let analysisContext = null;
  if (input.analysisContext != null) {
    if (!isPlainObject(input.analysisContext)) {
      throw providerError(
        "analysisContext must be a plain object",
        AI_ERROR.INVALID_INPUT
      );
    }
    analysisContext = sanitizeContext(input.analysisContext);
  }

  return {
    sourceCode: input.sourceCode,
    sourceBytes,
    programmingLanguage: optionalText(
      input.programmingLanguage,
      "programmingLanguage",
      REVIEW_LIMITS.LANGUAGE_BYTES
    ),
    reviewType: input.reviewType,
    problemTitle: optionalText(
      input.problemTitle,
      "problemTitle",
      REVIEW_LIMITS.TITLE_BYTES
    ),
    problemStatement: optionalText(
      input.problemStatement,
      "problemStatement",
      REVIEW_LIMITS.STATEMENT_BYTES
    ),
    analysisContext,
    options: validateOptions(options),
  };
};

/**
 * Validate a review request and return a normalized copy.
 * Thrown messages do not include source text or credential values.
 *
 * @param {object} input
 * @param {object} [options]
 */
export const validateReviewRequest = (input, options) =>
  guardProviderCall(
    () => validateReviewRequestInner(input, options),
    "Review input could not be validated",
    AI_ERROR.INVALID_INPUT,
    400
  );

/**
 * Options carry execution settings for a future provider.
 * Only `timeoutMs` is accepted. Credential-like names are rejected
 * without reading their values.
 */
export const validateOptions = (options) =>
  guardProviderCall(
    () => {
      if (options == null) return {};
      if (!isPlainObject(options)) {
        throw providerError(
          "Review options must be an object",
          AI_ERROR.INVALID_INPUT
        );
      }

      assertKnownKeys(
        options,
        OPTION_FIELDS,
        "Review options",
        AI_ERROR.INVALID_INPUT
      );

      if (options.timeoutMs == null) return {};

      const timeoutMs = options.timeoutMs;
      if (
        !Number.isSafeInteger(timeoutMs) ||
        timeoutMs < REVIEW_LIMITS.TIMEOUT_MS_MIN ||
        timeoutMs > REVIEW_LIMITS.TIMEOUT_MS_MAX
      ) {
        throw providerError(
          `timeoutMs must be an integer from ${REVIEW_LIMITS.TIMEOUT_MS_MIN} to ${REVIEW_LIMITS.TIMEOUT_MS_MAX}`,
          AI_ERROR.INVALID_INPUT
        );
      }

      return { timeoutMs };
    },
    "Review options could not be validated",
    AI_ERROR.INVALID_INPUT,
    400
  );

const boundedText = (value, field, maxBytes) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw providerError(
      `Review result is missing ${field}`,
      AI_ERROR.INVALID_RESULT,
      500
    );
  }
  if (utf8Bytes(value) > maxBytes) {
    throw providerError(
      `Review result field ${field} is too long`,
      AI_ERROR.INVALID_RESULT,
      500
    );
  }
  return value;
};

const sanitizeComment = (comment, index) => {
  if (!isPlainObject(comment)) {
    throw providerError(
      "Each review comment must be an object",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  const keys = Object.keys(comment);
  for (const key of keys) {
    if (SOURCE_FIELDS.has(key)) {
      throw providerError(
        "Review result must not echo source code",
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
    if (CREDENTIAL_KEY.test(key) || DANGEROUS_KEYS.has(key)) {
      throw providerError(
        "Review result must not include credentials",
        AI_ERROR.CREDENTIALS_NOT_ACCEPTED,
        400
      );
    }
    if (!COMMENT_FIELDS.has(key)) {
      rejectUnknown(
        "Review comment",
        key,
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
  }

  const sanitized = {
    topic: boundedText(
      comment.topic,
      `comments[${index}].topic`,
      REVIEW_LIMITS.COMMENT_TOPIC_BYTES
    ),
    body: boundedText(
      comment.body,
      `comments[${index}].body`,
      REVIEW_LIMITS.COMMENT_BODY_BYTES
    ),
  };

  if (Object.hasOwn(comment, "severity")) {
    if (!SEVERITY_SET.has(comment.severity)) {
      throw providerError(
        "Review comment severity must be info, warning, or error",
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
    sanitized.severity = comment.severity;
  }

  if (Object.hasOwn(comment, "confidence")) {
    const confidence = comment.confidence;
    if (
      typeof confidence !== "number" ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1
    ) {
      throw providerError(
        "Review comment confidence must be a number from 0 to 1",
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
    sanitized.confidence = confidence;
  }

  return sanitized;
};

const collectStrings = (value, out) => {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) collectStrings(value[key], out);
  }
};

const assertNoSourceEcho = (sanitized, sourceCode) => {
  if (typeof sourceCode !== "string" || sourceCode.length === 0) return;
  const sourceBytes = utf8Bytes(sourceCode);
  const texts = [];
  collectStrings(sanitized, texts);
  for (const text of texts) {
    const exact = text === sourceCode;
    const copied =
      sourceBytes >= REVIEW_LIMITS.SOURCE_ECHO_MIN_BYTES &&
      text.includes(sourceCode);
    if (exact || copied) {
      throw providerError(
        "Review result must not echo source code",
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
  }
};

const nullableEcho = (value, field, maxBytes) => {
  if (value == null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    throw providerError(
      `Review result field ${field} must be a string or null`,
      AI_ERROR.INVALID_RESULT,
      500
    );
  }
  if (utf8Bytes(value) > maxBytes) {
    throw providerError(
      `Review result field ${field} is too long`,
      AI_ERROR.INVALID_RESULT,
      500
    );
  }
  return value;
};

const assertReviewResultInner = (result, request) => {
  if (!isPlainObject(result)) {
    throw providerError(
      "Review result must be an object",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  const keys = Object.keys(result);
  for (const key of keys) {
    if (SOURCE_FIELDS.has(key)) {
      throw providerError(
        "Review result must not echo source code",
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
  }
  assertKnownKeys(
    result,
    RESULT_FIELDS,
    "Review result",
    AI_ERROR.INVALID_RESULT,
    500
  );

  for (const field of RESULT_FIELDS) {
    if (!Object.hasOwn(result, field)) {
      throw providerError(
        `Review result is missing ${field}`,
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
  }

  if (result.contractVersion !== CONTRACT_VERSION) {
    throw providerError(
      "Review result has an unexpected contract version",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (
    typeof result.providerId !== "string" ||
    !PROVIDER_ID_PATTERN.test(result.providerId) ||
    CREDENTIAL_KEY.test(result.providerId)
  ) {
    throw providerError(
      "Review result has an invalid providerId",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (
    typeof result.mock !== "boolean" ||
    typeof result.deterministic !== "boolean"
  ) {
    throw providerError(
      "Review result must set mock and deterministic flags",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (typeof result.generatedByModel !== "boolean") {
    throw providerError(
      "Review result must set generatedByModel",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (typeof result.executed !== "boolean" || typeof result.verified !== "boolean") {
    throw providerError(
      "Review result must set executed and verified to booleans",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (result.executed !== false || result.verified !== false) {
    throw providerError(
      "A review must not claim the code was executed or verified",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (!REVIEW_TYPE_SET.has(result.reviewType)) {
    throw providerError(
      "Review result has an unsupported reviewType",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (!Array.isArray(result.comments) || result.comments.length === 0) {
    throw providerError(
      "Review result must include comments",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }
  if (result.comments.length > REVIEW_LIMITS.MAX_COMMENTS) {
    throw providerError(
      "Review result has too many comments",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (!Array.isArray(result.limitations) || result.limitations.length === 0) {
    throw providerError(
      "Review result must include limitations",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }
  if (result.limitations.length > REVIEW_LIMITS.MAX_LIMITATIONS) {
    throw providerError(
      "Review result has too many limitations",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  const limitations = result.limitations.map((item, index) => {
    if (typeof item !== "string") {
      throw providerError(
        "Each review limitation must be a string",
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
    return boundedText(
      item,
      `limitations[${index}]`,
      REVIEW_LIMITS.LIMITATION_BYTES
    );
  });

  if (!LIMITATIONS_MUST_ADMIT.test(limitations.join("\n"))) {
    throw providerError(
      "Review limitations must state that the code was not executed, tested, or verified",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (
    !Number.isSafeInteger(result.sourceBytes) ||
    result.sourceBytes < 0 ||
    result.sourceBytes > MAX_SOURCE_BYTES
  ) {
    throw providerError(
      "Review result has an invalid sourceBytes value",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  if (
    typeof result.hasProblemStatement !== "boolean" ||
    typeof result.hasAnalysisContext !== "boolean"
  ) {
    throw providerError(
      "Review result must set hasProblemStatement and hasAnalysisContext",
      AI_ERROR.INVALID_RESULT,
      500
    );
  }

  const sanitized = {
    contractVersion: CONTRACT_VERSION,
    providerId: result.providerId,
    mock: result.mock,
    deterministic: result.deterministic,
    generatedByModel: result.generatedByModel,
    executed: false,
    verified: false,
    reviewType: result.reviewType,
    programmingLanguage: nullableEcho(
      result.programmingLanguage,
      "programmingLanguage",
      REVIEW_LIMITS.LANGUAGE_BYTES
    ),
    problemTitle: nullableEcho(
      result.problemTitle,
      "problemTitle",
      REVIEW_LIMITS.TITLE_BYTES
    ),
    summary: boundedText(result.summary, "summary", REVIEW_LIMITS.SUMMARY_BYTES),
    comments: result.comments.map((comment, index) =>
      sanitizeComment(comment, index)
    ),
    limitations,
    sourceBytes: result.sourceBytes,
    hasProblemStatement: result.hasProblemStatement,
    hasAnalysisContext: result.hasAnalysisContext,
  };

  if (request) {
    const mismatches = [
      sanitized.reviewType !== request.reviewType,
      sanitized.programmingLanguage !== request.programmingLanguage,
      sanitized.problemTitle !== request.problemTitle,
      sanitized.sourceBytes !== request.sourceBytes,
      sanitized.hasProblemStatement !== (request.problemStatement != null),
      sanitized.hasAnalysisContext !== (request.analysisContext != null),
    ];
    if (mismatches.some(Boolean)) {
      throw providerError(
        "Review result does not match the request",
        AI_ERROR.INVALID_RESULT,
        500
      );
    }
    assertNoSourceEcho(sanitized, request.sourceCode);
  }

  return sanitized;
};

/**
 * Check the object a provider returns before it leaves the service.
 * `request` is the normalized request, when the caller has one.
 * The returned object is a fresh copy of the allowlisted fields.
 */
export const assertReviewResult = (result, request) =>
  guardProviderCall(
    () => assertReviewResultInner(result, request),
    "Review result could not be validated",
    AI_ERROR.INVALID_RESULT,
    500
  );

/**
 * A provider satisfies the contract when it exposes generateCodeReview.
 */
export const assertProvider = (provider) => {
  if (!provider || typeof provider.generateCodeReview !== "function") {
    throw providerError(
      "Provider must implement generateCodeReview(input, options)",
      AI_ERROR.INVALID_INPUT
    );
  }
  return provider;
};
