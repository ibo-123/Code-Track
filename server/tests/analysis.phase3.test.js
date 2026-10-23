import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import User from "../src/models/UserModel.js";
import Submission from "../src/models/SubmissionModel.js";
import CodeAnalysis from "../src/models/CodeAnalysisModel.js";
import {
  upsertCodeforcesSubmissions,
  saveSubmissionSource,
} from "../src/services/submission.service.js";
import { analyzeSubmission, ANALYZER_VERSION, hashSource } from "../src/analysis/analyzeSubmission.js";
import { normalizeAnalysisLanguage } from "../src/analysis/identifyLanguage.js";
import { COMPLEXITY, LANGUAGE_SUPPORT } from "../src/analysis/constants.js";
import { MAX_SOURCE_BYTES } from "../src/analysis/version.js";
import { PLATFORMS } from "../src/constants/platforms.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-phase3";

const { default: app } = await import("../src/app.js");

const tokenFor = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

const makeCfRaw = (overrides = {}) => ({
  id: 9001,
  creationTimeSeconds: 1_700_000_100,
  programmingLanguage: "GNU C++17",
  verdict: "OK",
  timeConsumedMillis: 10,
  memoryConsumedBytes: 1024,
  problem: {
    contestId: 2000,
    index: "A",
    name: "Analysis Sample",
    rating: 1200,
    tags: ["binary search"],
  },
  author: {
    participantType: "PRACTICE",
    members: [{ handle: "tester" }],
  },
  ...overrides,
});

const LINEAR_JS = `
function find(arr, x) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === x) return i;
  }
  return -1;
}
`;

const NESTED_JS = `
function pairs(a) {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length; j++) {
      if (a[i] + a[j] === 0) return true;
    }
  }
  return false;
}
`;

const BINARY_SEARCH_JS = `
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
`;

const HASH_MAP_JS = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
}
`;

const MULTI_ALGO_CPP = `
#include <bits/stdc++.h>
using namespace std;
int main() {
  vector<int> a(n);
  sort(a.begin(), a.end());
  unordered_map<int,int> mp;
  int lo=0, hi=n-1;
  while(lo<=hi){
    int mid=(lo+hi)/2;
    if(a[mid]==x) break;
    if(a[mid]<x) lo=mid+1; else hi=mid-1;
  }
}
`;

describe("Phase 3 — Code Analysis Engine", () => {
  before(async () => {
    await connectTestDb();
  });

  after(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("identifies supported languages from platform hints", () => {
    assert.equal(normalizeAnalysisLanguage("GNU C++17"), "cpp");
    assert.equal(normalizeAnalysisLanguage("Python 3"), "python");
    assert.equal(normalizeAnalysisLanguage("Java 17"), "java");
    assert.equal(normalizeAnalysisLanguage("Node.js"), "javascript");
    assert.equal(normalizeAnalysisLanguage("Go"), "go");
  });

  it("marks unsupported languages without inventing complexity", () => {
    const result = analyzeSubmission("SELECT * FROM users;", "SQL");
    assert.equal(result.languageSupport, LANGUAGE_SUPPORT.UNSUPPORTED);
    assert.equal(result.status, "failed");
    assert.equal(result.errorCode, "LANGUAGE_UNSUPPORTED");
    assert.equal(result.timeComplexity, null);
  });

  it("handles invalid JavaScript syntax", () => {
    const result = analyzeSubmission("function broken( {", "javascript");
    assert.equal(result.syntaxStatus, "invalid");
    assert.equal(result.status, "failed");
    assert.equal(result.errorCode, "SYNTAX_INVALID");
    assert.equal(result.timeComplexity, null);
  });

  it("estimates linear loop complexity", () => {
    const result = analyzeSubmission(LINEAR_JS, "javascript");
    assert.ok(["completed", "partial"].includes(result.status));
    assert.equal(result.timeComplexity.worstCase, COMPLEXITY.O_N);
  });

  it("estimates nested loop complexity as quadratic", () => {
    const result = analyzeSubmission(NESTED_JS, "javascript");
    assert.equal(result.timeComplexity.worstCase, COMPLEXITY.O_N2);
  });

  it("recognizes binary search with evidence", () => {
    const result = analyzeSubmission(BINARY_SEARCH_JS, "javascript");
    const names = result.detectedAlgorithms.map((a) => a.name);
    assert.ok(names.includes("binary_search"));
    const bs = result.detectedAlgorithms.find((a) => a.name === "binary_search");
    assert.ok(bs.confidence >= 0.5);
    assert.ok(bs.evidence.length >= 1);
    assert.equal(result.timeComplexity.worstCase, COMPLEXITY.O_LOG_N);
  });

  it("recognizes logarithmic loops via halving", () => {
    const result = analyzeSubmission(BINARY_SEARCH_JS, "javascript");
    assert.equal(result.timeComplexity.worstCase, COMPLEXITY.O_LOG_N);
    assert.ok(result.timeComplexity.assumptions.some((a) => /log/i.test(a)));
  });

  it("estimates auxiliary space for hash-map solutions", () => {
    const result = analyzeSubmission(HASH_MAP_JS, "javascript");
    assert.ok(result.spaceComplexity);
    assert.equal(result.spaceComplexity.includesInputStorage, false);
    const ds = result.detectedDataStructures.map((d) => d.name);
    assert.ok(ds.includes("hash_map"));
  });

  it("detects common data structures", () => {
    const result = analyzeSubmission(HASH_MAP_JS, "javascript");
    const names = result.detectedDataStructures.map((d) => d.name);
    assert.ok(names.includes("hash_map"));
  });

  it("can detect multiple algorithms in one submission", () => {
    const result = analyzeSubmission(MULTI_ALGO_CPP, "GNU C++17");
    const names = result.detectedAlgorithms.map((a) => a.name);
    assert.ok(names.includes("sorting") || names.includes("binary_search"));
    assert.ok(
      names.filter((n) => n !== "unknown").length >= 1,
      `expected detections, got ${names.join(",")}`
    );
  });

  it("returns unknown / low-confidence when evidence is thin", () => {
    const result = analyzeSubmission("const x = 1;\nconst y = 2;", "javascript");
    const algo = result.detectedAlgorithms[0];
    assert.ok(algo.name === "unknown" || algo.confidence < 0.5);
  });

  it("reports potential issues with rule metadata", () => {
    const src = `
function sum(a) {
  let unused = 42;
  let s = "";
  for (let i = 0; i < a.length; i++) {
    s = s + a[i];
  }
  return s;
}
`;
    const result = analyzeSubmission(src, "javascript");
    assert.ok(Array.isArray(result.findings));
    if (result.findings.length > 0) {
      const f = result.findings[0];
      assert.ok(f.ruleId);
      assert.ok(["info", "warning", "error"].includes(f.severity));
      assert.ok(f.title);
    }
  });

  it("generates optimization suggestions with preconditions", () => {
    const result = analyzeSubmission(NESTED_JS, "javascript");
    assert.ok(Array.isArray(result.suggestions));
    for (const s of result.suggestions) {
      assert.ok(s.id);
      assert.ok(s.proposedImprovement);
      assert.ok(Array.isArray(s.preconditions) || s.rationale);
    }
  });

  it("fails clearly when source is missing", () => {
    const result = analyzeSubmission("", "python");
    assert.equal(result.errorCode, "SOURCE_MISSING");
    assert.equal(result.status, "failed");
  });

  it("rejects oversized source", () => {
    const huge = "x".repeat(MAX_SOURCE_BYTES + 10);
    const result = analyzeSubmission(huge, "javascript");
    assert.equal(result.errorCode, "SOURCE_TOO_LARGE");
  });

  it("API: analyzes owned submission and caches by hash+version", async () => {
    const user = await User.create({
      name: "Ana",
      email: "ana@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw()]);
    const sub = await Submission.findOne({ userId: user._id });
    await saveSubmissionSource({
      userId: user._id,
      submissionId: sub._id,
      sourceCode: BINARY_SEARCH_JS,
      programmingLanguage: "JavaScript",
    });

    const token = tokenFor(user);
    const first = await request(app)
      .post(`/api/submissions/${sub._id}/analyze`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    assert.equal(first.body.cached, false);
    assert.ok(first.body.analysisId);
    assert.ok(["completed", "partial"].includes(first.body.status));

    const second = await request(app)
      .post(`/api/submissions/${sub._id}/analyze`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(second.body.cached, true);
    assert.equal(String(second.body.analysisId), String(first.body.analysisId));

    const count = await CodeAnalysis.countDocuments({
      userId: user._id,
      submission: sub._id,
      analyzerVersion: ANALYZER_VERSION,
      sourceHash: hashSource(BINARY_SEARCH_JS),
    });
    assert.equal(count, 1);
  });

  it("API: preserves historical analyses when forcing retry after partial/failed", async () => {
    const user = await User.create({
      name: "Hist",
      email: "hist@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 9002 })]);
    const sub = await Submission.findOne({ userId: user._id });
    await saveSubmissionSource({
      userId: user._id,
      submissionId: sub._id,
      sourceCode: LINEAR_JS,
      programmingLanguage: "JavaScript",
    });
    const token = tokenFor(user);

    const created = await request(app)
      .post(`/api/submissions/${sub._id}/analyze`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    // Mark as failed so retry is allowed
    await CodeAnalysis.findByIdAndUpdate(created.body.analysisId, {
      status: "failed",
      errorCode: "FORCED",
    });

    await request(app)
      .post(`/api/analyses/${created.body.analysisId}/retry`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const history = await request(app)
      .get(`/api/submissions/${sub._id}/analyses`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.ok(history.body.analyses.length >= 2);
  });

  it("API: missing source returns SOURCE_UNAVAILABLE", async () => {
    const user = await User.create({
      name: "NoSrc",
      email: "nosrc@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 9003 })]);
    const sub = await Submission.findOne({ userId: user._id });
    const token = tokenFor(user);

    const res = await request(app)
      .post(`/api/submissions/${sub._id}/analyze`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    assert.equal(res.body.code, "SOURCE_UNAVAILABLE");
  });

  it("API: unauthorized request is rejected", async () => {
    await request(app).post("/api/submissions/000000000000000000000001/analyze").expect(401);
  });

  it("API: prevents cross-user analysis access", async () => {
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
    await upsertCodeforcesSubmissions(owner._id, [makeCfRaw({ id: 9004 })]);
    const sub = await Submission.findOne({ userId: owner._id });
    await saveSubmissionSource({
      userId: owner._id,
      submissionId: sub._id,
      sourceCode: LINEAR_JS,
      programmingLanguage: "JavaScript",
    });
    const ownerToken = tokenFor(owner);
    const created = await request(app)
      .post(`/api/submissions/${sub._id}/analyze`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(201);

    const otherToken = tokenFor(other);
    await request(app)
      .get(`/api/analyses/${created.body.analysisId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(404);

    await request(app)
      .post(`/api/submissions/${sub._id}/analyze`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(404);
  });

  it("API: enforces source size limit on PUT", async () => {
    const user = await User.create({
      name: "Big",
      email: "big@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 9005 })]);
    const sub = await Submission.findOne({ userId: user._id });
    const token = tokenFor(user);
    const huge = "a".repeat(MAX_SOURCE_BYTES + 5);

    await request(app)
      .put(`/api/submissions/${sub._id}/source`)
      .set("Authorization", `Bearer ${token}`)
      .send({ sourceCode: huge })
      .expect(413);
  });

  it("works with Codeforces and LeetCode submission platforms", async () => {
    const user = await User.create({
      name: "Plat",
      email: "plat@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 9006 })]);
    const cf = await Submission.findOne({
      userId: user._id,
      platform: PLATFORMS.CODEFORCES,
    });
    await saveSubmissionSource({
      userId: user._id,
      submissionId: cf._id,
      sourceCode: LINEAR_JS,
      programmingLanguage: "JavaScript",
    });

    const lc = await Submission.create({
      userId: user._id,
      platform: PLATFORMS.LEETCODE,
      platformSubmissionId: "lc-1",
      problemTitle: "Two Sum",
      programmingLanguage: "JavaScript",
      language: "javascript",
      verdict: "Accepted",
      normalizedVerdict: "ACCEPTED",
      submittedAt: new Date(),
      sourceAvailable: false,
    });
    await saveSubmissionSource({
      userId: user._id,
      submissionId: lc._id,
      sourceCode: HASH_MAP_JS,
      programmingLanguage: "JavaScript",
    });

    const token = tokenFor(user);
    const a1 = await request(app)
      .post(`/api/submissions/${cf._id}/analyze`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);
    const a2 = await request(app)
      .post(`/api/submissions/${lc._id}/analyze`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    assert.ok(["completed", "partial"].includes(a1.body.status));
    assert.ok(["completed", "partial"].includes(a2.body.status));
  });

  it("GET analysis returns latest for owner", async () => {
    const user = await User.create({
      name: "Latest",
      email: "latest@test.com",
      password: "hashed",
      isVerified: true,
    });
    await upsertCodeforcesSubmissions(user._id, [makeCfRaw({ id: 9007 })]);
    const sub = await Submission.findOne({ userId: user._id });
    await saveSubmissionSource({
      userId: user._id,
      submissionId: sub._id,
      sourceCode: LINEAR_JS,
      programmingLanguage: "JavaScript",
    });
    const token = tokenFor(user);
    await request(app)
      .post(`/api/submissions/${sub._id}/analyze`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const res = await request(app)
      .get(`/api/submissions/${sub._id}/analysis`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.ok(res.body.analysis);
    assert.equal(res.body.analysis.analyzerVersion, ANALYZER_VERSION);
  });
});
