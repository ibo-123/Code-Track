import api from "./api";

export const REVIEW_TYPES = [
  { id: "explain", label: "Explain" },
  { id: "line_by_line", label: "Line by line" },
  { id: "correctness", label: "Correctness" },
  { id: "complexity", label: "Complexity" },
  { id: "optimization", label: "Optimization" },
  { id: "edge_cases", label: "Edge cases" },
];

export const getAiStatus = async () => {
  const response = await api.get("/ai/status");
  return response.data;
};

export const requestAiReview = async (submissionId, reviewType = "explain") => {
  const response = await api.post(`/submissions/${submissionId}/review`, {
    reviewType,
  });
  return response.data;
};

export const getSubmissionReview = async (submissionId, reviewType) => {
  try {
    const response = await api.get(`/submissions/${submissionId}/review`, {
      params: reviewType ? { reviewType } : undefined,
    });
    return response.data.review;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};
