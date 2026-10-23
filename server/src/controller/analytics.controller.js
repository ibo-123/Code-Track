import User from "../models/UserModel.js";
import Submission from "../models/SubmissionModel.js";
import {
  getRatingHistory,
  isSyncFresh,
  syncCodeforcesData,
} from "../services/codeforces.services.js";

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
          currentStreak: 0,
          longestStreak: 0,
          rank: null,
          history: [],
        },
      });
    }

    // Never block analytics on a full CF sync — use User cache, sync in background
    if (!isSyncFresh(user.lastSyncedAt)) {
      setImmediate(() => {
        syncCodeforcesData(user._id, { force: false }).catch((err) =>
          console.error("Background CF sync (analytics):", err.message)
        );
      });
    }

    let history = [];
    try {
      history = await Promise.race([
        getRatingHistory(user.codeforcesHandle),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("RATING_TIMEOUT")), 5_000)
        ),
      ]);
      if (!Array.isArray(history)) history = [];
    } catch {
      history = [];
    }

    return res.status(200).json({
      success: true,
      analytics: {
        currentRating: user.codeforcesRating ?? 0,
        maxRating: user.codeforcesMaxRating ?? 0,
        contestCount: history.length || user.contestCount || 0,
        problemsSolved: user.totalSolved ?? 0,
        currentStreak: user.currentStreak ?? 0,
        longestStreak: user.longestStreak ?? 0,
        rank: user.codeforcesRank ?? null,
        history,
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

export const getHeatmap = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id }).lean();
    const heatmapData = {};

    submissions.forEach((sub) => {
      const ts =
        sub.creationTimeSeconds != null
          ? sub.creationTimeSeconds * 1000
          : sub.submittedAt
            ? new Date(sub.submittedAt).getTime()
            : null;
      if (!ts) return;

      const d = new Date(ts);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      if (!heatmapData[dateStr]) {
        heatmapData[dateStr] = { count: 0, accepted: 0 };
      }
      heatmapData[dateStr].count++;
      if (sub.verdict === "OK" || sub.normalizedVerdict === "ACCEPTED") {
        heatmapData[dateStr].accepted++;
      }
    });

    // Format for react-calendar-heatmap
    const formattedData = Object.keys(heatmapData).map(date => ({
      date,
      count: heatmapData[date].count,
      accepted: heatmapData[date].accepted
    }));

    res.json({ success: true, heatmap: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProblemDistribution = async (req, res) => {
  try {
    const submissions = await Submission.find({
      userId: req.user.id,
      $or: [{ verdict: "OK" }, { normalizedVerdict: "ACCEPTED" }],
    }).lean();

    const difficultyDist = {};
    const tagDist = {};
    const seenProblems = new Set();

    submissions.forEach((sub) => {
      const idx = sub.problemIndex || sub.metadata?.problemIndex || "";
      const problemId =
        sub.contestId != null && idx
          ? `${sub.contestId}-${idx}`
          : sub.platformProblemId ||
            (sub.metadata?.problemsetName && idx
              ? `${sub.metadata.problemsetName}-${idx}`
              : null);
      if (!problemId || seenProblems.has(problemId)) return;
      seenProblems.add(problemId);

      const rating = sub.rating ?? sub.metadata?.rating;
      if (rating) {
        difficultyDist[rating] = (difficultyDist[rating] || 0) + 1;
      } else {
        difficultyDist.Unrated = (difficultyDist.Unrated || 0) + 1;
      }

      const tags = sub.tags?.length ? sub.tags : sub.metadata?.tags || [];
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          tagDist[tag] = (tagDist[tag] || 0) + 1;
        });
      }
    });

    res.json({
      success: true,
      difficulty: difficultyDist,
      tags: tagDist,
      totalSolved: seenProblems.size
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};