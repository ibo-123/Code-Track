import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";

import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import User from "../src/models/UserModel.js";
import Submission from "../src/models/SubmissionModel.js";
import SubmissionSource from "../src/models/SubmissionSourceModel.js";
import { upsertCodeforcesSubmissions, saveSubmissionSource } from "../src/services/submission.service.js";
import { PLATFORMS } from "../src/constants/platforms.js";
import {
  buildCodeforcesPlatformProblemId,
  normalizeLanguage,
  normalizeVerdict,
} from "../src/utils/submissionNormalize.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-phase1";

/** Lazy-load app after env is set */
const { default: app } = await import("../src/app.js");

const makeCfRaw = (overrides = {}) => ({
  id: 1001,
  creationTimeSeconds: 1_700_000_000,
  programmingLanguage: "GNU C++17",
  verdict: "OK",
  timeConsumedMillis: 15,
  memoryConsumedBytes: 1024,
  problem: {
    contestId: 1900,
    index: "A",
    name: "Test Problem",
    rating: 800,
    tags: ["implementation"],
  },
  author: {
    participantType: "CONTESTANT",
    members: [{ handle: "tourist" }],
  },
  ...overrides,
});

const tokenFor = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

describe("Phase 1 — Unified Submission Database", () => {
  before(async () => {
    await connectTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("stores a Codeforces submission with unified + legacy fields", async () => {
    const user = await User.create({
      name: "Alice",
      email: "alice@test.com",
      password: "hashed",
      isVerified: true,
    });

    await upsertCodeforcesSubmissions(user._id, [makeCfRaw()]);

    const doc = await Submission.findOne({ userId: user._id }).lean();
    assert.ok(doc);
    assert.equal(doc.platform, PLATFORMS.CODEFORCES);
    assert.equal(doc.platformSubmissionId, "1001");
    assert.equal(doc.problemTitle, "Test Problem");
    assert.equal(doc.problemName, "Test Problem");
    assert.equal(doc.verdict, "OK");
    assert.equal(doc.normalizedVerdict, "ACCEPTED");
    assert.equal(doc.programmingLanguage, "cpp");
    assert.equal(doc.submissionId, 1001);
    assert.equal(doc.platformProblemId, "1900-A");
    assert.ok(doc.submittedAt);
    assert.equal(doc.sourceAvailable, false);
  });

  it("stores a second-platform submission on the same schema", async () => {
    const user = await User.create({
      name: "Bob",
      email: "bob@test.com",
      password: "hashed",
      isVerified: true,
    });

    await Submission.create({
      userId: user._id,
      platform: PLATFORMS.LEETCODE,
      platformSubmissionId: "lc-999",
      platformProblemId: "two-sum",
      problemTitle: "Two Sum",
      problemUrl: "https://leetcode.com/problems/two-sum/",
      programmingLanguage: "python",
      verdict: "ACCEPTED",
      normalizedVerdict: "ACCEPTED",
      submittedAt: new Date(),
      syncedAt: new Date(),
      sourceAvailable: false,
    });

    const count = await Submission.countDocuments({ userId: user._id });
    assert.equal(count, 1);
    const doc = await Submission.findOne({ platform: PLATFORMS.LEETCODE }).lean();
    assert.equal(doc.platformSubmissionId, "lc-999");
  });

  it("does not duplicate the same platformSubmissionId for one user", async () => {
    const user = await User.create({
      name: "Carol",
      email: "carol@test.com",
      password: "hashed",
      isVerified: true,
    });

    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 55 })]);
    await upsertCodeforcesSubmissions(user._id, [
      makeCfRaw({ id: 55, verdict: "WRONG_ANSWER" }),
    ]);

    const count = await Submission.countDocuments({ userId: user._id });
    assert.equal(count, 1);
    const doc = await Submission.findOne({ userId: user._id }).lean();
    assert.equal(doc.verdict, "WRONG_ANSWER");
  });

  it("keeps distinct attempts for the same problem", async () => {
    const user = await User.create({
      name: "Dan",
      email: "dan@test.com",
      password: "hashed",
      isVerified: true,
    });

    await upsertCodeforcesSubmissions(user._id, [
      makeCfRaw({ id: 1, verdict: "WRONG_ANSWER" }),
      makeCfRaw({ id: 2, verdict: "OK" }),
    ]);

    const count = await Submission.countDocuments({
      userId: user._id,
      platformProblemId: "1900-A",
    });
    assert.equal(count, 2);
  });

  it("allows different users to import the same public submission id", async () => {
    const u1 = await User.create({
      name: "U1",
      email: "u1@test.com",
      password: "hashed",
      isVerified: true,
    });
    const u2 = await User.create({
      name: "U2",
      email: "u2@test.com",
      password: "hashed",
      isVerified: true,
    });

    await upsertCodeforcesSubmissions(u1._id, [makeCfRaw({ id: 777 })]);
    await upsertCodeforcesSubmissions(u2._id, [makeCfRaw({ id: 777 })]);

    const total = await Submission.countDocuments({
      platformSubmissionId: "777",
    });
    assert.equal(total, 2);
  });

  it("rejects unauthenticated access to submission routes", async () => {
    const res = await request(app).get("/api/submissions");
    assert.equal(res.status, 401);
  });

  it("prevents users from reading another user's submission or source", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner@test.com",
      password: "hashed",
      isVerified: true,
    });
    const other = await User.create({
      name: "Other",
      email: "other@test.com",
      password: "hashed",
      isVerified: true,
    });

    await upsertCodeforcesSubmissions(owner._id, [makeCfRaw({ id: 42 })]);
    const sub = await Submission.findOne({ userId: owner._id });
    await saveSubmissionSource({
      userId: owner._id,
      submissionId: sub._id,
      sourceCode: "int main(){return 0;}",
      programmingLanguage: "cpp",
    });

    const otherToken = tokenFor(other);

    const detail = await request(app)
      .get(`/api/submissions/${sub._id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    assert.equal(detail.status, 404);

    const source = await request(app)
      .get(`/api/submissions/${sub._id}/source`)
      .set("Authorization", `Bearer ${otherToken}`);
    assert.equal(source.status, 404);
  });

  it("returns 404 when source code is missing", async () => {
    const user = await User.create({
      name: "Eve",
      email: "eve@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 9 })]);
    const sub = await Submission.findOne({ userId: user._id });

    const res = await request(app)
      .get(`/api/submissions/${sub._id}/source`)
      .set("Authorization", `Bearer ${tokenFor(user)}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.sourceAvailable, false);
  });

  it("normalizes invalid pagination safely and rejects bad platform", async () => {
    const user = await User.create({
      name: "Frank",
      email: "frank@test.com",
      password: "hashed",
      isVerified: true,
    });
    const token = tokenFor(user);

    const ok = await request(app)
      .get("/api/submissions")
      .query({ page: "-5", limit: "9999" })
      .set("Authorization", `Bearer ${token}`);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.pagination.page, 1);
    assert.ok(ok.body.pagination.limit <= 100);

    const bad = await request(app)
      .get("/api/submissions")
      .query({ platform: "hackerrank" })
      .set("Authorization", `Bearer ${token}`);
    assert.equal(bad.status, 400);
  });

  it("partial sync failure does not wipe prior records", async () => {
    const user = await User.create({
      name: "Gina",
      email: "gina@test.com",
      password: "hashed",
      isVerified: true,
    });

    await upsertCodeforcesSubmissions(user._id, [
      makeCfRaw({ id: 1 }),
      makeCfRaw({ id: 2 }),
    ]);
    assert.equal(await Submission.countDocuments({ userId: user._id }), 2);

    // Second sync with only one item should upsert, not delete others
    await upsertCodeforcesSubmissions(user._id, [
      makeCfRaw({ id: 1, verdict: "WRONG_ANSWER" }),
    ]);
    assert.equal(await Submission.countDocuments({ userId: user._id }), 2);
    const first = await Submission.findOne({
      userId: user._id,
      platformSubmissionId: "1",
    }).lean();
    assert.equal(first.verdict, "WRONG_ANSWER");
  });

  it("migration-style backfill is idempotent (re-upsert same docs)", async () => {
    const user = await User.create({
      name: "Hank",
      email: "hank@test.com",
      password: "hashed",
      isVerified: true,
    });

    // Simulate legacy document (missing unified fields, then backfill via upsert)
    await Submission.collection.insertOne({
      userId: user._id,
      submissionId: 321,
      problemName: "Legacy",
      problemIndex: "B",
      contestId: 100,
      verdict: "OK",
      language: "Python 3",
      creationTimeSeconds: 1_600_000_000,
      tags: [],
      rating: 1200,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Run unified upsert for same CF id — should not create a second row
    // after we set platformSubmissionId via a one-shot update mimicking migration
    await Submission.updateOne(
      { userId: user._id, submissionId: 321 },
      {
        $set: {
          platform: PLATFORMS.CODEFORCES,
          platformSubmissionId: "321",
          problemTitle: "Legacy",
          platformProblemId: buildCodeforcesPlatformProblemId(100, "B"),
          programmingLanguage: normalizeLanguage("Python 3"),
          normalizedVerdict: normalizeVerdict("OK"),
          submittedAt: new Date(1_600_000_000 * 1000),
          syncedAt: new Date(),
        },
      }
    );

    await upsertCodeforcesSubmissions(user._id, [
      makeCfRaw({
        id: 321,
        problem: {
          contestId: 100,
          index: "B",
          name: "Legacy",
          rating: 1200,
          tags: [],
        },
      }),
    ]);

    assert.equal(await Submission.countDocuments({ userId: user._id }), 1);

    // Second identical upsert still one row
    await upsertCodeforcesSubmissions(user._id, [
      makeCfRaw({
        id: 321,
        problem: {
          contestId: 100,
          index: "B",
          name: "Legacy",
          rating: 1200,
          tags: [],
        },
      }),
    ]);
    assert.equal(await Submission.countDocuments({ userId: user._id }), 1);
  });

  it("owner can fetch source when available", async () => {
    const user = await User.create({
      name: "Ivy",
      email: "ivy@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 88 })]);
    const sub = await Submission.findOne({ userId: user._id });
    await saveSubmissionSource({
      userId: user._id,
      submissionId: sub._id,
      sourceCode: "#include <bits/stdc++.h>\nint main(){}",
      programmingLanguage: "cpp",
    });

    const res = await request(app)
      .get(`/api/submissions/${sub._id}/source`)
      .set("Authorization", `Bearer ${tokenFor(user)}`);

    assert.equal(res.status, 200);
    assert.match(res.body.sourceCode, /bits\/stdc/);
    assert.equal(res.body.platform, PLATFORMS.CODEFORCES);

    const srcCount = await SubmissionSource.countDocuments({
      submission: sub._id,
    });
    assert.equal(srcCount, 1);
  });

  it("blocks listing another user via query userId", async () => {
    const user = await User.create({
      name: "Jules",
      email: "jules@test.com",
      password: "hashed",
      isVerified: true,
    });
    const otherId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get("/api/submissions")
      .query({ userId: otherId.toString() })
      .set("Authorization", `Bearer ${tokenFor(user)}`);

    assert.equal(res.status, 403);
  });
});
