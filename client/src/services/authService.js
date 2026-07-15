import api from "./api";


export const loginUser = async(data)=>{

    const response = await api.post(
        "/auth/login",
        data
    );

    return response.data;
};

export const registerUser = async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};

export const verifyEmailToken = async (token) => {
    const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return response.data;
};