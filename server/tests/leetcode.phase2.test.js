import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { __testHooks } from "../src/services/leetcode/graphqlClient.js";
import User from "../src/models/UserModel.js";
import Submission from "../src/models/SubmissionModel.js";
import PlatformConnection from "../src/models/PlatformConnectionModel.js";
import SyncJob from "../src/models/SyncJobModel.js";
import { PLATFORMS, SOURCE_STATUS } from "../src/constants/platforms.js";
import {
  connectLeetCode,
  syncLeetCodeSubmissions,
  disconnectLeetCode,
} from "../src/services/leetcode/leetcode.service.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-phase2";

const { default: app } = await import("../src/app.js");

const tokenFor = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const sampleProfile = (username = "alice") => ({
  username,
  profile: {
    ranking: 12345,
    reputation: 10,
    starRating: 2,
    userAvatar: "https://assets.leetcode.com/users/alice.png",
    realName: "Alice",
    aboutMe: "",
  },
  submitStats: {
    acSubmissionNum: [
      { difficulty: "All", count: 100, submissions: 200 },
      { difficulty: "Easy", count: 40, submissions: 50 },
      { difficulty: "Medium", count: 50, submissions: 100 },
      { difficulty: "Hard", count: 10, submissions: 50 },
    ],
  },
});

const clearHooks = () => {
  __testHooks.fetchPublicProfile = null;
  __testHooks.fetchRecentAcSubmissions = null;
  __testHooks.fetchRecentSubmissions = null;
};

describe("Phase 2 — LeetCode integration", () => {
  before(async () => {
    await connectTestDb();
  });

  after(async () => {
    clearHooks();
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    clearHooks();
  });

  it("connects a valid username via public profile", async () => {
    __testHooks.fetchPublicProfile = async () => sampleProfile("alice");

    const user = await User.create({
      name: "Alice",
      email: "alice-lc@test.com",
      password: "hashed",
      isVerified: true,
    });

    const res = await request(app)
      .post("/api/platforms/leetcode/connect")
      .set("Authorization", `Bearer ${tokenFor(user)}`)
      .send({ handle: "alice" });

    assert.equal(res.status, 200);
    assert.equal(res.body.connection.handle, "alice");
    assert.equal(res.body.connection.status, "connected");
    assert.equal(
      res.body.connection.capabilities.submissionImport,
      "public_recent_only"
    );
    assert.match(res.body.warnings[0], /public/i);

    const conn = await PlatformConnection.findOne({
      userId: user._id,
      platform: PLATFORMS.LEETCODE,
    }).lean();
    assert.equal(conn.profileCache.solved.all, 100);
    assert.equal(conn.capabilities.sourceCode, "unsupported");
  });

  it("handles invalid / missing profile", async () => {
    __testHooks.fetchPublicProfile = async () => null;

    const user = await User.create({
      name: "Bob",
      email: "bob-lc@test.com",
      password: "hashed",
      isVerified: true,
    });

    const res = await request(app)
      .post("/api/platforms/leetcode/connect")
      .set("Authorization", `Bearer ${tokenFor(user)}`)
      .send({ handle: "no_such_user_xyz" });

    assert.equal(res.status, 404);
  });

  it("does not imply private submission access from public connect", async () => {
    __testHooks.fetchPublicProfile = async () => sampleProfile("carol");
    const user = await User.create({
      name: "Carol",
      email: "carol-lc@test.com",
      password: "hashed",
      isVerified: true,
    });

    await request(app)
      .post("/api/platforms/leetcode/connect")
      .set("Authorization", `Bearer ${tokenFor(user)}`)
      .send({ handle: "carol" });

    const statusRes = await request(app)
      .get("/api/platforms/leetcode/status")
      .set("Authorization", `Bearer ${tokenFor(user)}`);

    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.submissionImportCapability, "public_recent_only");
    assert.equal(statusRes.body.sourceCodeCapability, "unsupported");
    assert.equal(statusRes.body.notes.fullHistoryUnavailable, true);
  });

  it("imports submissions into the unified schema without duplicates", async () => {
    const user = await User.create({
      name: "Dan",
      email: "dan-lc@test.com",
      password: "hashed",
      isVerified: true,
    });

    __testHooks.fetchPublicProfile = async () => sampleProfile("dan");
    await connectLeetCode(user._id, "dan");

    __testHooks.fetchRecentAcSubmissions = async () => [
      {
        id: "111",
        title: "Two Sum",
        titleSlug: "two-sum",
        timestamp: "1700000000",
      },
    ];
    __testHooks.fetchRecentSubmissions = async () => [
      {
        title: "Two Sum",
        titleSlug: "two-sum",
        timestamp: "1700000000",
        statusDisplay: "Accepted",
        lang: "python3",
      },
      {
        title: "Two Sum",
        titleSlug: "two-sum",
        timestamp: "1699999900",
        statusDisplay: "Wrong Answer",
        lang: "python3",
      },
    ];

    const first = await syncLeetCodeSubmissions(user._id);
    assert.ok(first.total >= 2);

    const second = await syncLeetCodeSubmissions(user._id);
    assert.equal(second.imported, 0);

    const count = await Submission.countDocuments({
      userId: user._id,
      platform: PLATFORMS.LEETCODE,
    });
    assert.equal(count, first.total);

    const attempts = await Submission.countDocuments({
      userId: user._id,
      platform: PLATFORMS.LEETCODE,
      platformProblemId: "two-sum",
    });
    assert.ok(attempts >= 2);

    const withSource = await Submission.find({
      userId: user._id,
      platform: PLATFORMS.LEETCODE,
      sourceAvailable: true,
    });
    assert.equal(withSource.length, 0);

    const row = await Submission.findOne({
      userId: user._id,
      platform: PLATFORMS.LEETCODE,
    }).lean();
    assert.equal(row.sourceStatus, SOURCE_STATUS.UNSUPPORTED);
  });

  it("rejects unauthenticated and cross-user job access", async () => {
    const a = await User.create({
      name: "Eve",
      email: "eve-lc@test.com",
      password: "hashed",
      isVerified: true,
    });
    const b = await User.create({
      name: "Frank",
      email: "frank-lc@test.com",
      password: "hashed",
      isVerified: true,
    });

    const unauth = await request(app).get("/api/platforms/leetcode/status");
    assert.equal(unauth.status, 401);

    const job = await SyncJob.create({
      userId: a._id,
      platform: PLATFORMS.LEETCODE,
      type: "submissions",
      status: "completed",
    });

    const cross = await request(app)
      .get(`/api/platforms/leetcode/sync-jobs/${job._id}`)
      .set("Authorization", `Bearer ${tokenFor(b)}`);
    assert.equal(cross.status, 404);
  });

  it("disconnect disables sync", async () => {
    __testHooks.fetchPublicProfile = async () => sampleProfile("gina");
    const user = await User.create({
      name: "Gina",
      email: "gina-lc@test.com",
      password: "hashed",
      isVerified: true,
    });
    await connectLeetCode(user._id, "gina");
    await disconnectLeetCode(user._id);

    const status = await request(app)
      .get("/api/platforms/leetcode/status")
      .set("Authorization", `Bearer ${tokenFor(user)}`);

    assert.equal(status.body.connected, false);
    assert.equal(status.body.syncEnabled, false);

    const sync = await request(app)
      .post("/api/platforms/leetcode/sync-submissions")
      .set("Authorization", `Bearer ${tokenFor(user)}`);
    assert.equal(sync.status, 400);
  });

  it("preserves Codeforces submissions when importing LeetCode", async () => {
    const user = await User.create({
      name: "Hank",
      email: "hank-lc@test.com",
      password: "hashed",
      isVerified: true,
    });

    await Submission.create({
      userId: user._id,
      platform: PLATFORMS.CODEFORCES,
      platformSubmissionId: "999",
      problemTitle: "CF Problem",
      verdict: "OK",
      normalizedVerdict: "ACCEPTED",
      submittedAt: new Date(),
      sourceStatus: SOURCE_STATUS.NOT_IMPORTED,
    });

    __testHooks.fetchPublicProfile = async () => sampleProfile("hank");
    await connectLeetCode(user._id, "hank");
    __testHooks.fetchRecentAcSubmissions = async () => [
      {
        id: "222",
        title: "Add Two Numbers",
        titleSlug: "add-two-numbers",
        timestamp: "1700001111",
      },
    ];
    __testHooks.fetchRecentSubmissions = async () => [];
    await syncLeetCodeSubmissions(user._id);

    assert.equal(
      await Submission.countDocuments({
        userId: user._id,
        platform: PLATFORMS.CODEFORCES,
      }),
      1
    );
    assert.equal(
      await Submission.countDocuments({
        userId: user._id,
        platform: PLATFORMS.LEETCODE,
      }),
      1
    );
  });

  it("rejects invalid username format without calling provider", async () => {
    let called = false;
    __testHooks.fetchPublicProfile = async () => {
      called = true;
      return sampleProfile("x");
    };

    const user = await User.create({
      name: "Ivy",
      email: "ivy-lc@test.com",
      password: "hashed",
      isVerified: true,
    });

    const res = await request(app)
      .post("/api/platforms/leetcode/connect")
      .set("Authorization", `Bearer ${tokenFor(user)}`)
      .send({ handle: "bad username!!!" });

    assert.equal(res.status, 400);
    assert.equal(called, false);
  });
});
