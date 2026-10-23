import api from "./api";

export const getDashboard = async ({ refresh = false } = {}) => {
  const response = await api.get("/dashboard", {
    params: refresh ? { refresh: true } : undefined,
  });
  return response.data;
};
