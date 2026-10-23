/**
 * Phase 1 — Idempotent submission backfill / index migration.
 *
 * What it does:
 * 1. Backfills unified fields on existing Codeforces Submission documents.
 * 2. Upserts PlatformConnection rows for users with a Codeforces handle.
 * 3. Drops the legacy global unique index on `submissionId` if present.
 *
 * Usage:
 *   node src/scripts/migrateSubmissionsPhase1.js
 *
 * Env:
 *   MONGODB_URI / MONGO_URI — connection string (required)
 *
 * Safety:
 * - Does NOT delete documents.
 * - Idempotent: safe to re-run.
 * - Backup recommendation: mongodump before production runs.
 *
 * Rollback:
 * - Restore from mongodump.
 * - Unified fields can remain; old consumers still read legacy fields.
 * - To re-add the unsafe global unique index (not recommended):
 *     db.submissions.createIndex({ submissionId: 1 }, { unique: true })
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import Submission from "../models/SubmissionModel.js";
import User from "../models/UserModel.js";
import PlatformConnection from "../models/PlatformConnectionModel.js";
import {
  CONNECTION_STATUS,
  PLATFORMS,
} from "../constants/platforms.js";
import {
  buildCodeforcesPlatformProblemId,
  buildCodeforcesProblemUrl,
  normalizeLanguage,
  normalizeVerdict,
} from "../utils/submissionNormalize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  console.error("Missing MONGODB_URI / MONGO_URI");
  process.exit(1);
}

const BATCH = 500;

async function dropLegacyGlobalSubmissionIdIndex(db) {
  const collection = db.collection("submissions");
  const indexes = await collection.indexes();
  const legacy = indexes.find(
    (idx) =>
      idx.unique &&
      idx.key &&
      Object.keys(idx.key).length === 1 &&
      idx.key.submissionId === 1
  );

  if (!legacy) {
    console.log("• No legacy global unique index on submissionId — skip");
    return;
  }

  console.log(`• Dropping legacy index: ${legacy.name}`);
  await collection.dropIndex(legacy.name);
}

async function backfillSubmissions() {
  const filter = {
    $or: [
      { platform: { $exists: false } },
      { platform: null },
      { platformSubmissionId: { $exists: false } },
      { platformSubmissionId: null },
      { platformSubmissionId: "" },
      { problemTitle: { $exists: false } },
      { problemTitle: null },
      { submittedAt: { $exists: false } },
      { submittedAt: null },
    ],
  };

  let processed = 0;
  let updated = 0;

  // Cursor over candidates only
  const cursor = Submission.find(filter).cursor();

  let batch = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH) {
      updated += await flushBatch(batch);
      processed += batch.length;
      batch = [];
      console.log(`  … processed ${processed}`);
    }
  }
  if (batch.length) {
    updated += await flushBatch(batch);
    processed += batch.length;
  }

  console.log(`• Submission backfill: scanned ${processed}, updated ${updated}`);
  return { processed, updated };
}

async function flushBatch(docs) {
  const ops = docs.map((doc) => {
    const contestId =
      doc.contestId != null ? String(doc.contestId) : null;
    const problemIndex = doc.problemIndex || doc.metadata?.problemIndex || "";
    const platformSubmissionId =
      doc.platformSubmissionId ||
      (doc.submissionId != null ? String(doc.submissionId) : null);

    if (!platformSubmissionId) {
      // Cannot safely unify without an id — skip (should be rare)
      return null;
    }

    const $set = {
      platform: doc.platform || PLATFORMS.CODEFORCES,
      platformSubmissionId,
      platformProblemId:
        doc.platformProblemId ||
        buildCodeforcesPlatformProblemId(contestId, problemIndex),
      problemTitle: doc.problemTitle || doc.problemName || "Unknown",
      problemUrl:
        doc.problemUrl ||
        buildCodeforcesProblemUrl(contestId, problemIndex),
      contestId,
      programmingLanguage:
        doc.programmingLanguage ||
        normalizeLanguage(doc.language) ||
        null,
      normalizedVerdict:
        doc.normalizedVerdict ||
        normalizeVerdict(doc.verdict, PLATFORMS.CODEFORCES),
      submittedAt:
        doc.submittedAt ||
        (doc.creationTimeSeconds
          ? new Date(doc.creationTimeSeconds * 1000)
          : doc.createdAt || new Date()),
      syncedAt: doc.syncedAt || doc.updatedAt || new Date(),
      sourceAvailable: Boolean(doc.sourceAvailable),
    };

    if (!doc.metadata || !doc.metadata.rawVerdict) {
      $set.metadata = {
        rawVerdict: doc.verdict || null,
        rawLanguage: doc.language || null,
        problemIndex: problemIndex || null,
        rating: doc.rating ?? null,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
      };
    }

    // Ensure legacy problemName stays populated for dashboard
    if (!doc.problemName && $set.problemTitle) {
      $set.problemName = $set.problemTitle;
    }

    return {
      updateOne: {
        filter: { _id: doc._id },
        update: { $set },
      },
    };
  }).filter(Boolean);

  if (!ops.length) return 0;
  const result = await Submission.bulkWrite(ops, { ordered: false });
  return result.modifiedCount || 0;
}

async function backfillPlatformConnections() {
  const users = await User.find({
    codeforcesHandle: { $ne: null, $exists: true },
  })
    .select("_id codeforcesHandle lastSyncedAt")
    .lean();

  let upserted = 0;
  for (const user of users) {
    if (!user.codeforcesHandle) continue;
    await PlatformConnection.findOneAndUpdate(
      { userId: user._id, platform: PLATFORMS.CODEFORCES },
      {
        $set: {
          handle: user.codeforcesHandle,
          status: CONNECTION_STATUS.CONNECTED,
          syncEnabled: true,
          lastSyncAt: user.lastSyncedAt || null,
          lastSyncError: null,
        },
        $setOnInsert: {
          lastSyncAttemptAt: null,
          syncCursor: null,
        },
      },
      { upsert: true }
    );
    upserted += 1;
  }

  console.log(`• PlatformConnection upserts for Codeforces: ${upserted}`);
  return upserted;
}

async function ensureIndexes() {
  // Triggers schema index sync for new models
  await Promise.all([
    Submission.syncIndexes(),
    PlatformConnection.syncIndexes(),
  ]);
  console.log("• syncIndexes() completed for Submission + PlatformConnection");
}

async function main() {
  console.log("Phase 1 migration starting…");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  await dropLegacyGlobalSubmissionIdIndex(db);
  await backfillSubmissions();
  await backfillPlatformConnections();
  await ensureIndexes();

  console.log("Phase 1 migration finished successfully.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Migration failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
