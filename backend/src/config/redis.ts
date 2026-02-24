import { Redis } from '@upstash/redis';

// Upstash Redis client — HTTP-based, works in serverless (Vercel) without persistent connections.
// Falls back gracefully to null if env vars are not set (local dev without Redis).
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export default redis;

// TTLs (seconds)
export const TTL = {
  USER_PROFILE: 5 * 60,       // 5 min — auth user data (id, email, role)
  CLASS_LIST: 2 * 60,          // 2 min — class instances for a week
  SCHEDULES: 5 * 60,           // 5 min — default schedules
  LOCATIONS: 10 * 60,          // 10 min — locations list
  CLASS_TYPES: 10 * 60,        // 10 min — class types list
  COACHES: 10 * 60,            // 10 min — coaches list
};

export const cacheKey = {
  userProfile: (userId: number) => `user:${userId}:profile`,
  classList: (locationId: number, weekStart: string) => `classes:${locationId}:${weekStart}`,
  schedules: (locationId?: number) => locationId ? `schedules:loc:${locationId}` : 'schedules:all',
  locations: () => 'locations:active',
  classTypes: () => 'class_types:all',
  coaches: () => 'coaches:all',
};

// Generic cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const val = await redis.get<T>(key);
    return val ?? null;
  } catch {
    return null; // Never let cache failures break the app
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Silently ignore cache write failures
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!redis) return;
  try {
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Silently ignore
  }
}

// Invalidate all keys matching a pattern prefix (uses SCAN — safe for serverless)
export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = Number(nextCursor);
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== 0);
  } catch {
    // Silently ignore
  }
}
