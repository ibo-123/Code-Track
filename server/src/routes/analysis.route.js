import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { syncRateLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  getAnalysis,
  retryAnalysisHandler,
} from "../controller/analysis.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:analysisId", getAnalysis);
router.post("/:analysisId/retry", syncRateLimiter, retryAnalysisHandler);

export default router;
