import {
  connectLeetCode,
  disconnectLeetCode,
  getLeetCodeStatus,
} from "../services/leetcode/leetcode.service.js";
import {
  enqueueLeetCodeProfileSync,
  enqueueLeetCodeSubmissionSync,
  getSyncJobForUser,
} from "../services/syncJob.service.js";
import { syncRateLimiter } from "../middlewares/rateLimit.middleware.js";

export { syncRateLimiter as leetcodeSyncRateLimiter };

const sanitizeError = (error) => {
  const status = error.status || error.response?.status || 500;
  const message =
    error.message ||
    (status === 429
      ? "Rate limited. Please try again later."
      : "LeetCode request failed");
  return { status: status >= 400 && status < 600 ? status : 500, message };
};

export const connect = async (req, res) => {
  try {
    const { handle, username } = req.body || {};
    const result = await connectLeetCode(req.user.id, handle || username);

    return res.status(200).json({
      success: true,
      message: "LeetCode profile connected (public access)",
      connection: {
        handle: result.connection.handle,
        status: result.connection.status,
        capabilities: result.connection.capabilities,
      },
      profile: result.profile,
      // Explicit honesty
      warnings: [
        "Public profile access only — this does not enable private submission history or source-code retrieval.",
      ],
    });
  } catch (error) {
    const { status, message } = sanitizeError(error);
    return res.status(status).json({ success: false, message });
  }
};

export const status = async (req, res) => {
  try {
    const data = await getLeetCodeStatus(req.user.id);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    const { status: code, message } = sanitizeError(error);
    return res.status(code).json({ success: false, message });
  }
};

export const disconnect = async (req, res) => {
  try {
    const connection = await disconnectLeetCode(req.user.id);
    return res.status(200).json({
      success: true,
      message:
        "LeetCode disconnected. Historical submissions were preserved; sync is disabled.",
      connection: connection
        ? {
            handle: connection.handle,
            status: connection.status,
            syncEnabled: connection.syncEnabled,
          }
        : null,
    });
  } catch (error) {
    const { status: code, message } = sanitizeError(error);
    return res.status(code).json({ success: false, message });
  }
};

export const syncProfile = async (req, res) => {
  try {
    const job = await enqueueLeetCodeProfileSync(req.user.id);
    return res.status(202).json({
      success: true,
      message: "Profile sync job started",
      jobId: job._id,
      status: job.status,
    });
  } catch (error) {
    const { status: code, message } = sanitizeError(error);
    return res.status(code).json({
      success: false,
      message,
      jobId: error.jobId || null,
    });
  }
};

export const syncSubmissions = async (req, res) => {
  try {
    const job = await enqueueLeetCodeSubmissionSync(req.user.id);
    return res.status(202).json({
      success: true,
      message:
        "Submission sync job started (public recent submissions only)",
      jobId: job._id,
      status: job.status,
      limitations: {
        mode: "public_recent_only",
        sourceCode: "unsupported",
      },
    });
  } catch (error) {
    const { status: code, message } = sanitizeError(error);
    return res.status(code).json({
      success: false,
      message,
      jobId: error.jobId || null,
    });
  }
};

export const getSyncJob = async (req, res) => {
  try {
    const job = await getSyncJobForUser(req.params.id, req.user.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Sync job not found",
      });
    }
    return res.status(200).json({
      success: true,
      job: {
        id: job._id,
        platform: job.platform,
        type: job.type,
        status: job.status,
        progress: job.progress,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    const { status: code, message } = sanitizeError(error);
    return res.status(code).json({ success: false, message });
  }
};
