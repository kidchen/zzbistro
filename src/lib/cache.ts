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

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    // Return stale data but mark for background refresh
    if (isStale && !entry.refreshing) {
      entry.refreshing = true;
      this.triggerBackgroundRefresh(key);
    }

    return entry.data as T;
  }

  private triggerBackgroundRefresh(key: string): void {
    // This would be implemented by the storage layer
    // to refresh data in the background
    setTimeout(() => {
      const entry = this.cache.get(key);
      if (entry) {
        entry.refreshing = false;
      }
    }, 30000); // Reset refresh flag after 30s
  }

  invalidate(key: string): void {
    this.cache.delete(key);
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
