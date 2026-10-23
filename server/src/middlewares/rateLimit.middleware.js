/**
 * Lightweight in-memory rate limiter (no external dependency).
 * Suitable for expensive endpoints such as platform sync.
 *
 * NOTE: Per-process only — reset on restart; not shared across instances.
 */
export const createRateLimiter = ({
  windowMs = 60_000,
  max = 10,
  message = "Too many requests. Please try again later.",
  keyFn = (req) => req.user?.id || req.ip || "anonymous",
} = {}) => {
  const hits = new Map();

  const prune = (now) => {
    for (const [key, entry] of hits) {
      if (now - entry.start >= windowMs) hits.delete(key);
    }
  };

  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 10_000) prune(now);

    const key = String(keyFn(req));
    let entry = hits.get(key);

    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }

    entry.count += 1;

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, max - entry.count))
    );

    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    return next();
  };
};

/** Stricter limiter for Codeforces / unified sync endpoints. */
export const syncRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 6,
  message: "Sync rate limit exceeded. Wait a minute before retrying.",
});
