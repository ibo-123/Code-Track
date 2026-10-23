import api from "./api";

/**
 * Recent submissions (dashboard). Preserves prior response shape.
 */
export const getRecentSubmissions = async (limit = 10) => {
  const response = await api.get(`/submissions/recent`, {
    params: { limit },
  });
  return response.data.submissions;
};

/**
 * Paginated / filtered submission list (Phase 1 unified API).
 * @param {object} params page, limit, platform, verdict, language, q, from, to, sort, problemId
 */
export const listSubmissions = async (params = {}) => {
  const response = await api.get(`/submissions`, { params });
  return response.data;
};

export const getSubmission = async (id) => {
  const response = await api.get(`/submissions/${id}`);
  return response.data.submission;
};

/**
 * Fetch source code when available. Throws / returns 404 when missing.
 */
export const getSubmissionSource = async (id) => {
  const response = await api.get(`/submissions/${id}/source`);
  return response.data;
};
