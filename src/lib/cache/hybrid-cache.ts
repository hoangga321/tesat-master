interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

/**
 * Hybrid Redis-compatible & In-Memory TTL Cache Engine.
 * Pre-caches AI Tutor hints, translations, and flashcards to eliminate redundant LLM calls.
 */
export class HybridCacheService {
  private memoryStore = new Map<string, CacheEntry<unknown>>();
  private defaultTtlMs: number;

  constructor(defaultTtlSeconds = 3600) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    entry.hits += 1;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs;
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      hits: 0,
    });
  }

  async getOrCompute<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<{
    data: T;
    fromCache: boolean;
  }> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return { data: fresh, fromCache: false };
  }

  clear(): void {
    this.memoryStore.clear();
  }

  stats(): { keysCount: number; redisConfigured: boolean } {
    return {
      keysCount: this.memoryStore.size,
      redisConfigured: Boolean(process.env.REDIS_URL),
    };
  }
}

export const globalTesatCache = new HybridCacheService(7200);

/**
 * Sliding-window Rate Limiter for AI Endpoints (/api/ai/tutor, /api/ai/twin)
 */
export class RateLimiter {
  private buckets = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 30, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  check(clientKey: string, now = Date.now()): {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
  } {
    const timestamps = (this.buckets.get(clientKey) ?? []).filter((t) => now - t < this.windowMs);
    if (timestamps.length >= this.maxRequests) {
      const oldest = timestamps[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Math.max(1, Math.ceil((this.windowMs - (now - oldest)) / 1000)),
      };
    }
    timestamps.push(now);
    this.buckets.set(clientKey, timestamps);
    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      resetInSeconds: Math.ceil(this.windowMs / 1000),
    };
  }
}

export const aiEndpointRateLimiter = new RateLimiter(30, 60);
