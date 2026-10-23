import User from "../models/UserModel.js";

import {
  getContestList,
  getContestHistory as getHistory,
} from "../services/codeforces.services.js";

export const getUpcomingContests = async (req, res) => {
  try {
    const contests = await getContestList();
    const now = Math.floor(Date.now() / 1000);

    // Next upcoming only — sorted soonest-first, capped for a fast UI
    const upcoming = contests
      .filter(
        (contest) =>
          contest.phase === "BEFORE" &&
          contest.startTimeSeconds > now - 3600
      )
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
      .slice(0, 40);

    res.json({
      success: true,
      contests: upcoming,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getContestHistory = async (req, res) => {

  try {

    const user = await User.findById(req.user.id);

    if (!user.codeforcesHandle) {

      return res.json({
        success: true,
        history: [],
      });

    }

    const history = await getHistory(
      user.codeforcesHandle
    );

    res.json({
      success: true,
      history,
    });

  }

  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};