/**
 * Best-effort request throttling.
 *
 * This counter lives in the memory of a single function instance, so it limits
 * a burst from one user rather than guaranteeing a global ceiling. It exists so
 * an abusive or looping client cannot trivially run up an OpenAI bill, and so
 * the shape of the check is already here when it needs to move behind a table
 * or a shared store.
 */
interface Window {
  limit: number;
  windowMs: number;
}

const WINDOWS: Window[] = [
  { limit: 6, windowMs: 60_000 }, // 6 per minute
  { limit: 60, windowMs: 60 * 60_000 }, // 60 per hour
];

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const longestWindow = Math.max(...WINDOWS.map((window) => window.windowMs));
  const timestamps = (hits.get(key) ?? []).filter((time) => now - time < longestWindow);

  for (const window of WINDOWS) {
    const withinWindow = timestamps.filter((time) => now - time < window.windowMs);
    if (withinWindow.length >= window.limit) {
      const oldest = Math.min(...withinWindow);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((window.windowMs - (now - oldest)) / 1000)),
      };
    }
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [existingKey, times] of hits) {
      if (times.every((time) => now - time >= longestWindow)) hits.delete(existingKey);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
