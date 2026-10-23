import Submission from "../models/SubmissionModel.js";
import {
  getSubmissionForUser,
  getSubmissionSourceForUser,
  listUserSubmissions,
  saveSubmissionSource,
} from "../services/submission.service.js";
import { PLATFORM_VALUES, SOURCE_STATUS } from "../constants/platforms.js";
import { MAX_SOURCE_BYTES } from "../analysis/version.js";

const isAdmin = (req) => req.user?.role === "admin";

/**
 * GET /api/submissions/recent?limit=10
 * Backward-compatible recent list for dashboard.
 */
export const getRecentSubmissions = async (req, res) => {
  try {
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const submissions = await Submission.find({ userId: req.user.id })
      .sort({ submittedAt: -1, creationTimeSeconds: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Get recent submissions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent submissions",
    });
  }
};

/**
 * GET /api/submissions
 * Paginated, filterable list scoped to the authenticated user.
 *
 * Query: page, limit, platform, verdict, language|programmingLanguage,
 *        problemId|platformProblemId, q|search, from, to, sort=asc|desc
 */
export const listSubmissions = async (req, res) => {
  try {
    if (req.query.platform) {
      const p = String(req.query.platform).toLowerCase();
      if (!PLATFORM_VALUES.includes(p)) {
        return res.status(400).json({
          success: false,
          message: `Invalid platform. Allowed: ${PLATFORM_VALUES.join(", ")}`,
        });
      }
    }

    // Never accept another user's id from query params
    if (req.query.userId && String(req.query.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot list another user's submissions",
      });
    }

    const result = await listUserSubmissions(req.user.id, req.query);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("List submissions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to list submissions",
    });
  }
};

/**
 * GET /api/submissions/:id
 */
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await getSubmissionForUser(req.params.id, req.user.id, {
      isAdmin: isAdmin(req),
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Get submission error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch submission",
    });
  }
};

/**
 * GET /api/submissions/:id/source
 * Returns source only when available and requester is owner or admin.
 */
export const getSubmissionSource = async (req, res) => {
  try {
    const result = await getSubmissionSourceForUser(
      req.params.id,
      req.user.id,
      { isAdmin: isAdmin(req) }
    );

    if (result.error === "not_found") {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (result.error === "forbidden") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (result.error === "no_source") {
      return res.status(404).json({
        success: false,
        message: "Source code is not available for this submission",
        sourceAvailable: false,
      });
    }

    return res.status(200).json({
      success: true,
      submissionId: result.submission._id,
      platform: result.submission.platform,
      programmingLanguage:
        result.source.programmingLanguage ||
        result.submission.programmingLanguage,
      contentHash: result.source.contentHash,
      version: result.source.version,
      sourceCode: result.source.sourceCode,
      updatedAt: result.source.updatedAt,
    });
  } catch (error) {
    console.error("Get submission source error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch submission source",
    });
  }
};

/**
 * PUT /api/submissions/:id/source
 * Attach or replace source code for analysis (owner only).
 */
export const putSubmissionSource = async (req, res) => {
  try {
    const { sourceCode, programmingLanguage } = req.body || {};
    if (!sourceCode || typeof sourceCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "sourceCode is required",
      });
    }
    if (Buffer.byteLength(sourceCode, "utf8") > MAX_SOURCE_BYTES) {
      return res.status(413).json({
        success: false,
        message: `Source exceeds ${MAX_SOURCE_BYTES} byte limit`,
      });
    }

    const source = await saveSubmissionSource({
      userId: req.user.id,
      submissionId: req.params.id,
      sourceCode,
      programmingLanguage,
    });

    return res.status(200).json({
      success: true,
      message: "Source saved",
      contentHash: source.contentHash,
      version: source.version,
      sourceStatus: SOURCE_STATUS.AVAILABLE,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to save source",
    });
  }
};
