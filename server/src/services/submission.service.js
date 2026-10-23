import mongoose from "mongoose";
import Submission from "../models/SubmissionModel.js";
import SubmissionSource from "../models/SubmissionSourceModel.js";
import {
  hashSourceContent,
  isAcceptedVerdict,
  mapCodeforcesSubmission,
} from "../utils/submissionNormalize.js";
import { PLATFORMS } from "../constants/platforms.js";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Bulk upsert Codeforces submissions into the unified model.
 * Dedupes on (userId, platform, platformSubmissionId).
 * Partial failure of one op does not abort the batch (ordered: false).
 */
export const upsertCodeforcesSubmissions = async (userId, rawSubmissions) => {
  if (!Array.isArray(rawSubmissions) || rawSubmissions.length === 0) {
    return { upserted: 0, matched: 0 };
  }

  const ops = rawSubmissions.map((sub) => {
    const doc = mapCodeforcesSubmission(userId, sub);
    const {
      userId: uid,
      platform,
      platformSubmissionId,
      ...fields
    } = doc;

    return {
      updateOne: {
        filter: {
          userId: uid,
          platform,
          platformSubmissionId,
        },
        update: {
          $set: {
            userId: uid,
            platform,
            platformSubmissionId,
            ...fields,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Submission.bulkWrite(ops, { ordered: false });
  return {
    upserted: result.upsertedCount || 0,
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0,
  };
};

export const recomputeStatsFromDb = async (userId) => {
  const accepted = await Submission.find({
    userId,
    $or: [{ verdict: "OK" }, { normalizedVerdict: "ACCEPTED" }],
  })
    .select(
      "contestId problemIndex platformProblemId rating creationTimeSeconds submittedAt metadata.problemIndex metadata.problemsetName metadata.rating"
    )
    .lean();

  const solvedProblems = new Set();
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;

  const difficultyBucket = (rating) => {
    if (!rating) return null;
    if (rating <= 1200) return "easy";
    if (rating <= 1800) return "medium";
    return "hard";
  };

  for (const sub of accepted) {
    const idx = sub.problemIndex || sub.metadata?.problemIndex || "";
    // Prefer contestId-index so legacy "1900A" and new "1900-A" collapse
    const problemId =
      sub.contestId != null && idx
        ? `${sub.contestId}-${idx}`
        : sub.platformProblemId ||
          (sub.metadata?.problemsetName && idx
            ? `${sub.metadata.problemsetName}-${idx}`
            : null);
    if (!problemId || solvedProblems.has(problemId)) continue;
    solvedProblems.add(problemId);
    const rating = sub.rating ?? sub.metadata?.rating;
    const bucket = difficultyBucket(rating);
    if (bucket === "easy") easySolved++;
    else if (bucket === "medium") mediumSolved++;
    else if (bucket === "hard") hardSolved++;
  }

  const allSubs = await Submission.find({ userId })
    .select("creationTimeSeconds submittedAt")
    .lean();

  const forStreaks = allSubs.map((s) => ({
    creationTimeSeconds:
      s.creationTimeSeconds ??
      (s.submittedAt ? Math.floor(new Date(s.submittedAt).getTime() / 1000) : 0),
  }));

  return {
    problemsSolved: solvedProblems.size,
    easySolved,
    mediumSolved,
    hardSolved,
    submissionsForStreak: forStreaks,
  };
};

const parsePositiveInt = (value, fallback, { min = 1, max = MAX_PAGE_SIZE } = {}) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * List submissions for the authenticated user with filters + pagination.
 */
export const listUserSubmissions = async (userId, query = {}) => {
  const page = parsePositiveInt(query.page, 1, { min: 1, max: 10_000 });
  const limit = parsePositiveInt(query.limit, DEFAULT_PAGE_SIZE, {
    min: 1,
    max: MAX_PAGE_SIZE,
  });
  const skip = (page - 1) * limit;

  const filter = { userId };

  if (query.platform) {
    filter.platform = String(query.platform).toLowerCase().trim();
  }

  if (query.verdict) {
    const v = String(query.verdict).trim();
    // Accept both legacy OK and normalized ACCEPTED
    if (v.toUpperCase() === "ACCEPTED" || v.toUpperCase() === "OK") {
      filter.$or = [{ verdict: "OK" }, { normalizedVerdict: "ACCEPTED" }];
    } else {
      filter.$or = [
        { verdict: v },
        { normalizedVerdict: v.toUpperCase() },
      ];
    }
  }

  if (query.language || query.programmingLanguage) {
    const lang = String(query.language || query.programmingLanguage)
      .toLowerCase()
      .trim();
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { programmingLanguage: lang },
        { language: new RegExp(lang, "i") },
      ],
    });
  }

  if (query.problemId || query.platformProblemId) {
    filter.platformProblemId = String(
      query.problemId || query.platformProblemId
    ).trim();
  }

  if (query.q || query.search) {
    const q = String(query.q || query.search).trim();
    if (q) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { problemTitle: new RegExp(q, "i") },
          { problemName: new RegExp(q, "i") },
          { platformProblemId: new RegExp(q, "i") },
        ],
      });
    }
  }

  if (query.from || query.to) {
    filter.submittedAt = {};
    if (query.from) {
      const from = new Date(query.from);
      if (!Number.isNaN(from.getTime())) filter.submittedAt.$gte = from;
    }
    if (query.to) {
      const to = new Date(query.to);
      if (!Number.isNaN(to.getTime())) filter.submittedAt.$lte = to;
    }
    if (Object.keys(filter.submittedAt).length === 0) delete filter.submittedAt;
  }

  const sortDir = String(query.sort || "desc").toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Submission.find(filter)
      .sort({ submittedAt: sortDir, creationTimeSeconds: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(filter),
  ]);

  return {
    submissions: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: skip + items.length < total,
    },
  };
};

export const getSubmissionForUser = async (submissionId, userId, { isAdmin = false } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(submissionId)) return null;

  const filter = { _id: submissionId };
  if (!isAdmin) filter.userId = userId;

  return Submission.findOne(filter).lean();
};

export const getSubmissionSourceForUser = async (
  submissionId,
  userId,
  { isAdmin = false } = {}
) => {
  const submission = await getSubmissionForUser(submissionId, userId, { isAdmin });
  if (!submission) return { error: "not_found" };

  if (!isAdmin && String(submission.userId) !== String(userId)) {
    return { error: "forbidden" };
  }

  if (!submission.sourceAvailable) {
    return { error: "no_source", submission };
  }

  const source = await SubmissionSource.findOne({
    submission: submission._id,
    ...(isAdmin ? {} : { userId }),
  }).lean();

  if (!source) {
    return { error: "no_source", submission };
  }

  return { submission, source };
};

/**
 * Store or replace source for a submission owned by userId.
 */
export const saveSubmissionSource = async ({
  userId,
  submissionId,
  sourceCode,
  programmingLanguage,
}) => {
  if (!sourceCode || typeof sourceCode !== "string") {
    throw new Error("sourceCode is required");
  }

  const submission = await Submission.findOne({ _id: submissionId, userId });
  if (!submission) {
    const err = new Error("Submission not found");
    err.status = 404;
    throw err;
  }

  const contentHash = hashSourceContent(sourceCode);
  const existing = await SubmissionSource.findOne({ submission: submissionId });

  let source;
  if (existing) {
    existing.sourceCode = sourceCode;
    existing.contentHash = contentHash;
    existing.programmingLanguage =
      programmingLanguage || existing.programmingLanguage;
    existing.version = (existing.version || 1) + 1;
    source = await existing.save();
  } else {
    source = await SubmissionSource.create({
      userId,
      submission: submissionId,
      sourceCode,
      programmingLanguage:
        programmingLanguage || submission.programmingLanguage,
      contentHash,
      version: 1,
    });
  }

  submission.sourceAvailable = true;
  submission.sourceHash = contentHash;
  submission.sourceStatus = "available";
  await submission.save();

  return source;
};

export { isAcceptedVerdict, PLATFORMS };
