/**
 * @file lruCache.ts
 * Generic Least-Recently-Used (LRU) Cache
 * 
 * Provides O(1) key lookups, insertions, deletions, and LRU eviction
 * backed by JavaScript's Map insertion-order guarantee.
 */

export class LruCache<K, V> {
  private readonly _maxCapacity: number;
  private readonly _cache: Map<K, V>;

  constructor(maxCapacity: number) {
    if (maxCapacity <= 0 || !Number.isFinite(maxCapacity)) {
      throw new Error('maxCapacity must be a positive finite number');
    }
    this._maxCapacity = Math.floor(maxCapacity);
    this._cache = new Map<K, V>();
  }

  /**
   * Retrieves an item from the cache and promotes it to most recently used.
   * Returns undefined if key is not found.
   */
  public get(key: K): V | undefined {
    if (!this._cache.has(key)) {
      return undefined;
    }
    const value = this._cache.get(key)!;
    // Re-insert to promote key to most recently used (end of insertion order)
    this._cache.delete(key);
    this._cache.set(key, value);
    return value;
  }

  /**
   * Inserts or updates an item in the cache.
   * Promotes the item to most recently used.
   * If capacity is exceeded, evicts the oldest item.
   */
  public set(key: K, value: V): void {
    if (this._cache.has(key)) {
      this._cache.delete(key);
    } else if (this._cache.size >= this._maxCapacity) {
      const oldestKey = this._cache.keys().next().value;
      if (oldestKey !== undefined) {
        this._cache.delete(oldestKey);
      }
    }
    this._cache.set(key, value);
  }

  /**
   * Checks if a key exists in the cache without promoting it.
   */
  public has(key: K): boolean {
    return this._cache.has(key);
  }

  /**
   * Deletes a key from the cache. Returns true if the key existed.
   */
  public delete(key: K): boolean {
    return this._cache.delete(key);
  }

  /**
   * Removes all entries from the cache.
   */
  public clear(): void {
    this._cache.clear();
  }

  /**
   * Current number of items stored in the cache.
   */
  public get size(): number {
    return this._cache.size;
  }

  /**
   * Maximum capacity of the cache.
   */
  public get maxCapacity(): number {
    return this._maxCapacity;
  }

  public keys(): IterableIterator<K> {
    return this._cache.keys();
  }

  public values(): IterableIterator<V> {
    return this._cache.values();
  }

  public entries(): IterableIterator<[K, V]> {
    return this._cache.entries();
  }

  public [Symbol.iterator](): IterableIterator<[K, V]> {
    return this._cache[Symbol.iterator]();
  }
}

export default LruCache;
