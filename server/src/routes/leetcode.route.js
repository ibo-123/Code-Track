import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { syncRateLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  connect,
  disconnect,
  getSyncJob,
  status,
  syncProfile,
  syncSubmissions,
} from "../controller/leetcode.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/connect", syncRateLimiter, connect);
router.get("/status", status);
router.delete("/connect", disconnect);
router.post("/sync-profile", syncRateLimiter, syncProfile);
router.post("/sync-submissions", syncRateLimiter, syncSubmissions);
router.get("/sync-jobs/:id", getSyncJob);

export default router;
