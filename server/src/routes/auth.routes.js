import express from "express";
import {
  register,
  login,
  getCurrentUser,
  verifyEmail,
} from "../controller/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import { testEmail } from "../controller/auth.controller.js";

const router = express.Router();
router.get("/test-email", testEmail);
router.get("/verify-email", verifyEmail);
router.post("/register", register);

router.post("/login", login);

router.get("/me", authMiddleware, getCurrentUser);

export default router;