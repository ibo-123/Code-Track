import {
  startAnalysisForSubmission,
  getLatestAnalysis,
  getAnalysisById,
  listAnalyses,
  retryAnalysis,
} from "../services/analysis.service.js";

const handleError = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    message: error.message || "Analysis failed",
    code: error.code || null,
  });
};

export const analyzeSubmissionHandler = async (req, res) => {
  try {
    const { analysis, cached } = await startAnalysisForSubmission(
      req.user.id,
      req.params.id
    );
    return res.status(cached ? 200 : 201).json({
      success: true,
      cached,
      analysisId: analysis._id,
      status: analysis.status,
      analysis,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getSubmissionAnalysis = async (req, res) => {
  try {
    const analysis = await getLatestAnalysis(req.user.id, req.params.id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "No analysis found for this submission",
      });
    }
    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    return handleError(res, error);
  }
};

export const listSubmissionAnalyses = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const result = await listAnalyses(req.user.id, req.params.id, {
      page,
      limit,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAnalysis = async (req, res) => {
  try {
    const analysis = await getAnalysisById(req.user.id, req.params.analysisId);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }
    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    return handleError(res, error);
  }
};

export const retryAnalysisHandler = async (req, res) => {
  try {
    const { analysis, cached } = await retryAnalysis(
      req.user.id,
      req.params.analysisId
    );
    return res.status(201).json({
      success: true,
      cached,
      analysisId: analysis._id,
      status: analysis.status,
      analysis,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
