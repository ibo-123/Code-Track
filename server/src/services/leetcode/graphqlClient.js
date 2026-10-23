import axios from "axios";
import http from "http";
import https from "https";

/**
 * LeetCode public GraphQL client (Phase 2).
 *
 * Access method: unauthenticated POST to https://leetcode.com/graphql/
 * - Public profile (matchedUser) — verified
 * - Recent submissions (~20) — verified
 * - Full history + source code — NOT available without a session cookie;
 *   we intentionally do NOT collect or store LeetCode session cookies.
 *
 * No LEETCODE_API_KEY — LeetCode does not provide a general public API key.
 */

const DEFAULT_ENDPOINT =
  process.env.LEETCODE_GRAPHQL_URL || "https://leetcode.com/graphql/";

const TIMEOUT_MS = Number(process.env.LEETCODE_TIMEOUT_MS) || 12_000;

const client = axios.create({
  timeout: TIMEOUT_MS,
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 5 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 5 }),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "CodeTrack/2.0 (competitive-programming-tracker)",
  },
});

const PROFILE_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
        starRating
        userAvatar
        realName
        aboutMe
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const RECENT_AC_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query recentSubmissions($username: String!) {
    recentSubmissionList(username: $username) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Execute a GraphQL query with bounded retries for transient failures.
 */
export const leetcodeGraphql = async (
  query,
  variables = {},
  { retries = 2, refererUsername = null } = {}
) => {
  const endpoint = DEFAULT_ENDPOINT;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.post(
        endpoint,
        { query, variables },
        {
          headers: {
            Referer: refererUsername
              ? `https://leetcode.com/${encodeURIComponent(refererUsername)}/`
              : "https://leetcode.com/",
          },
        }
      );

      if (response.data?.errors?.length) {
        const msg = response.data.errors.map((e) => e.message).join("; ");
        const err = new Error(msg || "LeetCode GraphQL error");
        err.code = "LEETCODE_GRAPHQL_ERROR";
        err.permanent = /not exist|does not exist|User matching query does not exist/i.test(
          msg
        );
        throw err;
      }

      return response.data?.data ?? null;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const permanent =
        error.permanent ||
        status === 400 ||
        status === 401 ||
        status === 403 ||
        status === 404;

      if (permanent || attempt === retries) break;

      // Rate limit / transient
      if (status === 429 || status >= 500 || error.code === "ECONNABORTED") {
        const backoff = Math.min(4000, 400 * 2 ** attempt) + Math.random() * 200;
        await sleep(backoff);
        continue;
      }
      break;
    }
  }

  if (lastError?.response?.status === 429) {
    const err = new Error("LeetCode rate limit exceeded. Try again shortly.");
    err.code = "LEETCODE_RATE_LIMIT";
    err.permanent = false;
    throw err;
  }

  if (
    lastError?.code === "ECONNABORTED" ||
    lastError?.message?.includes("timeout")
  ) {
    const err = new Error("LeetCode request timed out");
    err.code = "LEETCODE_TIMEOUT";
    err.permanent = false;
    throw err;
  }

  throw lastError;
};

/** Test-only overrides — never set in production. */
export const __testHooks = {
  fetchPublicProfile: null,
  fetchRecentAcSubmissions: null,
  fetchRecentSubmissions: null,
};

export const fetchPublicProfile = async (username) => {
  if (typeof __testHooks.fetchPublicProfile === "function") {
    return __testHooks.fetchPublicProfile(username);
  }
  const data = await leetcodeGraphql(
    PROFILE_QUERY,
    { username },
    { refererUsername: username }
  );
  return data?.matchedUser || null;
};

export const fetchRecentAcSubmissions = async (username, limit = 20) => {
  if (typeof __testHooks.fetchRecentAcSubmissions === "function") {
    return __testHooks.fetchRecentAcSubmissions(username, limit);
  }
  const capped = Math.min(20, Math.max(1, Number(limit) || 20));
  const data = await leetcodeGraphql(
    RECENT_AC_QUERY,
    { username, limit: capped },
    { refererUsername: username }
  );
  return Array.isArray(data?.recentAcSubmissionList)
    ? data.recentAcSubmissionList
    : [];
};

export const fetchRecentSubmissions = async (username) => {
  if (typeof __testHooks.fetchRecentSubmissions === "function") {
    return __testHooks.fetchRecentSubmissions(username);
  }
  const data = await leetcodeGraphql(
    RECENT_SUBMISSIONS_QUERY,
    { username },
    { refererUsername: username }
  );
  return Array.isArray(data?.recentSubmissionList)
    ? data.recentSubmissionList
    : [];
};

export const LEETCODE_CAPABILITIES = Object.freeze({
  profile: true,
  /** Public GraphQL returns only a short recent window (~20). */
  submissionImport: "public_recent_only",
  /** Source requires an authenticated LeetCode session — not supported in Phase 2. */
  sourceCode: "unsupported",
  maxPublicRecent: 20,
});
