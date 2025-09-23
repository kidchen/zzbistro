interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  refreshing?: boolean;
}

class DataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STALE_WHILE_REVALIDATE = 2 * 60 * 1000; // 2 minutes

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      refreshing: false
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const isExpired = age > entry.ttl;
    const isStale = age > this.STALE_WHILE_REVALIDATE;

    // Always return data if we have it, even if expired
    // This prevents empty content flashes for existing users
    if (isExpired && !entry.refreshing) {
      entry.refreshing = true;
      // Background refresh will be handled by the storage layer
    } else if (isStale && !entry.refreshing) {
      entry.refreshing = true;
      // Background refresh will be handled by the storage layer
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // Update existing cache entry with fresh data
  refresh<T>(key: string, data: T): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.data = data;
      entry.timestamp = Date.now();
      entry.refreshing = false;
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const dataCache = new DataCache();
