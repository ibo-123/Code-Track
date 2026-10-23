import crypto from "crypto";
import {
  CF_VERDICT_MAP,
  LANGUAGE_IDS,
  NORMALIZED_VERDICTS,
  PLATFORMS,
} from "../constants/platforms.js";

export const hashSourceContent = (sourceCode) => {
  if (sourceCode == null || sourceCode === "") return null;
  return crypto.createHash("sha256").update(String(sourceCode), "utf8").digest("hex");
};

export const normalizePlatform = (platform) => {
  if (!platform || typeof platform !== "string") return null;
  return platform.trim().toLowerCase();
};

/**
 * Map a CF / free-text language string to a stable language id.
 */
export const normalizeLanguage = (raw) => {
  if (!raw || typeof raw !== "string") return LANGUAGE_IDS.OTHER;
  const s = raw.toLowerCase();

  if (s.includes("c++") || s.includes("g++") || s.includes("clang++") || s === "cpp") {
    return LANGUAGE_IDS.CPP;
  }
  if (/\bc\b/.test(s) && !s.includes("c++") && !s.includes("c#")) {
    return LANGUAGE_IDS.C;
  }
  if (s.includes("python") || s.includes("pypy")) return LANGUAGE_IDS.PYTHON;
  if (s.includes("java") && !s.includes("javascript")) return LANGUAGE_IDS.JAVA;
  if (s.includes("javascript") || s.includes("node") || s === "js") {
    return LANGUAGE_IDS.JAVASCRIPT;
  }
  if (s.includes("typescript") || s === "ts") return LANGUAGE_IDS.TYPESCRIPT;
  if (s.includes("c#") || s.includes("csharp")) return LANGUAGE_IDS.CSHARP;
  if (s.includes("golang") || s === "go") return LANGUAGE_IDS.GO;
  if (s.includes("rust")) return LANGUAGE_IDS.RUST;
  if (s.includes("kotlin")) return LANGUAGE_IDS.KOTLIN;
  if (s.includes("swift")) return LANGUAGE_IDS.SWIFT;
  if (s.includes("ruby")) return LANGUAGE_IDS.RUBY;
  if (s.includes("php")) return LANGUAGE_IDS.PHP;
  if (s.includes("scala")) return LANGUAGE_IDS.SCALA;
  if (s.includes("haskell")) return LANGUAGE_IDS.HASKELL;
  if (s.includes("pascal") || s.includes("fpc")) return LANGUAGE_IDS.PASCAL;

  return LANGUAGE_IDS.OTHER;
};

/**
 * Normalize a platform verdict.
 * For Codeforces we also preserve the original "OK" in legacy `verdict`
 * for dashboard/analytics compatibility — see mapCodeforcesSubmission.
 */
export const normalizeVerdict = (raw, platform = PLATFORMS.CODEFORCES) => {
  if (!raw) return NORMALIZED_VERDICTS.UNKNOWN;
  const key = String(raw).trim().toUpperCase().replace(/\s+/g, "_");

  if (platform === PLATFORMS.CODEFORCES || !platform) {
    return CF_VERDICT_MAP[key] || NORMALIZED_VERDICTS.UNKNOWN;
  }

  // LeetCode-style (future)
  if (key === "ACCEPTED" || key === "AC") return NORMALIZED_VERDICTS.ACCEPTED;
  if (NORMALIZED_VERDICTS[key]) return NORMALIZED_VERDICTS[key];
  return NORMALIZED_VERDICTS.UNKNOWN;
};

/**
 * True when a stored verdict means accepted (legacy OK or normalized ACCEPTED).
 */
export const isAcceptedVerdict = (verdict) => {
  if (!verdict) return false;
  const v = String(verdict).toUpperCase();
  return v === "OK" || v === "ACCEPTED" || v === "AC";
};

export const buildCodeforcesProblemUrl = (contestId, index) => {
  if (contestId == null || !index) return null;
  const id = Number(contestId);
  // Gym contests use /gym/{id}; regular contests use /contest/{id}
  if (!Number.isNaN(id) && id >= 100000) {
    return `https://codeforces.com/gym/${id}/problem/${index}`;
  }
  return `https://codeforces.com/contest/${contestId}/problem/${index}`;
};

/**
 * Stable problem identity matching common CF tooling: contestId-index
 * (or problemsetName-index when contestId is absent).
 */
export const buildCodeforcesPlatformProblemId = (
  contestId,
  index,
  problemsetName = null
) => {
  if (contestId != null && index) return `${contestId}-${index}`;
  if (problemsetName && index) return `${problemsetName}-${index}`;
  if (index) return String(index);
  return null;
};

/** Ensure CF avatar URLs are absolute https. */
export const normalizeCodeforcesAvatar = (url) => {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
};

/**
 * Map a raw Codeforces user.status entry → unified + legacy fields for upsert.
 */
export const mapCodeforcesSubmission = (userId, sub) => {
  const contestId = sub.problem?.contestId ?? sub.contestId ?? null;
  const problemsetName = sub.problem?.problemsetName || null;
  const problemIndex = sub.problem?.index ?? "";
  const problemName = sub.problem?.name || "Unknown";
  const rawLanguage = sub.programmingLanguage || "Unknown";
  const rawVerdict = sub.verdict || "UNKNOWN";
  const creationTimeSeconds = sub.creationTimeSeconds;
  const platformSubmissionId = String(sub.id);

  return {
    userId,
    platform: PLATFORMS.CODEFORCES,
    platformSubmissionId,
    platformProblemId: buildCodeforcesPlatformProblemId(
      contestId,
      problemIndex,
      problemsetName
    ),
    problemTitle: problemName,
    problemUrl: buildCodeforcesProblemUrl(contestId, problemIndex),
    contestId: contestId != null ? String(contestId) : null,
    programmingLanguage: normalizeLanguage(rawLanguage),
    // Keep CF raw verdict ("OK") for existing analytics/dashboard queries
    verdict: rawVerdict,
    normalizedVerdict: normalizeVerdict(rawVerdict, PLATFORMS.CODEFORCES),
    executionTimeMs:
      typeof sub.timeConsumedMillis === "number" ? sub.timeConsumedMillis : null,
    memoryBytes:
      typeof sub.memoryConsumedBytes === "number" ? sub.memoryConsumedBytes : null,
    submittedAt: creationTimeSeconds
      ? new Date(creationTimeSeconds * 1000)
      : new Date(),
    syncedAt: new Date(),
    sourceAvailable: false,
    sourceHash: null,
    metadata: {
      rawVerdict,
      rawLanguage,
      problemIndex,
      problemsetName,
      rating: sub.problem?.rating ?? null,
      tags: Array.isArray(sub.problem?.tags) ? sub.problem.tags : [],
      authorHandle: sub.author?.members?.[0]?.handle || null,
      participantType: sub.author?.participantType || null,
      testset: sub.testset ?? null,
      passedTestCount: sub.passedTestCount ?? null,
    },
    // ── Legacy fields (dashboard / analytics / frontend) ──────────────
    submissionId: typeof sub.id === "number" ? sub.id : Number(sub.id),
    problemName,
    problemIndex,
    rating: sub.problem?.rating ?? null,
    tags: Array.isArray(sub.problem?.tags) ? sub.problem.tags : [],
    language: rawLanguage,
    creationTimeSeconds,
  };
};
