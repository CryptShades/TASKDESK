/**
 * Edge-compatible rate limiters backed by Upstash Redis.
 *
 * Graceful degradation: when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * are absent (e.g. local dev without Upstash), all checks return null and the
 * caller passes the request through without limiting.
 *
 * Thresholds (sliding window):
 *   signup  — 5 requests per 15 minutes per IP
 *   accept  — 10 requests per 15 minutes per IP
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type LimitResult = Awaited<ReturnType<Ratelimit['limit']>>;

const upstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = upstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export const signupLimiter: Ratelimit | null = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'rl:signup',
    })
  : null;

export const acceptLimiter: Ratelimit | null = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: 'rl:accept',
    })
  : null;

/**
 * Apply a rate limit check. Returns null (passthrough) when the limiter is
 * unconfigured, or the Upstash result object otherwise.
 */
export async function applyRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<LimitResult | null> {
  if (!limiter) return null;
  return limiter.limit(identifier);
}
