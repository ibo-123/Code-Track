import express from "express";

import {
  register,
  login,
  getCurrentUser,
  verifyEmail,
  testEmail,
} from "../controller/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import {
  resendVerificationEmail,
} from "../controller/auth.controller.js";

const router = express.Router();

// Authentication
router.post("/register", register);
router.post("/login", login);

// Email verification
router.get("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  resendVerificationEmail
);
// Current user
router.get("/me", authMiddleware, getCurrentUser);

// Development only (optional)
// router.get("/test-email", testEmail);

export default router;