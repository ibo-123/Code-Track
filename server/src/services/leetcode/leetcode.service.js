import User from "../../models/UserModel.js";
import Submission from "../../models/SubmissionModel.js";
import PlatformConnection from "../../models/PlatformConnectionModel.js";
import {
  CONNECTION_STATUS,
  PLATFORMS,
} from "../../constants/platforms.js";
import {
  fetchPublicProfile,
  fetchRecentAcSubmissions,
  fetchRecentSubmissions,
  LEETCODE_CAPABILITIES,
} from "./graphqlClient.js";
import {
  buildProfileCache,
  mapRecentAcToSubmission,
  mapRecentSubmissionToSubmission,
  normalizeLeetCodeHandle,
} from "./normalize.js";

const RECENT_LIMIT =
  Number(process.env.LEETCODE_RECENT_LIMIT) ||
  LEETCODE_CAPABILITIES.maxPublicRecent;

/**
 * Validate username against LeetCode public GraphQL and upsert connection.
 * Status becomes `connected` for a verified *public* profile — this does NOT
 * imply private submission or source-code access.
 */
export const connectLeetCode = async (userId, rawHandle) => {
  const handle = normalizeLeetCodeHandle(rawHandle);
  if (!handle) {
    const err = new Error("Invalid LeetCode username");
    err.status = 400;
    throw err;
  }

  let matchedUser;
  try {
    matchedUser = await fetchPublicProfile(handle);
  } catch (error) {
    if (error.permanent || /not exist/i.test(error.message || "")) {
      const err = new Error("LeetCode profile not found");
      err.status = 404;
      throw err;
    }
    throw error;
  }

  if (!matchedUser?.username) {
    const err = new Error("LeetCode profile not found");
    err.status = 404;
    throw err;
  }

  const username = matchedUser.username;
  const profileCache = buildProfileCache(matchedUser);

  const connection = await PlatformConnection.findOneAndUpdate(
    { userId, platform: PLATFORMS.LEETCODE },
    {
      $set: {
        handle: username,
        status: CONNECTION_STATUS.CONNECTED,
        syncEnabled: true,
        lastSyncError: null,
        lastProfileSyncAt: new Date(),
        lastSyncAt: new Date(),
        lastSyncAttemptAt: new Date(),
        profileCache,
        capabilities: { ...LEETCODE_CAPABILITIES },
        activeJobId: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Keep User display fields in sync (solved may be null — store only when number)
  const userUpdate = { leetcodeUsername: username };
  if (typeof profileCache?.solved?.all === "number") {
    userUpdate.leetcodeSolved = profileCache.solved.all;
  }
  await User.findByIdAndUpdate(userId, { $set: userUpdate });

  return { connection, profile: profileCache };
};

export const disconnectLeetCode = async (userId) => {
  const connection = await PlatformConnection.findOneAndUpdate(
    { userId, platform: PLATFORMS.LEETCODE },
    {
      $set: {
        status: CONNECTION_STATUS.DISABLED,
        syncEnabled: false,
        activeJobId: null,
        lastSyncError: null,
        // Clear any future cursor; keep profileCache for audit until overwritten
        syncCursor: null,
      },
    },
    { new: true }
  );

  // Preserve historical submissions; clear display username optionally kept
  // Product choice: keep leetcodeUsername for display but mark disconnected
  return connection;
};

export const getLeetCodeStatus = async (userId) => {
  const connection = await PlatformConnection.findOne({
    userId,
    platform: PLATFORMS.LEETCODE,
  }).lean();

  if (!connection) {
    return {
      connected: false,
      status: CONNECTION_STATUS.DISCONNECTED,
      handle: null,
      profile: null,
      capabilities: { ...LEETCODE_CAPABILITIES },
      lastProfileSyncAt: null,
      lastSubmissionSyncAt: null,
      lastSyncAt: null,
      lastSyncAttemptAt: null,
      lastSyncError: null,
      syncEnabled: false,
      submissionImportCapability: LEETCODE_CAPABILITIES.submissionImport,
      sourceCodeCapability: LEETCODE_CAPABILITIES.sourceCode,
      activeJobId: null,
    };
  }

  const connected =
    connection.status === CONNECTION_STATUS.CONNECTED &&
    connection.syncEnabled !== false;

  return {
    connected,
    status: connection.status,
    handle: connection.handle,
    profile: connection.profileCache || null,
    capabilities: connection.capabilities || { ...LEETCODE_CAPABILITIES },
    lastProfileSyncAt: connection.lastProfileSyncAt || null,
    lastSubmissionSyncAt: connection.lastSubmissionSyncAt || null,
    lastSyncAt: connection.lastSyncAt || null,
    lastSyncAttemptAt: connection.lastSyncAttemptAt || null,
    lastSyncError: connection.lastSyncError || null,
    syncEnabled: connection.syncEnabled !== false,
    submissionImportCapability:
      connection.capabilities?.submissionImport ||
      LEETCODE_CAPABILITIES.submissionImport,
    sourceCodeCapability:
      connection.capabilities?.sourceCode || LEETCODE_CAPABILITIES.sourceCode,
    activeJobId: connection.activeJobId || null,
    // Honesty flags for the UI
    notes: {
      publicProfileOnly: true,
      fullHistoryUnavailable: true,
      sourceCodeUnavailable: true,
      recentImportLimit: RECENT_LIMIT,
    },
  };
};

export const syncLeetCodeProfile = async (userId) => {
  const connection = await PlatformConnection.findOne({
    userId,
    platform: PLATFORMS.LEETCODE,
  });

  if (!connection?.handle) {
    const err = new Error("LeetCode is not connected");
    err.status = 400;
    throw err;
  }
  if (!connection.syncEnabled) {
    const err = new Error("LeetCode synchronization is disabled");
    err.status = 400;
    throw err;
  }

  const connectionId = connection._id;
  await PlatformConnection.updateOne(
    { _id: connectionId },
    { $set: { lastSyncAttemptAt: new Date() } }
  );

  const matchedUser = await fetchPublicProfile(connection.handle);
  if (!matchedUser) {
    await PlatformConnection.updateOne(
      { _id: connectionId },
      {
        $set: {
          status: CONNECTION_STATUS.SYNC_ERROR,
          lastSyncError: "LeetCode profile not found",
        },
      }
    );
    const err = new Error("LeetCode profile not found");
    err.status = 404;
    throw err;
  }

  const profileCache = buildProfileCache(matchedUser);
  const handle = matchedUser.username || connection.handle;
  await PlatformConnection.updateOne(
    { _id: connectionId },
    {
      $set: {
        handle,
        profileCache,
        lastProfileSyncAt: new Date(),
        lastSyncAt: new Date(),
        lastSyncError: null,
        status: CONNECTION_STATUS.CONNECTED,
        capabilities: { ...LEETCODE_CAPABILITIES },
      },
    }
  );

  const userUpdate = { leetcodeUsername: handle };
  if (typeof profileCache?.solved?.all === "number") {
    userUpdate.leetcodeSolved = profileCache.solved.all;
  }
  await User.findByIdAndUpdate(userId, { $set: userUpdate });

  return profileCache;
};

/**
 * Import publicly accessible recent submissions into the unified model.
 * Does not claim full history. Source code is marked unsupported.
 */
export const syncLeetCodeSubmissions = async (userId) => {
  const connection = await PlatformConnection.findOne({
    userId,
    platform: PLATFORMS.LEETCODE,
  });

  if (!connection?.handle) {
    const err = new Error("LeetCode is not connected");
    err.status = 400;
    throw err;
  }
  if (!connection.syncEnabled) {
    const err = new Error("LeetCode synchronization is disabled");
    err.status = 400;
    throw err;
  }

  const connectionId = connection._id;
  await PlatformConnection.updateOne(
    { _id: connectionId },
    { $set: { lastSyncAttemptAt: new Date() } }
  );

  const handle = connection.handle;
  let recentAc = [];
  let recentAll = [];

  try {
    [recentAc, recentAll] = await Promise.all([
      fetchRecentAcSubmissions(handle, RECENT_LIMIT),
      fetchRecentSubmissions(handle),
    ]);
  } catch (error) {
    await PlatformConnection.updateOne(
      { _id: connectionId },
      {
        $set: {
          lastSyncError: String(error.message || "Sync failed").slice(0, 500),
          status: CONNECTION_STATUS.SYNC_ERROR,
        },
      }
    );
    throw error;
  }

  // Prefer AC rows with real ids; merge recent list for WA/CE attempts
  const docs = [];
  const seen = new Set();

  for (const item of recentAc) {
    if (!item?.id) continue;
    const mapped = mapRecentAcToSubmission(userId, item);
    if (seen.has(mapped.platformSubmissionId)) continue;
    seen.add(mapped.platformSubmissionId);
    docs.push(mapped);
  }

  for (const item of recentAll) {
    const mapped = mapRecentSubmissionToSubmission(userId, item);
    if (seen.has(mapped.platformSubmissionId)) continue;
    // Also skip if same AC id space already covered via composite near-match
    seen.add(mapped.platformSubmissionId);
    docs.push(mapped);
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  if (docs.length) {
    const ops = docs.map((doc) => {
      const { userId: uid, platform, platformSubmissionId, ...fields } = doc;
      // Never write nulls over existing values (partial provider payloads)
      const $set = {
        userId: uid,
        platform,
        platformSubmissionId,
        syncedAt: new Date(),
      };
      for (const [k, v] of Object.entries(fields)) {
        if (v === null || v === undefined) continue;
        $set[k] = v;
      }
      // Required on insert even if missing from partial map
      if (!$set.verdict) $set.verdict = "Unknown";
      if (!$set.problemTitle && !$set.problemName) {
        $set.problemTitle = "Unknown";
      }

      return {
        updateOne: {
          filter: { userId: uid, platform, platformSubmissionId },
          update: { $set },
          upsert: true,
        },
      };
    });

    const result = await Submission.bulkWrite(ops, { ordered: false });
    imported = result.upsertedCount || 0;
    updated = result.modifiedCount || 0;
    skipped = Math.max(0, docs.length - imported - updated);
  }

  const maxTs = docs.reduce((max, d) => {
    const t = d.submittedAt ? new Date(d.submittedAt).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  await PlatformConnection.updateOne(
    { _id: connectionId },
    {
      $set: {
        lastSubmissionSyncAt: new Date(),
        lastSyncAt: new Date(),
        lastSyncError: null,
        status: CONNECTION_STATUS.CONNECTED,
        syncCursor: {
          ...(connection.syncCursor || {}),
          importMode: "public_recent_only",
          lastSeenTimestamp: maxTs ? new Date(maxTs).toISOString() : null,
          lastImportCount: docs.length,
          fullHistory: false,
          sourceCodeSupported: false,
        },
        capabilities: { ...LEETCODE_CAPABILITIES },
      },
    }
  );

  return {
    imported,
    updated,
    skipped,
    total: docs.length,
    sourceUnavailable: docs.length,
    limit: RECENT_LIMIT,
    mode: "public_recent_only",
    note:
      "Only publicly accessible recent submissions were imported. Full history and source code require authenticated LeetCode access, which Phase 2 does not collect.",
  };
};
