import User from "../models/UserModel.js";
import {
  getCodeforcesUser,
  getRatingHistory,
  syncCodeforcesData,
} from "../services/codeforces.services.js";
import { upsertCodeforcesConnection } from "../services/platformConnection.service.js";
import { normalizeCodeforcesAvatar } from "../utils/submissionNormalize.js";

export const validateHandle = (handle) => {
  if (!handle || typeof handle !== "string" || handle.trim() === "") {
    throw new Error("Codeforces handle is required");
  }
  return handle.trim();
};

// POST /api/codeforces/connect
export const connectCodeforces = async (req, res) => {
  try {
    const { handle } = req.body;

    if (!handle) {
      return res.status(400).json({
        success: false,
        message: "Handle is required",
      });
    }

    // Fast path: only user.info (one CF call) so connect feels instant
    const cfUser = await getCodeforcesUser(handle);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        codeforcesHandle: cfUser.handle,
        codeforcesRating:
          typeof cfUser.rating === "number" ? cfUser.rating : null,
        codeforcesMaxRating:
          typeof cfUser.maxRating === "number" ? cfUser.maxRating : null,
        codeforcesRank: cfUser.rank || null,
        codeforcesMaxRank: cfUser.maxRank || null,
        codeforcesContribution:
          typeof cfUser.contribution === "number"
            ? cfUser.contribution
            : null,
        codeforcesAvatar: normalizeCodeforcesAvatar(
          cfUser.titlePhoto || cfUser.avatar
        ),
      },
      { new: true }
    ).select("-password");

    // Track authenticated CF connection (handle validated via CF API)
    await upsertCodeforcesConnection(req.user.id, cfUser.handle);

    // Full sync in background — client does not wait for reload
    setImmediate(() => {
      syncCodeforcesData(req.user.id, { force: true }).catch((err) =>
        console.error("Background CF sync after connect:", err.message)
      );
    });

    return res.status(200).json({
      success: true,
      message: "Codeforces account connected successfully",
      codeforces: {
        handle: cfUser.handle,
        rating: typeof cfUser.rating === "number" ? cfUser.rating : null,
        maxRating:
          typeof cfUser.maxRating === "number" ? cfUser.maxRating : null,
        rank: cfUser.rank || null,
        maxRank: cfUser.maxRank || null,
        contribution:
          typeof cfUser.contribution === "number"
            ? cfUser.contribution
            : null,
        avatar: normalizeCodeforcesAvatar(cfUser.titlePhoto || cfUser.avatar),
      },
      user,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "Codeforces handle not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message?.includes("timed out")) {
      return res.status(504).json({
        success: false,
        message: "Codeforces took too long to respond. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to connect Codeforces account",
    });
  }
};

// GET /api/codeforces/history
export const getCodeforcesRatingHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.codeforcesHandle) {
      return res.status(400).json({
        success: false,
        message: "Codeforces account not connected",
      });
    }

    const history = await getRatingHistory(user.codeforcesHandle);

    if (!history || history.length === 0) {
      return res.status(200).json({
        success: true,
        history: [],
      });
    }

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch rating history",
    });
  }
};
