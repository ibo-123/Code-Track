import User from "../models/UserModel.js";
import { getCodeforcesUser } from "../services/codeforces.services.js";

export const getDashboard = async (req, res) => {
  try {
    // Get logged-in user
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If no Codeforces account connected
    if (!user.codeforcesHandle) {
      return res.status(200).json({
        success: true,
        user,
        codeforces: null,
      });
    }

    // Fetch latest Codeforces profile
    const cfUser = await getCodeforcesUser(user.codeforcesHandle);

    return res.status(200).json({
      success: true,
      user,
      codeforces: {
        handle: cfUser.handle,
        rating: cfUser.rating,
        maxRating: cfUser.maxRating,
        rank: cfUser.rank,
        maxRank: cfUser.maxRank,
        contribution: cfUser.contribution,
        avatar: cfUser.avatar,
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};