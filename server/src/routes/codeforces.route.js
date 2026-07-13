import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { connectCodeforces } from "../controller/codeforces.controller.js";

const router = express.Router();

router.post("/connect", authMiddleware, connectCodeforces);

export default router;