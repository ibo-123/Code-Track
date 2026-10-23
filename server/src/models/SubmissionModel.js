import mongoose from "mongoose";
import {
  PLATFORM_VALUES,
  PLATFORMS,
  SOURCE_STATUS,
  SOURCE_STATUS_VALUES,
} from "../constants/platforms.js";

/**
 * Unified submission document (Phase 1).
 *
 * Conventions:
 * - Ownership field remains `userId` (existing CodeTrack convention).
 * - Legacy CF fields (`submissionId`, `problemName`, `problemIndex`, `language`,
 *   `creationTimeSeconds`, `rating`, `tags`) are kept populated for
 *   dashboard / analytics / frontend compatibility.
 * - Uniqueness is (userId, platform, platformSubmissionId) — NOT global
 *   on platformSubmissionId / submissionId.
 */

const metadataSchema = new mongoose.Schema(
  {
    rawVerdict: { type: String, default: null },
    rawLanguage: { type: String, default: null },
    problemIndex: { type: String, default: null },
    rating: { type: Number, default: null },
    tags: { type: [String], default: [] },
    authorHandle: { type: String, default: null },
    participantType: { type: String, default: null },
    testset: { type: String, default: null },
    passedTestCount: { type: Number, default: null },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
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
      default: PLATFORMS.CODEFORCES,
      lowercase: true,
      trim: true,
      index: true,
    },

    /** Original submission id from the source platform (string). */
    platformSubmissionId: {
      type: String,
      required: true,
      trim: true,
    },

    platformProblemId: {
      type: String,
      default: null,
      trim: true,
    },

    problemTitle: {
      type: String,
      default: null,
      trim: true,
    },

    problemUrl: {
      type: String,
      default: null,
      trim: true,
    },

    /** Platform contest id as string (CF contest numbers stored as strings). */
    contestId: {
      type: String,
      default: null,
    },

    programmingLanguage: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    /**
     * Stored as platform-native verdict for CF ("OK", …) so existing
     * `verdict: "OK"` queries keep working. See also `normalizedVerdict`.
     */
    verdict: {
      type: String,
      required: true,
    },

    normalizedVerdict: {
      type: String,
      default: null,
      index: true,
    },

    executionTimeMs: {
      type: Number,
      default: null,
    },

    memoryBytes: {
      type: Number,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },

    syncedAt: {
      type: Date,
      default: Date.now,
    },

    sourceAvailable: {
      type: Boolean,
      default: false,
    },

    /**
     * Distinct from sourceAvailable boolean — explains *why* source is missing.
     * Phase 2 LeetCode public import uses `unsupported` (no session / no source API).
     */
    sourceStatus: {
      type: String,
      enum: SOURCE_STATUS_VALUES,
      default: SOURCE_STATUS.NOT_IMPORTED,
    },

    sourceHash: {
      type: String,
      default: null,
    },

    metadata: {
      type: metadataSchema,
      default: () => ({}),
    },

    // ── Legacy Codeforces fields (compat) ─────────────────────────────
    /** @deprecated Prefer platformSubmissionId. Kept for dual-read. */
    submissionId: {
      type: Number,
      default: null,
    },
    /** @deprecated Prefer problemTitle. */
    problemName: {
      type: String,
      default: null,
    },
    problemIndex: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    /** @deprecated Prefer programmingLanguage. */
    language: {
      type: String,
      default: null,
    },
    /** @deprecated Prefer submittedAt. */
    creationTimeSeconds: {
      type: Number,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Primary uniqueness: same public CF id can exist for many users
submissionSchema.index(
  { userId: 1, platform: 1, platformSubmissionId: 1 },
  { unique: true }
);

submissionSchema.index({ userId: 1, platform: 1, submittedAt: -1 });
submissionSchema.index({ userId: 1, platform: 1, platformProblemId: 1 });
submissionSchema.index({ userId: 1, platform: 1, normalizedVerdict: 1 });
submissionSchema.index({ userId: 1, sourceHash: 1 }, { sparse: true });

// Legacy compound (non-global) — useful during dual-read period
submissionSchema.index(
  { userId: 1, submissionId: 1 },
  {
    unique: true,
    partialFilterExpression: { submissionId: { $type: "number" } },
  }
);

submissionSchema.pre("validate", function preValidate() {
  // Backfill unified fields from legacy when migrating older writers
  if (!this.platform) this.platform = PLATFORMS.CODEFORCES;

  if (!this.platformSubmissionId && this.submissionId != null) {
    this.platformSubmissionId = String(this.submissionId);
  }

  if (!this.problemTitle && this.problemName) {
    this.problemTitle = this.problemName;
  }

  if (!this.programmingLanguage && this.language) {
    this.programmingLanguage = this.language;
  }

  if (!this.submittedAt && this.creationTimeSeconds) {
    this.submittedAt = new Date(this.creationTimeSeconds * 1000);
  }

  // Keep contestId as string in unified model; tolerate legacy Number
  if (this.contestId != null && typeof this.contestId !== "string") {
    this.contestId = String(this.contestId);
  }
});

export default mongoose.model("Submission", submissionSchema);
