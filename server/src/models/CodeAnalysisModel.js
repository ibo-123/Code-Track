import mongoose from "mongoose";
import {
  ANALYSIS_STATUS_VALUES,
  ANALYSIS_STATUS,
  LANGUAGE_SUPPORT,
} from "../analysis/constants.js";

const detectionSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    confidence: Number,
    evidence: [String],
  },
  { _id: false }
);

const complexitySchema = new mongoose.Schema(
  {
    worstCase: String,
    averageCase: String,
    bestCase: String,
    confidence: Number,
    assumptions: [String],
    auxiliary: String,
    includesInputStorage: Boolean,
  },
  { _id: false }
);

const findingSchema = new mongoose.Schema(
  {
    ruleId: String,
    severity: String,
    title: String,
    explanation: String,
    evidence: String,
    location: mongoose.Schema.Types.Mixed,
    suggestedFix: String,
    confidence: Number,
  },
  { _id: false }
);

const suggestionSchema = new mongoose.Schema(
  {
    id: String,
    currentPattern: String,
    proposedImprovement: String,
    rationale: String,
    expectedComplexityImpact: String,
    preconditions: [String],
    tradeOffs: [String],
  },
  { _id: false }
);

const codeAnalysisSchema = new mongoose.Schema(
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
    sourceHash: {
      type: String,
      required: true,
      index: true,
    },
    analyzerVersion: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ANALYSIS_STATUS_VALUES,
      default: ANALYSIS_STATUS.QUEUED,
      index: true,
    },
    language: { type: String, default: null },
    languageSupport: {
      type: String,
      enum: Object.values(LANGUAGE_SUPPORT),
      default: LANGUAGE_SUPPORT.UNSUPPORTED,
    },
    syntaxStatus: { type: String, default: null },
    detectedAlgorithms: { type: [detectionSchema], default: [] },
    detectedDataStructures: { type: [detectionSchema], default: [] },
    timeComplexity: { type: complexitySchema, default: null },
    spaceComplexity: { type: complexitySchema, default: null },
    findings: { type: [findingSchema], default: [] },
    suggestions: { type: [suggestionSchema], default: [] },
    limitations: { type: [String], default: [] },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null, maxlength: 500 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Cache lookup: same user + submission + hash + analyzer version
codeAnalysisSchema.index(
  { userId: 1, submission: 1, sourceHash: 1, analyzerVersion: 1, status: 1 }
);
codeAnalysisSchema.index({ submission: 1, createdAt: -1 });
codeAnalysisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("CodeAnalysis", codeAnalysisSchema);
