import mongoose from "mongoose";

/**
 * Separate collection for submitted source code.
 * Access must be restricted to the owning user (or admin) — enforced in controllers.
 * Never execute this code on the API server.
 */
const submissionSourceSchema = new mongoose.Schema(
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
      unique: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    programmingLanguage: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    contentHash: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

submissionSourceSchema.index({ userId: 1, contentHash: 1 });
submissionSourceSchema.index({ submission: 1, version: 1 });

export default mongoose.model("SubmissionSource", submissionSourceSchema);
