/** Supported competitive programming platforms (Phase 1). */
export const PLATFORMS = Object.freeze({
  CODEFORCES: "codeforces",
  LEETCODE: "leetcode",
});

export const PLATFORM_VALUES = Object.freeze(Object.values(PLATFORMS));

/** Connection lifecycle — do not treat username_saved as authenticated. */
export const CONNECTION_STATUS = Object.freeze({
  DISCONNECTED: "disconnected",
  USERNAME_SAVED: "username_saved",
  CONNECTED: "connected",
  SYNC_ERROR: "sync_error",
  DISABLED: "disabled",
});

export const CONNECTION_STATUS_VALUES = Object.freeze(
  Object.values(CONNECTION_STATUS)
);

/**
 * Normalized verdict taxonomy used across platforms.
 * Platform-specific raw verdicts are also kept in metadata.rawVerdict.
 */
export const NORMALIZED_VERDICTS = Object.freeze({
  ACCEPTED: "ACCEPTED",
  WRONG_ANSWER: "WRONG_ANSWER",
  TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
  MEMORY_LIMIT_EXCEEDED: "MEMORY_LIMIT_EXCEEDED",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  COMPILATION_ERROR: "COMPILATION_ERROR",
  PRESENTATION_ERROR: "PRESENTATION_ERROR",
  IDLENESS_LIMIT_EXCEEDED: "IDLENESS_LIMIT_EXCEEDED",
  SECURITY_VIOLATED: "SECURITY_VIOLATED",
  CRASHED: "CRASHED",
  INPUT_PREPARATION_CRASHED: "INPUT_PREPARATION_CRASHED",
  CHALLENGED: "CHALLENGED",
  SKIPPED: "SKIPPED",
  TESTING: "TESTING",
  REJECTED: "REJECTED",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  UNKNOWN: "UNKNOWN",
});

/** Map Codeforces API verdict strings → normalized. */
export const CF_VERDICT_MAP = Object.freeze({
  OK: NORMALIZED_VERDICTS.ACCEPTED,
  WRONG_ANSWER: NORMALIZED_VERDICTS.WRONG_ANSWER,
  TIME_LIMIT_EXCEEDED: NORMALIZED_VERDICTS.TIME_LIMIT_EXCEEDED,
  MEMORY_LIMIT_EXCEEDED: NORMALIZED_VERDICTS.MEMORY_LIMIT_EXCEEDED,
  RUNTIME_ERROR: NORMALIZED_VERDICTS.RUNTIME_ERROR,
  COMPILATION_ERROR: NORMALIZED_VERDICTS.COMPILATION_ERROR,
  PRESENTATION_ERROR: NORMALIZED_VERDICTS.PRESENTATION_ERROR,
  IDLENESS_LIMIT_EXCEEDED: NORMALIZED_VERDICTS.IDLENESS_LIMIT_EXCEEDED,
  SECURITY_VIOLATED: NORMALIZED_VERDICTS.SECURITY_VIOLATED,
  CRASHED: NORMALIZED_VERDICTS.CRASHED,
  INPUT_PREPARATION_CRASHED: NORMALIZED_VERDICTS.INPUT_PREPARATION_CRASHED,
  CHALLENGED: NORMALIZED_VERDICTS.CHALLENGED,
  SKIPPED: NORMALIZED_VERDICTS.SKIPPED,
  TESTING: NORMALIZED_VERDICTS.TESTING,
  REJECTED: NORMALIZED_VERDICTS.REJECTED,
  PARTIAL: NORMALIZED_VERDICTS.PARTIAL,
  FAILED: NORMALIZED_VERDICTS.FAILED,
});

/**
 * Common programming language identifiers (normalized).
 * Platform-specific display names stay in metadata / legacy `language`.
 */
export const LANGUAGE_IDS = Object.freeze({
  CPP: "cpp",
  C: "c",
  PYTHON: "python",
  JAVA: "java",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  CSHARP: "csharp",
  GO: "go",
  RUST: "rust",
  KOTLIN: "kotlin",
  SWIFT: "swift",
  RUBY: "ruby",
  PHP: "php",
  SCALA: "scala",
  HASKELL: "haskell",
  PASCAL: "pascal",
  OTHER: "other",
});

/**
 * Source-code availability for a submission (Phase 2).
 * A submission may exist without source — that is not a sync failure.
 */
export const SOURCE_STATUS = Object.freeze({
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  NOT_IMPORTED: "not_imported",
  ACCESS_DENIED: "access_denied",
  UNSUPPORTED: "unsupported",
});

export const SOURCE_STATUS_VALUES = Object.freeze(Object.values(SOURCE_STATUS));

/** Sync job lifecycle (in-process background jobs). */
export const SYNC_JOB_STATUS = Object.freeze({
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  PARTIAL: "partial",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

export const SYNC_JOB_STATUS_VALUES = Object.freeze(
  Object.values(SYNC_JOB_STATUS)
);

export const SYNC_JOB_TYPES = Object.freeze({
  PROFILE: "profile",
  SUBMISSIONS: "submissions",
});

/** Map LeetCode statusDisplay → normalized verdict. */
export const LC_VERDICT_MAP = Object.freeze({
  ACCEPTED: NORMALIZED_VERDICTS.ACCEPTED,
  "WRONG ANSWER": NORMALIZED_VERDICTS.WRONG_ANSWER,
  "TIME LIMIT EXCEEDED": NORMALIZED_VERDICTS.TIME_LIMIT_EXCEEDED,
  "MEMORY LIMIT EXCEEDED": NORMALIZED_VERDICTS.MEMORY_LIMIT_EXCEEDED,
  "RUNTIME ERROR": NORMALIZED_VERDICTS.RUNTIME_ERROR,
  "COMPILE ERROR": NORMALIZED_VERDICTS.COMPILATION_ERROR,
  "COMPILATION ERROR": NORMALIZED_VERDICTS.COMPILATION_ERROR,
  "OUTPUT LIMIT EXCEEDED": NORMALIZED_VERDICTS.FAILED,
  "INTERNAL ERROR": NORMALIZED_VERDICTS.FAILED,
});
