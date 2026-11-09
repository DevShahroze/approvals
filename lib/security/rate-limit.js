const buckets = new Map();

export function rateLimit(key, { limit = 60, windowMs = 60000 } = {}) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterMs: windowMs - (now - bucket.start) };
  }
  return { allowed: true };
}
