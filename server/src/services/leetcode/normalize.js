import {
  LC_VERDICT_MAP,
  NORMALIZED_VERDICTS,
  PLATFORMS,
  SOURCE_STATUS,
} from "../../constants/platforms.js";
import { normalizeLanguage } from "../../utils/submissionNormalize.js";

export const normalizeLeetCodeHandle = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const handle = raw.trim().replace(/^@/, "").replace(/\/+$/, "");
  // Strip pasted profile URLs
  const urlMatch = handle.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/i);
  const cleaned = (urlMatch ? urlMatch[1] : handle).trim();
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(cleaned)) return null;
  return cleaned;
};

export const buildLeetCodeProblemUrl = (titleSlug) => {
  if (!titleSlug) return null;
  return `https://leetcode.com/problems/${titleSlug}/`;
};

export const buildLeetCodeProfileUrl = (username) => {
  if (!username) return null;
  return `https://leetcode.com/${encodeURIComponent(username)}/`;
};

export const normalizeLeetCodeVerdict = (statusDisplay) => {
  if (!statusDisplay) return NORMALIZED_VERDICTS.UNKNOWN;
  const key = String(statusDisplay).trim().toUpperCase();
  return LC_VERDICT_MAP[key] || NORMALIZED_VERDICTS.UNKNOWN;
};

/**
 * Map public AC list item (has id) → unified submission fields.
 */
export const mapRecentAcToSubmission = (userId, item) => {
  const platformSubmissionId = String(item.id);
  const titleSlug = item.titleSlug || null;
  const ts = Number(item.timestamp);
  const submittedAt =
    Number.isFinite(ts) && ts > 0 ? new Date(ts * 1000) : new Date();

  return {
    userId,
    platform: PLATFORMS.LEETCODE,
    platformSubmissionId,
    platformProblemId: titleSlug,
    problemTitle: item.title || titleSlug || "Unknown",
    problemUrl: buildLeetCodeProblemUrl(titleSlug),
    contestId: null,
    programmingLanguage: null,
    verdict: "Accepted",
    normalizedVerdict: NORMALIZED_VERDICTS.ACCEPTED,
    executionTimeMs: null,
    memoryBytes: null,
    submittedAt,
    syncedAt: new Date(),
    sourceAvailable: false,
    sourceStatus: SOURCE_STATUS.UNSUPPORTED,
    sourceHash: null,
    metadata: {
      rawVerdict: "Accepted",
      rawLanguage: null,
      titleSlug,
      importSource: "recentAcSubmissionList",
      difficulty: null,
    },
    // Legacy compat blanks
    submissionId: null,
    problemName: item.title || titleSlug || "Unknown",
    problemIndex: null,
    rating: null,
    tags: [],
    language: null,
    creationTimeSeconds: Math.floor(submittedAt.getTime() / 1000),
  };
};

/**
 * Map recentSubmissionList item (no id) → unified fields.
 * Dedup key: titleSlug + timestamp + lang + status
 */
export const mapRecentSubmissionToSubmission = (userId, item) => {
  const titleSlug = item.titleSlug || "unknown";
  const ts = String(item.timestamp || "0");
  const lang = item.lang || "unknown";
  const status = item.statusDisplay || "Unknown";
  const platformSubmissionId = `lc:${titleSlug}:${ts}:${lang}:${status}`
    .toLowerCase()
    .replace(/\s+/g, "_");

  const tsNum = Number(item.timestamp);
  const submittedAt =
    Number.isFinite(tsNum) && tsNum > 0
      ? new Date(tsNum * 1000)
      : new Date();

  const rawLanguage = item.lang || null;

  return {
    userId,
    platform: PLATFORMS.LEETCODE,
    platformSubmissionId,
    platformProblemId: titleSlug === "unknown" ? null : titleSlug,
    problemTitle: item.title || titleSlug,
    problemUrl: buildLeetCodeProblemUrl(
      titleSlug === "unknown" ? null : titleSlug
    ),
    contestId: null,
    programmingLanguage: normalizeLanguage(rawLanguage || ""),
    verdict: status,
    normalizedVerdict: normalizeLeetCodeVerdict(status),
    executionTimeMs: null,
    memoryBytes: null,
    submittedAt,
    syncedAt: new Date(),
    sourceAvailable: false,
    sourceStatus: SOURCE_STATUS.UNSUPPORTED,
    sourceHash: null,
    metadata: {
      rawVerdict: status,
      rawLanguage,
      titleSlug,
      importSource: "recentSubmissionList",
      difficulty: null,
    },
    submissionId: null,
    problemName: item.title || titleSlug,
    problemIndex: null,
    rating: null,
    tags: [],
    language: rawLanguage,
    creationTimeSeconds: Math.floor(submittedAt.getTime() / 1000),
  };
};

/**
 * Build profile cache from matchedUser — omit missing fields (do not coerce to 0).
 */
export const buildProfileCache = (matchedUser) => {
  if (!matchedUser) return null;

  const stats = matchedUser.submitStats?.acSubmissionNum || [];
  const byDiff = {};
  for (const row of stats) {
    if (!row?.difficulty) continue;
    byDiff[row.difficulty.toLowerCase()] = {
      accepted: typeof row.count === "number" ? row.count : null,
      submissions:
        typeof row.submissions === "number" ? row.submissions : null,
    };
  }

  const ranking = matchedUser.profile?.ranking;
  const reputation = matchedUser.profile?.reputation;

  return {
    username: matchedUser.username || null,
    realName: matchedUser.profile?.realName || null,
    avatar: matchedUser.profile?.userAvatar || null,
    aboutMe: matchedUser.profile?.aboutMe || null,
    ranking: typeof ranking === "number" ? ranking : null,
    reputation: typeof reputation === "number" ? reputation : null,
    starRating:
      typeof matchedUser.profile?.starRating === "number"
        ? matchedUser.profile.starRating
        : null,
    solved: {
      all: byDiff.all?.accepted ?? null,
      easy: byDiff.easy?.accepted ?? null,
      medium: byDiff.medium?.accepted ?? null,
      hard: byDiff.hard?.accepted ?? null,
    },
    profileUrl: buildLeetCodeProfileUrl(matchedUser.username),
    retrievedAt: new Date().toISOString(),
  };
};
