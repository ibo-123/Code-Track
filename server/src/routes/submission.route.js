import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { syncRateLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  getRecentSubmissions,
  getSubmissionById,
  getSubmissionSource,
  listSubmissions,
  putSubmissionSource,
  fetchSubmissionSource,
} from "../controller/submission.controller.js";
import {
  analyzeSubmissionHandler,
  getSubmissionAnalysis,
  listSubmissionAnalyses,
} from "../controller/analysis.controller.js";
import {
  reviewSubmissionHandler,
  getSubmissionReview,
  listSubmissionReviews,
} from "../controller/review.controller.js";

const router = express.Router();

// All submission routes require auth — ownership enforced in controllers
router.use(authMiddleware);

router.get("/", listSubmissions);
router.get("/recent", getRecentSubmissions);
router.post("/:id/analyze", syncRateLimiter, analyzeSubmissionHandler);
router.get("/:id/analysis", getSubmissionAnalysis);
router.get("/:id/analyses", listSubmissionAnalyses);
router.post("/:id/review", syncRateLimiter, reviewSubmissionHandler);
router.get("/:id/review", getSubmissionReview);
router.get("/:id/reviews", listSubmissionReviews);
router.get("/:id/source", getSubmissionSource);
router.put("/:id/source", syncRateLimiter, putSubmissionSource);
router.post("/:id/fetch-source", syncRateLimiter, fetchSubmissionSource);
router.get("/:id", getSubmissionById);

export default router;
