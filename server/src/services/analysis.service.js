import CodeAnalysis from "../models/CodeAnalysisModel.js";
import Submission from "../models/SubmissionModel.js";
import SubmissionSource from "../models/SubmissionSourceModel.js";
import {
  analyzeSubmission,
  ANALYZER_VERSION,
  hashSource,
} from "../analysis/analyzeSubmission.js";
import { ANALYSIS_STATUS } from "../analysis/constants.js";

const TERMINAL = new Set([
  ANALYSIS_STATUS.COMPLETED,
  ANALYSIS_STATUS.PARTIAL,
  ANALYSIS_STATUS.FAILED,
]);

/**
 * Find a reusable cached analysis for the same source + analyzer version.
 */
export const findCachedAnalysis = async ({
  userId,
  submissionId,
  sourceHash,
}) => {
  return CodeAnalysis.findOne({
    userId,
    submission: submissionId,
    sourceHash,
    analyzerVersion: ANALYZER_VERSION,
    status: {
      $in: [ANALYSIS_STATUS.COMPLETED, ANALYSIS_STATUS.PARTIAL],
    },
  })
    .sort({ createdAt: -1 })
    .lean();
};

export const getSubmissionOwned = async (submissionId, userId) => {
  return Submission.findOne({ _id: submissionId, userId }).lean();
};

export const getSourceForSubmission = async (submissionId, userId) => {
  return SubmissionSource.findOne({ submission: submissionId, userId }).lean();
};

/**
 * Run or reuse analysis for an owned submission.
 */
export const startAnalysisForSubmission = async (userId, submissionId) => {
  const submission = await getSubmissionOwned(submissionId, userId);
  if (!submission) {
    const err = new Error("Submission not found");
    err.status = 404;
    throw err;
  }

  const source = await getSourceForSubmission(submissionId, userId);
  if (!source?.sourceCode) {
    const err = new Error("Source code is not available for this submission");
    err.status = 404;
    err.code = "SOURCE_UNAVAILABLE";
    throw err;
  }

  const sourceHash = source.contentHash || hashSource(source.sourceCode);

  const cached = await findCachedAnalysis({
    userId,
    submissionId,
    sourceHash,
  });
  if (cached) {
    return { analysis: cached, cached: true };
  }

  // Create processing record then run synchronously (CPU-light heuristics).
  // Background queue can wrap this later without API changes.
  const pending = await CodeAnalysis.create({
    userId,
    submission: submissionId,
    sourceHash,
    analyzerVersion: ANALYZER_VERSION,
    status: ANALYSIS_STATUS.PROCESSING,
    startedAt: new Date(),
  });

  try {
    const result = analyzeSubmission(
      source.sourceCode,
      source.programmingLanguage ||
        submission.programmingLanguage ||
        submission.language,
      {}
    );

    pending.status = result.status;
    pending.language = result.language;
    pending.languageSupport = result.languageSupport;
    pending.syntaxStatus = result.syntaxStatus;
    pending.detectedAlgorithms = result.detectedAlgorithms;
    pending.detectedDataStructures = result.detectedDataStructures;
    pending.timeComplexity = result.timeComplexity;
    pending.spaceComplexity = result.spaceComplexity;
    pending.findings = result.findings;
    pending.suggestions = result.suggestions;
    pending.limitations = result.limitations;
    pending.errorCode = result.errorCode;
    pending.errorMessage = result.errorMessage || null;
    pending.completedAt = result.completedAt || new Date();
    pending.sourceHash = result.sourceHash || sourceHash;
    await pending.save();

    return { analysis: pending.toObject(), cached: false };
  } catch (error) {
    pending.status = ANALYSIS_STATUS.FAILED;
    pending.errorCode = "ANALYZER_CRASH";
    pending.errorMessage = String(error.message || "Analysis failed").slice(
      0,
      500
    );
    pending.completedAt = new Date();
    await pending.save();
    throw error;
  }
};

export const getLatestAnalysis = async (userId, submissionId) => {
  return CodeAnalysis.findOne({ userId, submission: submissionId })
    .sort({ createdAt: -1 })
    .lean();
};

export const getAnalysisById = async (userId, analysisId) => {
  return CodeAnalysis.findOne({ _id: analysisId, userId }).lean();
};

export const listAnalyses = async (userId, submissionId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const filter = { userId, submission: submissionId };
  const [items, total] = await Promise.all([
    CodeAnalysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CodeAnalysis.countDocuments(filter),
  ]);
  return {
    analyses: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const retryAnalysis = async (userId, analysisId) => {
  const existing = await getAnalysisById(userId, analysisId);
  if (!existing) {
    const err = new Error("Analysis not found");
    err.status = 404;
    throw err;
  }
  if (
    existing.status !== ANALYSIS_STATUS.FAILED &&
    existing.status !== ANALYSIS_STATUS.PARTIAL
  ) {
    const err = new Error("Only failed or partial analyses can be retried");
    err.status = 400;
    throw err;
  }
  // Force new run by temporarily not using cache: bump via re-analyze
  // Delete is not needed — startAnalysis creates new record; cache matches
  // completed/partial only. For retry of partial, we force by creating with
  // a processing overwrite path: call analyze again after marking.
  return startAnalysisForSubmissionForced(userId, existing.submission);
};

/** Like startAnalysis but skips cache (for retry). */
export const startAnalysisForSubmissionForced = async (userId, submissionId) => {
  const submission = await getSubmissionOwned(submissionId, userId);
  if (!submission) {
    const err = new Error("Submission not found");
    err.status = 404;
    throw err;
  }
  const source = await getSourceForSubmission(submissionId, userId);
  if (!source?.sourceCode) {
    const err = new Error("Source code is not available for this submission");
    err.status = 404;
    throw err;
  }

  const sourceHash = source.contentHash || hashSource(source.sourceCode);
  const pending = await CodeAnalysis.create({
    userId,
    submission: submissionId,
    sourceHash,
    analyzerVersion: ANALYZER_VERSION,
    status: ANALYSIS_STATUS.PROCESSING,
    startedAt: new Date(),
  });

  const result = analyzeSubmission(
    source.sourceCode,
    source.programmingLanguage ||
      submission.programmingLanguage ||
      submission.language,
    {}
  );

  Object.assign(pending, {
    status: result.status,
    language: result.language,
    languageSupport: result.languageSupport,
    syntaxStatus: result.syntaxStatus,
    detectedAlgorithms: result.detectedAlgorithms,
    detectedDataStructures: result.detectedDataStructures,
    timeComplexity: result.timeComplexity,
    spaceComplexity: result.spaceComplexity,
    findings: result.findings,
    suggestions: result.suggestions,
    limitations: result.limitations,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage || null,
    completedAt: result.completedAt || new Date(),
    sourceHash: result.sourceHash || sourceHash,
  });
  await pending.save();
  return { analysis: pending.toObject(), cached: false };
};

export { ANALYZER_VERSION, TERMINAL };
