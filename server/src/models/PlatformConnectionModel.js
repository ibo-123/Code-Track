import mongoose from "mongoose";
import {
  CONNECTION_STATUS,
  CONNECTION_STATUS_VALUES,
  PLATFORM_VALUES,
} from "../constants/platforms.js";

/**
 * External platform connection for a user.
 * Phase 1: Codeforces is `connected` after handle validation.
 * LeetCode username may be `username_saved` — that is NOT authenticated sync.
 * Never store plaintext passwords, session cookies, or auth secrets.
 */
const platformConnectionSchema = new mongoose.Schema(
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
      trim: true,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: CONNECTION_STATUS_VALUES,
      default: CONNECTION_STATUS.DISCONNECTED,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    lastSyncAttemptAt: {
      type: Date,
      default: null,
    },
    /** Sanitized error message only — no secrets or stack traces. */
    lastSyncError: {
      type: String,
      default: null,
      maxlength: 500,
    },
    /**
     * Platform-specific incremental sync cursor.
     * e.g. { lastSubmissionId, from } for Codeforces pagination.
     * LeetCode: { fullSyncCompleted, lastSeenTimestamp, importMode }
     */
    syncCursor: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    syncEnabled: {
      type: Boolean,
      default: true,
    },

    /** Cached public profile snapshot (no secrets). Missing fields stay null — never invent zeros. */
    profileCache: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    lastProfileSyncAt: {
      type: Date,
      default: null,
    },

    lastSubmissionSyncAt: {
      type: Date,
      default: null,
    },

    /**
     * Honest capability flags for the UI.
     * e.g. { profile: true, submissionImport: "public_recent_only", sourceCode: "unsupported" }
     */
    capabilities: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /** Active sync job id (prevents concurrent jobs for same connection). */
    activeJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SyncJob",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

platformConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });
platformConnectionSchema.index({ platform: 1, handle: 1 });

export default mongoose.model("PlatformConnection", platformConnectionSchema);
