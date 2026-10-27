import api from "./api";

export const analyzeSubmission = async (submissionId) => {
  const response = await api.post(`/submissions/${submissionId}/analyze`);
  return response.data;
};

export const getSubmissionAnalysis = async (submissionId) => {
  try {
    const response = await api.get(`/submissions/${submissionId}/analysis`);
    return response.data.analysis;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const listSubmissionAnalyses = async (submissionId, params = {}) => {
  const response = await api.get(`/submissions/${submissionId}/analyses`, {
    params,
  });
  return response.data;
};

export const getAnalysis = async (analysisId) => {
  const response = await api.get(`/analyses/${analysisId}`);
  return response.data.analysis;
};

export const retryAnalysis = async (analysisId) => {
  const response = await api.post(`/analyses/${analysisId}/retry`);
  return response.data;
};
