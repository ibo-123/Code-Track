import api from "./api.js";

export const updateProfile = async (profileData, avatarFile) => {
  const formData = new FormData();

  if (profileData.name != null) {
    formData.append("name", profileData.name);
  }
  if (profileData.phone != null) {
    formData.append("phoneNumber", profileData.phone);
  }
  if (profileData.phoneNumber != null) {
    formData.append("phoneNumber", profileData.phoneNumber);
  }
  if (profileData.location != null) {
    formData.append("location", profileData.location);
  }

  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }

  const response = await api.put("/users/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
