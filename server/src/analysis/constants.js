export const LANGUAGE_SUPPORT = Object.freeze({
  FULL: "full",
  PARTIAL: "partial",
  UNSUPPORTED: "unsupported",
});

export const SYNTAX_STATUS = Object.freeze({
  VALID: "valid",
  INVALID: "invalid",
  UNKNOWN: "unknown",
});

export const ANALYSIS_STATUS = Object.freeze({
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  PARTIAL: "partial",
  FAILED: "failed",
});

export const ANALYSIS_STATUS_VALUES = Object.freeze(
  Object.values(ANALYSIS_STATUS)
);

export const COMPLEXITY = Object.freeze({
  O1: "O(1)",
  O_LOG_N: "O(log n)",
  O_N: "O(n)",
  O_N_LOG_N: "O(n log n)",
  O_N2: "O(n²)",
  O_N3: "O(n³)",
  O_2N: "O(2^n)",
  O_N_FACT: "O(n!)",
  UNKNOWN: "unknown",
});

export const SEVERITY = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
});

/**
 * Declared support levels for Phase 3.
 * JS uses @babel/parser (partial semantic rules).
 * Others use structural scanners — honest partial support.
 */
export const LANGUAGE_SUPPORT_MAP = Object.freeze({
  javascript: LANGUAGE_SUPPORT.PARTIAL,
  typescript: LANGUAGE_SUPPORT.PARTIAL,
  python: LANGUAGE_SUPPORT.PARTIAL,
  cpp: LANGUAGE_SUPPORT.PARTIAL,
  c: LANGUAGE_SUPPORT.PARTIAL,
  java: LANGUAGE_SUPPORT.PARTIAL,
  go: LANGUAGE_SUPPORT.PARTIAL,
});

export const SUPPORTED_ANALYSIS_LANGUAGES = Object.freeze(
  Object.keys(LANGUAGE_SUPPORT_MAP)
);
