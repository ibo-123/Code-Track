import mongoose from "mongoose";
import { REVIEW_TYPE_VALUES } from "../ai/provider.js";

const commentSchema = new mongoose.Schema(
  {
    topic: String,
    body: String,
    severity: String,
    confidence: Number,
  },
  { _id: false }
);

const codeReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
      index: true,
    },
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodeAnalysis",
      default: null,
    },
    sourceHash: { type: String, required: true, index: true },
    providerId: { type: String, required: true },
    reviewType: {
      type: String,
      enum: REVIEW_TYPE_VALUES,
      required: true,
    },
    contractVersion: { type: String, default: "1" },
    mock: { type: Boolean, default: false },
    generatedByModel: { type: Boolean, default: false },
    summary: { type: String, default: "" },
    comments: { type: [commentSchema], default: [] },
    limitations: { type: [String], default: [] },
    programmingLanguage: { type: String, default: null },
    problemTitle: { type: String, default: null },
    executed: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null, maxlength: 500 },
  },
  { timestamps: true }
);

codeReviewSchema.index({ userId: 1, submission: 1, createdAt: -1 });
codeReviewSchema.index({
  userId: 1,
  submission: 1,
  sourceHash: 1,
  reviewType: 1,
  providerId: 1,
});

export default mongoose.model("CodeReview", codeReviewSchema);
