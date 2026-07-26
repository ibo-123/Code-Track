import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getAnalytics } from "../controller/analytics.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getAnalytics);

export default router;