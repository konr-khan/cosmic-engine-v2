/**
 * @file lruCache.test.ts
 * Unit test suite for generic LruCache<K, V>:
 * - Capacity validation and bounds checking
 * - Eviction of oldest entries upon reaching maxCapacity
 * - Promotion of entries on read (get) and write (set)
 * - Size tracking, delete, clear, and has operations
 * - Iterator behavior and edge cases (single-item capacity)
 */

import { describe, it, expect } from 'vitest';
import { LruCache } from './lruCache';

describe('LruCache<K, V>', () => {
  describe('Constructor & Capacity', () => {
    it('initializes with specified capacity and zero size', () => {
      const cache = new LruCache<string, number>(10);
      expect(cache.maxCapacity).toBe(10);
      expect(cache.size).toBe(0);
    });

    it('floors fractional capacity values', () => {
      const cache = new LruCache<string, number>(4.8);
      expect(cache.maxCapacity).toBe(4);
    });

    it('throws when maxCapacity is non-positive or non-finite', () => {
      expect(() => new LruCache<string, number>(0)).toThrow('maxCapacity must be a positive finite number');
      expect(() => new LruCache<string, number>(-5)).toThrow('maxCapacity must be a positive finite number');
      expect(() => new LruCache<string, number>(NaN)).toThrow('maxCapacity must be a positive finite number');
      expect(() => new LruCache<string, number>(Infinity)).toThrow('maxCapacity must be a positive finite number');
    });
  });

  describe('Basic Cache Operations', () => {
    it('sets and gets entries accurately', () => {
      const cache = new LruCache<string, string>(3);
      cache.set('a', 'alpha');
      cache.set('b', 'beta');

      expect(cache.size).toBe(2);
      expect(cache.get('a')).toBe('alpha');
      expect(cache.get('b')).toBe('beta');
      expect(cache.get('c')).toBeUndefined();
    });

    it('updates value and preserves size when re-setting existing key', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('x', 10);
      cache.set('x', 20);

      expect(cache.size).toBe(1);
      expect(cache.get('x')).toBe(20);
    });

    it('has() reports presence without mutating order', () => {
      const cache = new LruCache<string, number>(2);
      cache.set('k1', 1);
      cache.set('k2', 2);

      expect(cache.has('k1')).toBe(true);
      expect(cache.has('k2')).toBe(true);
      expect(cache.has('k3')).toBe(false);

      // Add 3rd item - because k1 was not accessed via get(), k1 remains oldest and should be evicted
      cache.set('k3', 3);
      expect(cache.has('k1')).toBe(false);
      expect(cache.has('k2')).toBe(true);
      expect(cache.has('k3')).toBe(true);
    });

    it('delete() removes entries and returns correct boolean status', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.delete('a')).toBe(true);
      expect(cache.has('a')).toBe(false);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.size).toBe(1);

      expect(cache.delete('non_existent')).toBe(false);
      expect(cache.size).toBe(1);
    });

    it('clear() empties all entries and resets size', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.has('b')).toBe(false);
    });
  });

  describe('LRU Eviction & Recency Promotion', () => {
    it('evicts the oldest entry when capacity is exceeded', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('first', 1);
      cache.set('second', 2);
      cache.set('third', 3);

      // Inserting 4th item should evict 'first'
      cache.set('fourth', 4);

      expect(cache.size).toBe(3);
      expect(cache.has('first')).toBe(false);
      expect(cache.get('first')).toBeUndefined();
      expect(cache.get('second')).toBe(2);
      expect(cache.get('third')).toBe(3);
      expect(cache.get('fourth')).toBe(4);
    });

    it('promotes entry on get() so it survives subsequent insertions', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' to promote it to MRU
      expect(cache.get('a')).toBe(1);

      // Insert 'd'; 'b' is now the oldest and should be evicted
      cache.set('d', 4);

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('promotes entry on set() overwrite so it survives subsequent insertions', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Overwrite 'a' to promote it to MRU
      cache.set('a', 100);

      // Insert 'd'; 'b' is now the oldest and should be evicted
      cache.set('d', 4);

      expect(cache.has('a')).toBe(true);
      expect(cache.get('a')).toBe(100);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('operates correctly with single-item capacity (maxCapacity = 1)', () => {
      const cache = new LruCache<string, number>(1);
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);

      cache.set('b', 2);
      expect(cache.has('a')).toBe(false);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.size).toBe(1);
    });
  });

  describe('Iteration & Map Compatibility', () => {
    it('yields keys, values, and entries in LRU order (oldest to newest)', () => {
      const cache = new LruCache<string, number>(4);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4);

      // Refresh 'b'
      cache.get('b');

      expect(Array.from(cache.keys())).toEqual(['a', 'c', 'd', 'b']);
      expect(Array.from(cache.values())).toEqual([1, 3, 4, 2]);
      expect(Array.from(cache.entries())).toEqual([
        ['a', 1],
        ['c', 3],
        ['d', 4],
        ['b', 2]
      ]);
      expect(Array.from(cache)).toEqual([
        ['a', 1],
        ['c', 3],
        ['d', 4],
        ['b', 2]
      ]);
    });

    it('supports complex key types like objects', () => {
      const cache = new LruCache<{ id: number }, string>(2);
      const k1 = { id: 1 };
      const k2 = { id: 2 };
      const k3 = { id: 3 };

      cache.set(k1, 'one');
      cache.set(k2, 'two');
      expect(cache.get(k1)).toBe('one');

      cache.set(k3, 'three');
      expect(cache.has(k1)).toBe(true);
      expect(cache.has(k2)).toBe(false);
      expect(cache.get(k3)).toBe('three');
    });
  });
});
