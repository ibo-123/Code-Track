import axios from "axios";

const BASE_URL = "https://codeforces.com/api";

export const getCodeforcesUser = async (handle) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/user.info?handles=${handle}`
    );

    if (response.data.status !== "OK") {
      throw new Error("Codeforces API returned an error");
    }

    return response.data.result[0];
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error("Codeforces handle not found");
    }

    throw new Error("Unable to connect to Codeforces");
  }
};