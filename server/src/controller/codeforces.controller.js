import User from "../models/UserModel.js";
import { getCodeforcesUser } from "../services/codeforces.services.js";

export const connectCodeforces = async (req, res) => {
  try {
    const { handle } = req.body;

    if (!handle) {
      return res.status(400).json({
        success: false,
        message: "Handle is required",
      });
    }

    const cfUser = await getCodeforcesUser(handle);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        codeforcesHandle: cfUser.handle,
      },
      {
        new: true,
      }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Codeforces account connected successfully",
      codeforces: {
        handle: cfUser.handle,
        rating: cfUser.rating,
        maxRating: cfUser.maxRating,
        rank: cfUser.rank,
        maxRank: cfUser.maxRank,
        avatar: cfUser.avatar,
      },
      user,
    });

  } catch (error) {

    if (error.message === "Codeforces handle not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to connect Codeforces account",
    });
  }
};