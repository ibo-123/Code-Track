import CodeReview from "../models/CodeReviewModel.js";
import Submission from "../models/SubmissionModel.js";
import SubmissionSource from "../models/SubmissionSourceModel.js";
import CodeAnalysis from "../models/CodeAnalysisModel.js";
import { getActiveProvider, REVIEW_TYPE_VALUES } from "../ai/index.js";
import { REVIEW_TYPES } from "../ai/provider.js";
import { hashSource } from "../analysis/analyzeSubmission.js";

const getOwnedSubmission = async (submissionId, userId) =>
  Submission.findOne({ _id: submissionId, userId }).lean();

const getOwnedSource = async (submissionId, userId) =>
  SubmissionSource.findOne({ submission: submissionId, userId }).lean();

/**
 * Run AI code review for an owned submission (requires stored source).
 */
export const startReviewForSubmission = async (
  userId,
  submissionId,
  { reviewType = REVIEW_TYPES.EXPLAIN } = {}
) => {
  if (!REVIEW_TYPE_VALUES.includes(reviewType)) {
    const err = new Error(
      `Unsupported review type. Allowed: ${REVIEW_TYPE_VALUES.join(", ")}`
    );
    err.status = 400;
    err.code = "UNSUPPORTED_REVIEW_TYPE";
    throw err;
  }

  const submission = await getOwnedSubmission(submissionId, userId);
  if (!submission) {
    const err = new Error("Submission not found");
    err.status = 404;
    throw err;
  }

  const source = await getOwnedSource(submissionId, userId);
  if (!source?.sourceCode) {
    const err = new Error("Source code is not available for this submission");
    err.status = 404;
    err.code = "SOURCE_UNAVAILABLE";
    throw err;
  }

  const sourceHash = source.contentHash || hashSource(source.sourceCode);
  const analysis = await CodeAnalysis.findOne({
    userId,
    submission: submissionId,
    sourceHash,
    status: { $in: ["completed", "partial"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const analysisContext = analysis
    ? {
        language: analysis.language,
        languageSupport: analysis.languageSupport,
        detectedAlgorithms: analysis.detectedAlgorithms,
        detectedDataStructures: analysis.detectedDataStructures,
        timeComplexity: analysis.timeComplexity,
        spaceComplexity: analysis.spaceComplexity,
        findings: analysis.findings,
        suggestions: analysis.suggestions,
        limitations: analysis.limitations,
      }
    : null;

  const provider = getActiveProvider();
  const review = await provider.generateCodeReview(
    {
      sourceCode: source.sourceCode,
      programmingLanguage:
        source.programmingLanguage ||
        submission.language ||
        submission.programmingLanguage,
      reviewType,
      problemTitle: submission.problemTitle || submission.problemName,
      analysisContext,
    },
    { timeoutMs: 60_000 }
  );

  const saved = await CodeReview.create({
    userId,
    submission: submissionId,
    analysis: analysis?._id || null,
    sourceHash,
    providerId: review.providerId,
    reviewType: review.reviewType,
    contractVersion: review.contractVersion,
    mock: review.mock,
    generatedByModel: review.generatedByModel,
    summary: review.summary,
    comments: review.comments,
    limitations: review.limitations,
    programmingLanguage: review.programmingLanguage,
    problemTitle: review.problemTitle,
    executed: false,
    verified: false,
  });

  return { review: saved.toObject(), providerId: provider.id };
};

export const getLatestReview = async (userId, submissionId, reviewType) => {
  const filter = { userId, submission: submissionId };
  if (reviewType) filter.reviewType = reviewType;
  return CodeReview.findOne(filter).sort({ createdAt: -1 }).lean();
};

export const listReviews = async (
  userId,
  submissionId,
  { page = 1, limit = 20 } = {}
) => {
  const skip = (page - 1) * limit;
  const filter = { userId, submission: submissionId };
  const [items, total] = await Promise.all([
    CodeReview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CodeReview.countDocuments(filter),
  ]);
  return {
    reviews: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export { REVIEW_TYPE_VALUES, REVIEW_TYPES };
