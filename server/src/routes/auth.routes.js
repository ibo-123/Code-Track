import express from "express";

import {
  register,
  login,
  getCurrentUser,
  verifyOtp,
  resendVerificationOtp,
} from "../controller/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/verify-otp", verifyOtp);

router.post(
  "/resend-otp",
  resendVerificationOtp
);

router.post("/login", login);

router.get(
  "/me",
  authMiddleware,
  getCurrentUser
);

export default router;