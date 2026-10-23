import PlatformConnection from "../models/PlatformConnectionModel.js";
import {
  CONNECTION_STATUS,
  PLATFORMS,
} from "../constants/platforms.js";

const sanitizeError = (err) => {
  const msg = typeof err === "string" ? err : err?.message || "Sync failed";
  return String(msg).slice(0, 500);
};

/**
 * Upsert Codeforces connection as authenticated (handle validated via CF API).
 */
export const upsertCodeforcesConnection = async (
  userId,
  handle,
  extra = {}
) => {
  return PlatformConnection.findOneAndUpdate(
    { userId, platform: PLATFORMS.CODEFORCES },
    {
      $set: {
        handle,
        status: CONNECTION_STATUS.CONNECTED,
        syncEnabled: true,
        lastSyncError: null,
        ...extra,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

/**
 * Record a display-only LeetCode username — NOT an authenticated connection.
 */
export const upsertLeetCodeUsernameSaved = async (userId, handle) => {
  if (!handle) {
    await PlatformConnection.findOneAndDelete({
      userId,
      platform: PLATFORMS.LEETCODE,
    });
    return null;
  }

  return PlatformConnection.findOneAndUpdate(
    { userId, platform: PLATFORMS.LEETCODE },
    {
      $set: {
        handle: String(handle).trim(),
        status: CONNECTION_STATUS.USERNAME_SAVED,
        syncEnabled: false,
        lastSyncError: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const markSyncAttempt = async (userId, platform) => {
  return PlatformConnection.findOneAndUpdate(
    { userId, platform },
    { $set: { lastSyncAttemptAt: new Date() } },
    { new: true }
  );
};

export const markSyncSuccess = async (userId, platform, syncCursor = null) => {
  const $set = {
    lastSyncAt: new Date(),
    lastSyncAttemptAt: new Date(),
    lastSyncError: null,
    status: CONNECTION_STATUS.CONNECTED,
  };
  if (syncCursor != null) $set.syncCursor = syncCursor;

  return PlatformConnection.findOneAndUpdate(
    { userId, platform },
    { $set },
    { new: true }
  );
};

export const markSyncFailure = async (userId, platform, error) => {
  return PlatformConnection.findOneAndUpdate(
    { userId, platform },
    {
      $set: {
        lastSyncAttemptAt: new Date(),
        lastSyncError: sanitizeError(error),
        status: CONNECTION_STATUS.SYNC_ERROR,
      },
    },
    { new: true }
  );
};

export const getConnection = async (userId, platform) => {
  return PlatformConnection.findOne({ userId, platform }).lean();
};

export const listConnections = async (userId) => {
  return PlatformConnection.find({ userId }).lean();
};
