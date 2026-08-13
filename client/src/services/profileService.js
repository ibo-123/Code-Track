import { api } from "./api.js";

export const updateProfile = async (profileData, avatarFile) => {
  const formData = new FormData();

  formData.append("name", profileData.name);
  formData.append("email", profileData.email);
  formData.append("phone", profileData.phone);
  formData.append("location", profileData.location);

  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  const response = await api.put(
    "/users/profile",
    formData
  );

  return response.data;
};