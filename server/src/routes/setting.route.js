import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  changePassword,
  updateProfile,
} from "../controller/setting.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.put("/change-password", authMiddleware, changePassword);
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("avatar"),
  updateProfile
);

export default router;
