/**
 * A lightweight in-memory cache utility with Time-To-Live (TTL).
 * This avoids the need for external dependencies like Redis for simple use cases.
 */
class InMemoryCache {
  private cache: Map<string, { value: any; expiry: number }>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache with a specific TTL
   * @param key Cache key
   * @param value Data to cache
   * @param ttlSeconds Time to live in seconds
   */
  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value from the cache if it exists and has not expired
   * @param key Cache key
   * @returns The cached value or null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Delete a specific key from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

export const summaryCache = new InMemoryCache();
