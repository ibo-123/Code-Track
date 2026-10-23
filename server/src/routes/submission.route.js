import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { syncRateLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  getRecentSubmissions,
  getSubmissionById,
  getSubmissionSource,
  listSubmissions,
  putSubmissionSource,
} from "../controller/submission.controller.js";
import {
  analyzeSubmissionHandler,
  getSubmissionAnalysis,
  listSubmissionAnalyses,
} from "../controller/analysis.controller.js";

const router = express.Router();

// All submission routes require auth — ownership enforced in controllers
router.use(authMiddleware);

router.get("/", listSubmissions);
router.get("/recent", getRecentSubmissions);
router.post("/:id/analyze", syncRateLimiter, analyzeSubmissionHandler);
router.get("/:id/analysis", getSubmissionAnalysis);
router.get("/:id/analyses", listSubmissionAnalyses);
router.get("/:id/source", getSubmissionSource);
router.put("/:id/source", syncRateLimiter, putSubmissionSource);
router.get("/:id", getSubmissionById);

export default router;
