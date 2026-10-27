import {
  startReviewForSubmission,
  getLatestReview,
  listReviews,
  REVIEW_TYPE_VALUES,
  REVIEW_TYPES,
} from "../services/review.service.js";
import { getActiveProvider } from "../ai/index.js";

const handleError = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    message: error.message || "AI review failed",
    code: error.code || null,
  });
};

/**
 * POST /api/submissions/:id/review
 * body: { reviewType?: string }
 */
export const reviewSubmissionHandler = async (req, res) => {
  try {
    const reviewType =
      req.body?.reviewType || REVIEW_TYPES.EXPLAIN;
    const { review, providerId } = await startReviewForSubmission(
      req.user.id,
      req.params.id,
      { reviewType }
    );
    return res.status(201).json({
      success: true,
      providerId,
      reviewId: review._id,
      review,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/submissions/:id/review?reviewType=
 */
export const getSubmissionReview = async (req, res) => {
  try {
    const review = await getLatestReview(
      req.user.id,
      req.params.id,
      req.query.reviewType || undefined
    );
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No AI review found for this submission",
      });
    }
    return res.status(200).json({ success: true, review });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/submissions/:id/reviews
 */
export const listSubmissionReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const result = await listReviews(req.user.id, req.params.id, {
      page,
      limit,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/ai/status
 */
export const getAiStatus = async (_req, res) => {
  const provider = getActiveProvider();
  return res.status(200).json({
    success: true,
    providerId: provider.id,
    reviewTypes: REVIEW_TYPE_VALUES,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
  });
};
