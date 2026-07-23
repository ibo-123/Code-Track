import User from "../models/UserModel.js";
import { getCodeforcesStats } from "../services/codeforces.services.js";

export const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // No Codeforces account connected
    if (!user.codeforcesHandle) {
      return res.status(200).json({
        success: true,
        user,
        problemsSolved: 0,
        contestCount: 0,
        codeforces: null,
      });
    }

    let stats = null;

    try {
      stats = await getCodeforcesStats(user.codeforcesHandle);
    } catch (error) {
      console.error("Codeforces Error:", error.message);

      // Optional: clear the invalid handle automatically
      // await User.findByIdAndUpdate(user._id, {
      //   codeforcesHandle: "",
      // });
    }

    return res.status(200).json({
      success: true,
      user,

      problemsSolved: stats?.problemsSolved || 0,
      contestCount: stats?.contestCount || 0,

      codeforces: stats
        ? {
            handle: stats.handle,
            rating: stats.rating,
            maxRating: stats.maxRating,
            rank: stats.rank,
            maxRank: stats.maxRank,
            contribution: stats.contribution,
            avatar: stats.avatar,
          }
        : null,
    });

  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};