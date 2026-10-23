# Phase 1 — Unified Submission Database

## Architecture overview

CodeTrack stores competitive programming submissions in a **platform-agnostic** MongoDB collection (`submissions`), with:

| Piece | Role |
|-------|------|
| **Submission** | Metadata for every attempt (CF today, LeetCode-ready) |
| **SubmissionSource** | Optional source code blob (owner/admin only) |
| **PlatformConnection** | Per-user platform link + sync health (no secrets) |
| **User** (existing) | Cached CF stats, display-only `leetcodeUsername` |

```
User ──┬── Submission (many) ─── SubmissionSource (0..1)
       └── PlatformConnection (one per platform)
```

Ownership field remains **`userId`** (existing convention).

---

## Model fields

### Submission

| Field | Notes |
|-------|--------|
| `userId` | Owner |
| `platform` | `codeforces` \| `leetcode` |
| `platformSubmissionId` | String id from source platform |
| `platformProblemId` | e.g. `1900A` |
| `problemTitle`, `problemUrl` | Display / deep link |
| `contestId` | String (CF contest number as string) |
| `programmingLanguage` | Normalized id (`cpp`, `python`, …) |
| `verdict` | Platform-native for CF (`OK`, …) — keeps analytics working |
| `normalizedVerdict` | Cross-platform (`ACCEPTED`, …) |
| `executionTimeMs`, `memoryBytes` | Optional |
| `submittedAt`, `syncedAt` | Timestamps |
| `sourceAvailable`, `sourceHash` | Source presence |
| `metadata` | Validated CF extras (tags, rating, raw language, …) |
| Legacy | `submissionId`, `problemName`, `problemIndex`, `language`, `creationTimeSeconds`, `rating`, `tags` |

### SubmissionSource

`userId`, `submission` (unique), `sourceCode`, `programmingLanguage`, `contentHash`, `version`, timestamps.

### PlatformConnection

`userId` + `platform` (unique), `handle`, `status`, `lastSyncAt`, `lastSyncAttemptAt`, `lastSyncError`, `syncCursor`, `syncEnabled`.

Statuses:

- `connected` — Codeforces handle validated via CF API
- `username_saved` — LeetCode username stored **without** auth (Phase 1)
- `sync_error`, `disconnected`, `disabled`

**Never store** passwords, cookies, or session secrets.

### Future: CodeAnalysis / AIReview (not implemented)

Suggested shape for Phase 2+:

```text
CodeAnalysis {
  submission → Submission
  analyzerVersion: string
  results: object
  createdAt
}
// Unique-ish: (submission, analyzerVersion) so reruns never overwrite history
```

`AIReview` would reference `CodeAnalysis` / `Submission` similarly with model/version fields.

---

## Uniqueness rules

1. **`(userId, platform, platformSubmissionId)`** — unique. Same public CF id may exist for many users.
2. Partial unique **`(userId, submissionId)`** for legacy numeric CF ids.
3. **Do not** use a global unique index on `submissionId` / `platformSubmissionId`.

Distinct attempts at the same problem = distinct `platformSubmissionId` values.

---

## Migration & rollback

### Backup (production)

```bash
mongodump --uri="$MONGO_URI" --out=./backup-pre-phase1
```

### Run migration (idempotent)

```bash
cd server
node src/scripts/migrateSubmissionsPhase1.js
```

The script:

1. Drops the legacy **global** unique index on `submissionId` if present.
2. Backfills unified fields on existing CF rows.
3. Upserts `PlatformConnection` for users with `codeforcesHandle`.
4. Calls `syncIndexes()` for Submission + PlatformConnection.

### Rollback

```bash
mongorestore --uri="$MONGO_URI" --drop ./backup-pre-phase1
```

Unified fields are additive; leaving them in place after a partial migrate is safe for dual-read consumers.

---

## Synchronization (Codeforces)

- Still driven by `syncCodeforcesData` in `codeforces.services.js`.
- Cache-first TTL (`SYNC_TTL_MS`, ~5 minutes) unchanged.
- Incremental: recent `count` after first sync; larger pull on first sync / force.
- Writes via `upsertCodeforcesSubmissions` (`bulkWrite`, `ordered: false`).
- Partial failures do **not** delete existing rows.
- Updates `PlatformConnection` sync timestamps / cursor / errors.
- Rate limited: `POST /api/users/sync`, `POST /api/codeforces/connect` (6/min/user).

---

## API

All routes require `Authorization: Bearer <JWT>`. Scoped to `req.user.id` (admins may read others only where explicitly coded — source/detail use owner or `role === admin`).

### `GET /api/submissions`

Query: `page`, `limit` (max 100), `platform`, `verdict`, `language` / `programmingLanguage`, `problemId` / `platformProblemId`, `q` / `search`, `from`, `to`, `sort=asc|desc`.

```json
{
  "success": true,
  "submissions": [ { "_id": "...", "platform": "codeforces", "problemTitle": "..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasMore": true }
}
```

### `GET /api/submissions/recent?limit=10`

Unchanged contract for the dashboard.

### `GET /api/submissions/:id`

Owner (or admin) metadata.

### `GET /api/submissions/:id/source`

```json
{
  "success": true,
  "submissionId": "...",
  "platform": "codeforces",
  "programmingLanguage": "cpp",
  "contentHash": "...",
  "version": 1,
  "sourceCode": "..."
}
```

`404` when missing source (`sourceAvailable: false`).

Passing another user's `userId` query param → `403`.

---

## Security

- Auth + ownership on every submission route.
- Source code never executed on the API server.
- No external AI calls in Phase 1.
- Sync errors sanitized (message truncated, no stacks in DB).
- Reasonable pagination caps.

---

## Frontend notes

- Dashboard activity mapping accepts `problemTitle` / `submittedAt` / `normalizedVerdict` with legacy fallbacks.
- Do **not** show LeetCode submissions as synced until a real importer exists (`PlatformConnection.status !== connected` for LeetCode).

---

## Phase 2 checklist

- [ ] LeetCode authenticated sync (OAuth / session — never plaintext password)
- [ ] Map LeetCode submissions into unified `Submission`
- [ ] Optional source fetch pipelines per platform
- [ ] `CodeAnalysis` + versioned analyzers
- [ ] `AIReview` with consent + redaction policy
- [ ] Personalized recommendations from analysis
- [ ] UI filters for multi-platform submission tables
