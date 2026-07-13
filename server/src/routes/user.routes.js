import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getProfile,
  updateProfile,
} from "../controller/user.controller.js";

const router = express.Router();
router.put("/profile", authMiddleware, updateProfile);
router.get("/profile", authMiddleware, getProfile);

export default router;