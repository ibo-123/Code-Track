import User from "../models/UserModel.js";
import {
  syncCodeforcesData,
  cachedDashboardFromUser,
  isSyncFresh,
} from "../services/codeforces.services.js";
import { getConnection } from "../services/platformConnection.service.js";
import { PLATFORMS } from "../constants/platforms.js";

/** Max time we will block the HTTP response waiting on Codeforces (ms). */
const SYNC_WAIT_MS = 4_000;

const buildResponse = (user, stats, extras = {}) => ({
  success: true,
  user,
  problemsSolved: stats?.problemsSolved ?? user.totalSolved ?? 0,
  contestCount: stats?.contestCount ?? user.contestCount ?? 0,
  easySolved: stats?.easySolved ?? user.easySolved ?? 0,
  mediumSolved: stats?.mediumSolved ?? user.mediumSolved ?? 0,
  hardSolved: stats?.hardSolved ?? user.hardSolved ?? 0,
  currentStreak: stats?.currentStreak ?? user.currentStreak ?? 0,
  longestStreak: stats?.longestStreak ?? user.longestStreak ?? 0,
  lastActiveDate: user.lastActiveDate ?? null,
  lastSyncedAt: user.lastSyncedAt ?? null,
  codeforces: stats
    ? {
        handle: stats.handle,
        rating: stats.rating,
        maxRating: stats.maxRating,
        rank: stats.rank,
        maxRank: stats.maxRank,
        contribution: stats.contribution,
        avatar: stats.avatar,
      }
    : {
        handle: user.codeforcesHandle,
        rating: user.codeforcesRating,
        maxRating: user.codeforcesMaxRating,
        rank: user.codeforcesRank,
        maxRank: user.codeforcesMaxRank,
        contribution: user.codeforcesContribution,
        avatar: user.codeforcesAvatar,
      },
  ...extras,
});

const hasUsableCache = (user) =>
  Boolean(
    user.lastSyncedAt ||
      user.codeforcesRating != null ||
      user.totalSolved > 0
  );

const queueBackgroundSync = (userId, force = false) => {
  setImmediate(() => {
    syncCodeforcesData(userId, { force }).catch((err) =>
      console.error("Background CF sync:", err.message)
    );
  });
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("SYNC_TIMEOUT")), ms)
    ),
  ]);

export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.codeforcesHandle) {
      return res.status(200).json({
        success: true,
        user,
        problemsSolved: 0,
        contestCount: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        lastSyncedAt: null,
        codeforces: null,
      });
    }

    const forceRefresh =
      req.query.refresh === "true" || req.query.refresh === "1";
    const fresh = isSyncFresh(user.lastSyncedAt);
    const cached = hasUsableCache(user);

    const connection = await getConnection(req.user.id, PLATFORMS.CODEFORCES);
    const fullSyncDone = Boolean(connection?.syncCursor?.fullSyncCompleted);
    // Incomplete prior syncs under-counted solved/streaks — keep pulling full history
    const needsFullSync = !fullSyncDone;

    // Fast path: serve DB cache immediately. Never block the HTTP response on CF
    // when we already have profile/stats. Stale, forced, or incomplete → background.
    if (cached) {
      const shouldSync = forceRefresh || !fresh || needsFullSync;
      if (shouldSync) {
        // force=true when client refreshes OR we still need a complete history pull
        queueBackgroundSync(req.user.id, forceRefresh || needsFullSync);
      }

      return res.status(200).json(
        buildResponse(
          user,
          cachedDashboardFromUser(user, user.contestCount ?? 0),
          {
            cached: true,
            syncing: shouldSync,
            fullSyncPending: needsFullSync,
          }
        )
      );
    }

    // No cache yet (first connect) — briefly try sync, then fall back
    try {
      const result = await withTimeout(
        syncCodeforcesData(req.user.id, { force: true }),
        SYNC_WAIT_MS
      );
      const freshUser = await User.findById(req.user.id).select("-password");
      return res.status(200).json(
        buildResponse(freshUser, result?.stats ?? cachedDashboardFromUser(freshUser), {
          cached: Boolean(result?.cached),
          syncing: false,
        })
      );
    } catch (error) {
      if (error.message !== "SYNC_TIMEOUT") {
        console.error("Codeforces Error:", error.message);
      } else {
        // Finish sync in background; client already has profile fields from connect
        queueBackgroundSync(req.user.id, true);
      }

      const freshUser = await User.findById(req.user.id).select("-password");
      return res.status(200).json(
        buildResponse(
          freshUser,
          cachedDashboardFromUser(freshUser, freshUser.contestCount ?? 0),
          { cached: true, syncing: true }
        )
      );
    }
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};
