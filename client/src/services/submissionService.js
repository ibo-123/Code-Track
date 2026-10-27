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
 * Fetch stored source code. Returns null + meta when missing (does not throw for 404).
 */
export const getSubmissionSource = async (id) => {
  try {
    const response = await api.get(`/submissions/${id}/source`);
    return {
      ok: true,
      ...response.data,
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return {
        ok: false,
        sourceAvailable: false,
        message: err.response.data?.message || "Source not available",
        submissionUrl: err.response.data?.submissionUrl || null,
        programmingLanguage: err.response.data?.programmingLanguage || null,
        platform: err.response.data?.platform || null,
      };
    }
    throw err;
  }
};

/**
 * Attach / replace source for analysis.
 */
export const saveSubmissionSource = async (
  id,
  { sourceCode, programmingLanguage }
) => {
  const response = await api.put(`/submissions/${id}/source`, {
    sourceCode,
    programmingLanguage,
  });
  return response.data;
};

/**
 * Ask the server to import source from the platform (CF includeSources when possible).
 */
export const fetchSubmissionSourceFromPlatform = async (id) => {
  try {
    const response = await api.post(`/submissions/${id}/fetch-source`);
    return { ok: true, ...response.data };
  } catch (err) {
    return {
      ok: false,
      message: err.response?.data?.message || "Could not import source",
      code: err.response?.data?.code || null,
      submissionUrl: err.response?.data?.submissionUrl || null,
    };
  }
};

/** Alias used by Submissions page SourceModal */
export const fetchSubmissionSource = fetchSubmissionSourceFromPlatform;
