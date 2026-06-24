import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import redis from '../config/redis';

/**
 * express-rate-limit store backed by the shared Upstash Redis (REST) client, so
 * rate-limit counters are shared across all serverless instances instead of being
 * per-instance in memory (which silently multiplied the effective limit on Vercel).
 *
 * Uses a fixed-window counter: INCR the key, set the window TTL on first hit.
 */
class UpstashRateLimitStore implements Store {
  windowMs = 60_000;
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private redisKey(key: string): string {
    return `ratelimit:${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const k = this.redisKey(key);
    const totalHits = await redis!.incr(k);
    if (totalHits === 1) {
      // First hit in this window — start the expiry clock.
      await redis!.pexpire(k, this.windowMs);
    }
    let ttl = await redis!.pttl(k);
    if (ttl < 0) {
      // Key had no TTL (edge case) — reapply it.
      await redis!.pexpire(k, this.windowMs);
      ttl = this.windowMs;
    }
    return { totalHits, resetTime: new Date(Date.now() + ttl) };
  }

  async decrement(key: string): Promise<void> {
    await redis!.decr(this.redisKey(key));
  }

  async resetKey(key: string): Promise<void> {
    await redis!.del(this.redisKey(key));
  }
}

/**
 * Returns a Redis-backed store when Upstash is configured, otherwise undefined so
 * express-rate-limit falls back to its default in-memory store (fine for local dev).
 */
export function makeRateLimitStore(prefix: string): Store | undefined {
  if (!redis) return undefined;
  return new UpstashRateLimitStore(prefix);
}
