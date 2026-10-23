import axios from "axios";
import http from "http";
import https from "https";
import User from "../models/UserModel.js";
import { PLATFORMS } from "../constants/platforms.js";
import {
  upsertCodeforcesSubmissions,
  recomputeStatsFromDb as recomputeUnifiedStats,
} from "./submission.service.js";
import {
  getConnection,
  markSyncAttempt,
  markSyncFailure,
  markSyncSuccess,
  upsertCodeforcesConnection,
} from "./platformConnection.service.js";
import { normalizeCodeforcesAvatar } from "../utils/submissionNormalize.js";

const BASE_URL = "https://codeforces.com/api";

/** Skip live CF sync if data was synced within this window (unless force=true). */
export const SYNC_TTL_MS = 5 * 60 * 1000;

/** Page size when pulling the full submission history from CF. */
const FULL_SYNC_PAGE_SIZE = 1000;
/** Safety cap — 50k submissions is far beyond typical accounts. */
const FULL_SYNC_MAX_PAGES = 50;
/** Recent window for incremental sync after a completed full sync. */
const INCREMENTAL_SUBMISSION_COUNT = 500;

const cfClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 10 }),
  headers: { Accept: "application/json" },
});

const validateHandle = (handle) => {
  if (!handle || typeof handle !== "string" || handle.trim() === "") {
    throw new Error("Codeforces handle is required");
  }
  return handle.trim();
};

const cfGet = async (path, params = {}) => {
  const response = await cfClient.get(path, { params });
  if (response.data?.status !== "OK") {
    throw new Error(response.data?.comment || "Codeforces API error");
  }
  return response.data.result;
};

export const getCodeforcesUser = async (handle) => {
  try {
    handle = validateHandle(handle);
    const result = await cfGet("/user.info", { handles: handle });
    return result[0];
  } catch (error) {
    if (
      error.response?.status === 400 ||
      /not found|not exist|handles:/i.test(error.message || "")
    ) {
      throw new Error("Codeforces handle not found");
    }
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      throw new Error("Codeforces connection timed out");
    }
    throw new Error("Unable to connect to Codeforces");
  }
};

export const getContestHistory = async (handle) => {
  handle = validateHandle(handle);
  return cfGet("/user.rating", { handle });
};

export const getContestList = async () => {
  const response = await cfClient.get("/contest.list", {
    params: { gym: false },
    timeout: 10000,
  });
  if (response.data?.status !== "OK") {
    throw new Error("Unable to fetch contests");
  }
  return response.data.result;
};

export const getRatingHistory = async (handle) => {
  try {
    handle = validateHandle(handle);
    return await cfGet("/user.rating", { handle });
  } catch {
    throw new Error("Unable to fetch rating history");
  }
};

/**
 * Fetch a page of submissions from CF user.status.
 * @param {string} handle
 * @param {{ from?: number, count?: number }} options
 */
export const getSubmissions = async (handle, { from = 1, count } = {}) => {
  try {
    handle = validateHandle(handle);
    const params = { handle, from };
    if (count != null) params.count = count;
    const timeout =
      count == null || count > 500 ? 20_000 : count > 200 ? 12_000 : 8_000;
    const response = await cfClient.get("/user.status", { params, timeout });
    if (response.data?.status !== "OK") {
      throw new Error(response.data?.comment || "Unable to fetch submissions");
    }
    return response.data.result || [];
  } catch (error) {
    if (error.message?.startsWith("Unable to fetch")) throw error;
    throw new Error("Unable to fetch submissions");
  }
};

/**
 * Paginate through the entire CF submission history for accurate stats.
 */
export const getAllSubmissions = async (handle) => {
  handle = validateHandle(handle);
  const all = [];
  let from = 1;

  for (let page = 0; page < FULL_SYNC_MAX_PAGES; page++) {
    const batch = await getSubmissions(handle, {
      from,
      count: FULL_SYNC_PAGE_SIZE,
    });
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < FULL_SYNC_PAGE_SIZE) break;
    from += batch.length;
  }

  return all;
};

/** UTC calendar day key YYYY-MM-DD from unix seconds. */
const utcDayKey = (creationTimeSeconds) => {
  if (!creationTimeSeconds) return null;
  return new Date(creationTimeSeconds * 1000).toISOString().slice(0, 10);
};

const dayKeyToUtcDate = (key) => new Date(`${key}T00:00:00.000Z`);

const computeStreaks = (submissions) => {
  let currentStreak = 0;
  let longestStreak = 0;
  let lastActiveDate = null;

  const activeDays = new Set();
  submissions.forEach((sub) => {
    const key = utcDayKey(sub.creationTimeSeconds);
    if (key) activeDays.add(key);
  });

  const sortedDays = Array.from(activeDays).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  if (sortedDays.length === 0) {
    return { currentStreak, longestStreak, lastActiveDate };
  }

  lastActiveDate = dayKeyToUtcDate(sortedDays[0]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (sortedDays[0] === todayKey || sortedDays[0] === yesterdayKey) {
    currentStreak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const newer = dayKeyToUtcDate(sortedDays[i - 1]);
      const older = dayKeyToUtcDate(sortedDays[i]);
      const diffDays = Math.round((newer - older) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) currentStreak++;
      else break;
    }
  }

  let tempStreak = 1;
  longestStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const newer = dayKeyToUtcDate(sortedDays[i - 1]);
    const older = dayKeyToUtcDate(sortedDays[i]);
    const diffDays = Math.round((newer - older) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak, lastActiveDate };
};

const upsertSubmissions = async (userId, submissions) => {
  if (!submissions.length) return;
  try {
    await upsertCodeforcesSubmissions(userId, submissions);
  } catch (e) {
    // Partial bulkWrite failures still leave prior records intact
    console.error("BulkWrite error:", e.message);
  }
};

const recomputeStatsFromDb = async (userId) => {
  const {
    problemsSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    submissionsForStreak,
  } = await recomputeUnifiedStats(userId);

  const streaks = computeStreaks(submissionsForStreak);

  return {
    problemsSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    ...streaks,
  };
};

const buildStatsPayload = (cfUser, ratingHistory, dbStats) => ({
  handle: cfUser.handle,
  rating: cfUser.rating,
  maxRating: cfUser.maxRating,
  rank: cfUser.rank,
  maxRank: cfUser.maxRank,
  contribution: cfUser.contribution,
  avatar: cfUser.avatar,
  problemsSolved: dbStats.problemsSolved,
  contestCount: ratingHistory.length,
  ratingHistory,
  easySolved: dbStats.easySolved,
  mediumSolved: dbStats.mediumSolved,
  hardSolved: dbStats.hardSolved,
  currentStreak: dbStats.currentStreak,
  longestStreak: dbStats.longestStreak,
});

/**
 * Sync Codeforces data.
 * @param {string} userId
 * @param {{ force?: boolean }} options - force=true bypasses TTL cache
 */
export const syncCodeforcesData = async (userId, { force = false } = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.codeforcesHandle) {
      throw new Error("User or Codeforces handle not found");
    }

    const handle = user.codeforcesHandle;
    const isFresh =
      user.lastSyncedAt &&
      Date.now() - new Date(user.lastSyncedAt).getTime() < SYNC_TTL_MS;

    if (isFresh && !force) {
      return {
        success: true,
        cached: true,
        stats: {
          handle: user.codeforcesHandle,
          rating: user.codeforcesRating,
          maxRating: user.codeforcesMaxRating,
          rank: user.codeforcesRank,
          maxRank: user.codeforcesMaxRank,
          contribution: user.codeforcesContribution,
          avatar: user.codeforcesAvatar,
          problemsSolved: user.totalSolved || 0,
          contestCount: user.contestCount || 0,
          ratingHistory: [],
          easySolved: user.easySolved || 0,
          mediumSolved: user.mediumSolved || 0,
          hardSolved: user.hardSolved || 0,
          currentStreak: user.currentStreak || 0,
          longestStreak: user.longestStreak || 0,
        },
      };
    }

    await markSyncAttempt(userId, PLATFORMS.CODEFORCES);

    const connection = await getConnection(userId, PLATFORMS.CODEFORCES);
    const fullSyncDone = Boolean(connection?.syncCursor?.fullSyncCompleted);
    // Exact stats need the full submission history at least once.
    // After that, incremental recent pulls + DB recompute stay accurate.
    const needsFullSubmissionSync = force || !fullSyncDone;

    const [cfUser, ratingHistory] = await Promise.all([
      getCodeforcesUser(handle),
      getRatingHistory(handle).catch(() => []),
    ]);

    if (!cfUser) return null;

    let fetchedSubmissions = [];
    let submissionFetchOk = false;
    try {
      fetchedSubmissions = needsFullSubmissionSync
        ? await getAllSubmissions(handle)
        : await getSubmissions(handle, { count: INCREMENTAL_SUBMISSION_COUNT });
      submissionFetchOk = true;
    } catch (err) {
      console.error("CF submissions fetch failed:", err.message);
      fetchedSubmissions = [];
      submissionFetchOk = false;
    }

    const completedFullSync =
      (needsFullSubmissionSync && submissionFetchOk) || fullSyncDone;

    // Preserve prior DB rows even if this batch partially fails
    await upsertSubmissions(userId, fetchedSubmissions);

    const dbStats = await recomputeStatsFromDb(userId);

    // Profile fields come straight from CF user.info (exact)
    user.codeforcesRating =
      typeof cfUser.rating === "number" ? cfUser.rating : null;
    user.codeforcesMaxRating =
      typeof cfUser.maxRating === "number" ? cfUser.maxRating : null;
    user.codeforcesRank = cfUser.rank || null;
    user.codeforcesMaxRank = cfUser.maxRank || null;
    user.codeforcesContribution =
      typeof cfUser.contribution === "number" ? cfUser.contribution : null;
    user.codeforcesAvatar = normalizeCodeforcesAvatar(
      cfUser.titlePhoto || cfUser.avatar
    );
    // Prefer titlePhoto (larger); fall back to avatar

    // Solved / streaks recomputed from DB after upsert (exact once full sync done)
    user.totalSolved = dbStats.problemsSolved;
    user.easySolved = dbStats.easySolved;
    user.mediumSolved = dbStats.mediumSolved;
    user.hardSolved = dbStats.hardSolved;
    user.currentStreak = dbStats.currentStreak;
    // Full recompute replaces prior streak; do not keep inflated incomplete values
    user.longestStreak = dbStats.longestStreak;
    user.lastActiveDate = dbStats.lastActiveDate;
    user.contestCount = Array.isArray(ratingHistory) ? ratingHistory.length : 0;
    user.lastSyncedAt = new Date();

    await user.save();

    const newestId = fetchedSubmissions[0]?.id ?? null;
    await markSyncSuccess(userId, PLATFORMS.CODEFORCES, {
      lastSeenSubmissionId: newestId != null ? String(newestId) : null,
      lastFetchCount: fetchedSubmissions.length,
      fullSyncCompleted: completedFullSync || fullSyncDone,
      syncedAt: new Date().toISOString(),
    });

    await upsertCodeforcesConnection(userId, handle);

    return {
      success: true,
      cached: false,
      fullSync: completedFullSync || fullSyncDone,
      stats: buildStatsPayload(cfUser, ratingHistory, {
        ...dbStats,
        longestStreak: user.longestStreak,
      }),
    };
  } catch (error) {
    console.error("Codeforces Sync Error:", error.message || error);
    try {
      await markSyncFailure(userId, PLATFORMS.CODEFORCES, error);
    } catch {
      /* ignore secondary failure */
    }
    throw new Error(error.message || "Failed to sync Codeforces data");
  }
};

/**
 * Lightweight live profile fetch (no full submission sync).
 */
export const getCodeforcesStats = async (
  handle,
  userId = null,
  { force = false } = {}
) => {
  if (userId) {
    try {
      const syncResult = await syncCodeforcesData(userId, { force });
      if (syncResult?.stats) return syncResult.stats;
    } catch (e) {
      console.warn("Sync failed, falling back to basic fetch:", e.message);
    }
  }

  handle = validateHandle(handle);
  const [user, ratingHistory, submissions] = await Promise.all([
    getCodeforcesUser(handle),
    getRatingHistory(handle).catch(() => []),
    getAllSubmissions(handle).catch(() =>
      getSubmissions(handle, { count: INCREMENTAL_SUBMISSION_COUNT }).catch(
        () => []
      )
    ),
  ]);

  const solvedProblems = new Set();
  submissions.forEach((submission) => {
    if (submission.verdict === "OK") {
      const cid = submission.problem?.contestId;
      const idx = submission.problem?.index;
      const setName = submission.problem?.problemsetName;
      const key =
        cid != null && idx
          ? `${cid}-${idx}`
          : setName && idx
            ? `${setName}-${idx}`
            : null;
      if (key) solvedProblems.add(key);
    }
  });

  return {
    handle: user.handle,
    rating: typeof user.rating === "number" ? user.rating : null,
    maxRating: typeof user.maxRating === "number" ? user.maxRating : null,
    rank: user.rank || null,
    maxRank: user.maxRank || null,
    contribution:
      typeof user.contribution === "number" ? user.contribution : null,
    avatar: normalizeCodeforcesAvatar(user.titlePhoto || user.avatar),
    problemsSolved: solvedProblems.size,
    contestCount: ratingHistory.length,
    ratingHistory,
  };
};

/** Build dashboard payload from User document (no CF network call). */
export const cachedDashboardFromUser = (user, contestCount = null) => ({
  handle: user.codeforcesHandle,
  rating: user.codeforcesRating,
  maxRating: user.codeforcesMaxRating,
  rank: user.codeforcesRank,
  maxRank: user.codeforcesMaxRank,
  contribution: user.codeforcesContribution,
  avatar: user.codeforcesAvatar,
  problemsSolved: user.totalSolved || 0,
  contestCount: contestCount ?? 0,
  easySolved: user.easySolved || 0,
  mediumSolved: user.mediumSolved || 0,
  hardSolved: user.hardSolved || 0,
  currentStreak: user.currentStreak || 0,
  longestStreak: user.longestStreak || 0,
});

export const isSyncFresh = (lastSyncedAt) =>
  Boolean(
    lastSyncedAt &&
      Date.now() - new Date(lastSyncedAt).getTime() < SYNC_TTL_MS
  );
