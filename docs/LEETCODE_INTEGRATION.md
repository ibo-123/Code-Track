# Phase 2 — LeetCode Integration

## Integration method

**Public LeetCode GraphQL** (`POST https://leetcode.com/graphql/`), unauthenticated.

Verified against the live endpoint:

| Capability | Supported? | Notes |
|------------|------------|--------|
| Resolve username / public profile | Yes | `matchedUser` |
| Ranking, reputation, avatar | Yes when returned | Missing fields stay `null` (not coerced to 0) |
| Solved counts by difficulty | Yes when returned | From `submitStatsGlobal` |
| Recent submissions (~20) | Yes | `recentAcSubmissionList` + `recentSubmissionList` |
| Full submission history | **No** | Requires authenticated session |
| Source code | **No** | Requires authenticated session |

Phase 2 **does not** collect LeetCode passwords or session cookies.

There is **no** `LEETCODE_API_KEY`.

## Honest connection semantics

`PlatformConnection.status = connected` means the **public profile was verified**, not that private import is enabled.

Capabilities recorded on the connection:

```json
{
  "profile": true,
  "submissionImport": "public_recent_only",
  "sourceCode": "unsupported",
  "maxPublicRecent": 20
}
```

## API endpoints

All require `Authorization: Bearer <JWT>`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/platforms/leetcode/connect` | Validate username, store connection |
| `GET` | `/api/platforms/leetcode/status` | Connection + capabilities + sync metadata |
| `DELETE` | `/api/platforms/leetcode/connect` | Disable sync (keeps historical submissions) |
| `POST` | `/api/platforms/leetcode/sync-profile` | Async job → refresh public profile |
| `POST` | `/api/platforms/leetcode/sync-submissions` | Async job → import recent public submissions |
| `GET` | `/api/platforms/leetcode/sync-jobs/:id` | Job progress (owner only) |

Sync endpoints return **202** with `jobId` and run in-process via `setImmediate` (same pattern as CF background sync).

## Unified import

Imported rows use Phase 1 `Submission` with `platform: "leetcode"`.

- Uniqueness: `(userId, platform, platformSubmissionId)`
- AC list items use LeetCode submission `id`
- Other recent items use a composite id: `lc:{slug}:{ts}:{lang}:{status}`
- `sourceStatus: "unsupported"`, `sourceAvailable: false`
- Multiple attempts at the same problem remain distinct

## Retry / reliability

- GraphQL client: timeouts + bounded exponential backoff on 429 / 5xx / network timeout
- Permanent errors (404 profile, validation) are not retried endlessly
- Concurrent identical jobs → HTTP 409
- Partial batch upserts do not delete prior Codeforces or LeetCode rows
- Null fields from partial payloads are not written over existing values

## Security

- JWT + ownership on every route
- No credentials stored
- Errors sanitized (no stacks in API / DB)
- Sync endpoints rate-limited

## Configuration

See `server/.env.example`:

- `LEETCODE_GRAPHQL_URL`
- `LEETCODE_TIMEOUT_MS`
- `LEETCODE_RECENT_LIMIT`

## Manual verification

1. Start API + client.
2. Profile → Connections → enter a real LeetCode username → **Connect**.
3. Confirm ranking / solved stats appear (or `—` when missing).
4. **Import recent** → wait for job → open **Submissions** → filter LeetCode.
5. Confirm source column shows `unsupported`.
6. **Disconnect** → sync buttons gone; prior imported rows remain in Submissions.
7. Confirm Codeforces sync still works.

## Phase 3 prerequisites

- Secure, consented mechanism for private history / source (if product + ToS allow)
- `CodeAnalysis` / `AIReview` versioned models
- Do not scrape session cookies in the browser
