import SyncJob from "../models/SyncJobModel.js";
import PlatformConnection from "../models/PlatformConnectionModel.js";
import {
  PLATFORMS,
  SYNC_JOB_STATUS,
  SYNC_JOB_TYPES,
} from "../constants/platforms.js";
import {
  syncLeetCodeProfile,
  syncLeetCodeSubmissions,
} from "./leetcode/leetcode.service.js";

const running = new Set(); // in-process lock keys: `${userId}:${platform}:${type}`

const lockKey = (userId, platform, type) => `${userId}:${platform}:${type}`;

/**
 * Create a sync job and run it in the background (setImmediate).
 * Returns immediately with the job document.
 */
export const enqueueSyncJob = async ({
  userId,
  platform,
  type,
  runner,
}) => {
  const key = lockKey(userId, platform, type);

  // Prevent concurrent identical jobs
  const existing = await SyncJob.findOne({
    userId,
    platform,
    type,
    status: { $in: [SYNC_JOB_STATUS.QUEUED, SYNC_JOB_STATUS.RUNNING] },
  }).lean();

  if (existing || running.has(key)) {
    const err = new Error("A synchronization job is already in progress");
    err.status = 409;
    err.jobId = existing?._id;
    throw err;
  }

  const job = await SyncJob.create({
    userId,
    platform,
    type,
    status: SYNC_JOB_STATUS.QUEUED,
    progress: {
      imported: 0,
      updated: 0,
      skipped: 0,
      sourceUnavailable: 0,
      total: 0,
      message: "Queued",
    },
  });

  await PlatformConnection.findOneAndUpdate(
    { userId, platform },
    { $set: { activeJobId: job._id } }
  );

  setImmediate(() => {
    runJob(job._id, key, runner).catch((err) =>
      console.error(`[SyncJob ${job._id}]`, err.message)
    );
  });

  return job;
};

async function runJob(jobId, key, runner) {
  running.add(key);
  let job;
  try {
    job = await SyncJob.findById(jobId);
    if (!job) return;

    job.status = SYNC_JOB_STATUS.RUNNING;
    job.startedAt = new Date();
    job.progress.message = "Running";
    await job.save();

    const result = await runner(job);

    job.progress = {
      imported: result?.imported ?? 0,
      updated: result?.updated ?? 0,
      skipped: result?.skipped ?? 0,
      sourceUnavailable: result?.sourceUnavailable ?? 0,
      total: result?.total ?? 0,
      message: result?.note || result?.message || "Completed",
    };
    job.status =
      result?.partial === true
        ? SYNC_JOB_STATUS.PARTIAL
        : SYNC_JOB_STATUS.COMPLETED;
    job.completedAt = new Date();
    job.error = null;
    await job.save();
  } catch (error) {
    if (job) {
      job.status = SYNC_JOB_STATUS.FAILED;
      job.error = String(error.message || "Sync failed").slice(0, 500);
      job.completedAt = new Date();
      job.progress.message = "Failed";
      await job.save().catch(() => {});
    }
  } finally {
    running.delete(key);
    if (job) {
      await PlatformConnection.findOneAndUpdate(
        { userId: job.userId, platform: job.platform, activeJobId: job._id },
        { $set: { activeJobId: null } }
      ).catch(() => {});
    }
  }
}

export const getSyncJobForUser = async (jobId, userId) => {
  return SyncJob.findOne({ _id: jobId, userId }).lean();
};

const assertLeetCodeSyncAllowed = async (userId) => {
  const connection = await PlatformConnection.findOne({
    userId,
    platform: PLATFORMS.LEETCODE,
  }).lean();

  if (!connection?.handle) {
    const err = new Error("LeetCode is not connected");
    err.status = 400;
    throw err;
  }
  if (connection.syncEnabled === false) {
    const err = new Error("LeetCode synchronization is disabled");
    err.status = 400;
    throw err;
  }
  return connection;
};

export const enqueueLeetCodeProfileSync = async (userId) => {
  await assertLeetCodeSyncAllowed(userId);
  return enqueueSyncJob({
    userId,
    platform: PLATFORMS.LEETCODE,
    type: SYNC_JOB_TYPES.PROFILE,
    runner: async () => {
      const profile = await syncLeetCodeProfile(userId);
      return {
        imported: 0,
        updated: 1,
        total: 1,
        message: "Profile refreshed",
        note: profile?.username
          ? `Profile synced for ${profile.username}`
          : "Profile synced",
      };
    },
  });
};

export const enqueueLeetCodeSubmissionSync = async (userId) => {
  await assertLeetCodeSyncAllowed(userId);
  return enqueueSyncJob({
    userId,
    platform: PLATFORMS.LEETCODE,
    type: SYNC_JOB_TYPES.SUBMISSIONS,
    runner: async () => {
      const result = await syncLeetCodeSubmissions(userId);
      return {
        ...result,
        // Public recent-only is inherently a partial history import
        partial: true,
      };
    },
  });
};
