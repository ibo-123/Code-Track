import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getAiStatus } from "../controller/review.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/status", getAiStatus);

export default router;
