export class InMemoryRateLimiter {
  constructor({ windowMs = 60_000, maxRequests = 30 } = {}) {
    this.windowMs = Math.max(1_000, windowMs);
    this.maxRequests = Math.max(1, maxRequests);
    this.entries = new Map();
    this.operations = 0;
  }

  consume(key, now = Date.now()) {
    this.operations += 1;
    if (this.operations % 100 === 0) {
      this.prune(now);
    }

    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.entries.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    if (current.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: current.resetAt,
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      };
    }

    current.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - current.count,
      resetAt: current.resetAt,
      retryAfterSeconds: 0,
    };
  }

  prune(now = Date.now()) {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  clear() {
    this.entries.clear();
  }
}
