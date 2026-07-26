import User from "../models/UserModel.js";
import { getCodeforcesStats } from "../services/codeforces.services.js";

export const getAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.codeforcesHandle) {
      return res.status(200).json({
        success: true,
        analytics: {
          currentRating: 0,
          maxRating: 0,
          contestCount: 0,
          problemsSolved: 0,
          history: [],
        },
      });
    }

    const stats = await getCodeforcesStats(
      user.codeforcesHandle
    );

    return res.status(200).json({
      success: true,
      analytics: {
        currentRating: stats.rating,
        maxRating: stats.maxRating,
        contestCount: stats.contestCount,
        problemsSolved: stats.problemsSolved,
        history: stats.history,
      },
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};