import mongoose from "mongoose";
import {
  PLATFORM_VALUES,
  SYNC_JOB_STATUS,
  SYNC_JOB_STATUS_VALUES,
  SYNC_JOB_TYPES,
} from "../constants/platforms.js";

/**
 * Background sync job (Phase 2).
 * Used for LeetCode (and reusable for other platforms).
 * No credentials are stored on the job document.
 */
const syncJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: PLATFORM_VALUES,
      required: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: Object.values(SYNC_JOB_TYPES),
      required: true,
    },
    status: {
      type: String,
      enum: SYNC_JOB_STATUS_VALUES,
      default: SYNC_JOB_STATUS.QUEUED,
      index: true,
    },
    progress: {
      imported: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      sourceUnavailable: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      message: { type: String, default: null },
    },
    /** Sanitized user-facing error only. */
    error: {
      type: String,
      default: null,
      maxlength: 500,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

syncJobSchema.index({ userId: 1, platform: 1, createdAt: -1 });

export default mongoose.model("SyncJob", syncJobSchema);
