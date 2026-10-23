import api from "./api";

export const connectLeetCode = async (handle) => {
  const { data } = await api.post("/platforms/leetcode/connect", { handle });
  return data;
};

export const getLeetCodeStatus = async () => {
  const { data } = await api.get("/platforms/leetcode/status");
  return data;
};

export const disconnectLeetCode = async () => {
  const { data } = await api.delete("/platforms/leetcode/connect");
  return data;
};

export const syncLeetCodeProfile = async () => {
  const { data } = await api.post("/platforms/leetcode/sync-profile");
  return data;
};

export const syncLeetCodeSubmissions = async () => {
  const { data } = await api.post("/platforms/leetcode/sync-submissions");
  return data;
};

export const getLeetCodeSyncJob = async (jobId) => {
  const { data } = await api.get(`/platforms/leetcode/sync-jobs/${jobId}`);
  return data.job;
};

/** Poll a sync job until terminal state (or timeout). */
export const waitForSyncJob = async (
  jobId,
  { intervalMs = 800, timeoutMs = 60_000 } = {}
) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await getLeetCodeSyncJob(jobId);
    if (
      ["completed", "partial", "failed", "cancelled"].includes(job?.status)
    ) {
      return job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Sync job timed out");
};
