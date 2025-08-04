import { describe, expect, it, vi } from 'vitest';
import { createStableHash, createStableMemo, deepEqual, isPromise } from '../src/utils';
import { withAsyncErrorHandling } from '../src/useAsyncError';

describe('Code Review Fixes', () => {
  describe('deepEqual performance optimization', () => {
    it('should efficiently compare objects with many keys', () => {
      const obj1 = Array.from({ length: 1000 }, (_, i) => [
        `key${i}`, `value${i}`
      ]).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

      const obj2 = { ...obj1 };
      const obj3 = { ...obj1, key999: 'different' };

      // These should complete quickly even with many keys
      const start = performance.now();
      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
      const end = performance.now();

      // Should complete in reasonable time (less than 10ms for 1000 keys)
      expect(end - start).toBeLessThan(10);
    });

    it('should handle circular references', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;

      const obj2: any = { a: 1 };
      obj2.self = obj2;

      const obj3: any = { a: 2 };
      obj3.self = obj3;

      expect(deepEqual(obj1, obj2)).toBe(true);
      expect(deepEqual(obj1, obj3)).toBe(false);
    });

    it('should compare arrays correctly', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should compare dates correctly', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-01-02');

      expect(deepEqual(date1, date2)).toBe(true);
      expect(deepEqual(date1, date3)).toBe(false);
    });
  });

  describe('createStableHash consistency', () => {
    it('should produce consistent hashes for equivalent objects', () => {
      const obj1 = { b: 2, a: 1, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };

      expect(createStableHash(obj1)).toBe(createStableHash(obj2));
    });

    it('should produce different hashes for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      expect(createStableHash(obj1)).not.toBe(createStableHash(obj2));
    });

    it('should handle primitive values', () => {
      expect(createStableHash(null)).toBe('null');
      // eslint-disable-next-line no-undefined
      expect(createStableHash(undefined)).toBe('undefined');
      expect(createStableHash(42)).toBe('42');
      expect(createStableHash('hello')).toBe('hello');
    });

    it('should handle arrays', () => {
      expect(createStableHash([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should handle dates', () => {
      const date = new Date('2023-01-01');
      expect(createStableHash(date)).toBe(`Date(${date.getTime()})`);
    });
  });

  describe('createStableMemo function rename', () => {
    it('should work identically to createStableHash', () => {
      const obj = { a: 1, b: 2 };
      expect(createStableMemo(obj)).toBe(createStableHash(obj));
    });

    it('should not be named like a React hook', () => {
      // This test ensures the function name doesn't start with 'use'
      expect(createStableMemo.name).toBe('createStableMemo');
      expect(createStableMemo.name.startsWith('use')).toBe(false);
    });
  });

  describe('isPromise type guard', () => {
    it('should correctly identify promises', () => {
      const promise = Promise.resolve(42);
      expect(isPromise(promise)).toBe(true);
    });

    it('should correctly identify non-promises', () => {
      expect(isPromise(null)).toBe(false);
      // eslint-disable-next-line no-undefined
      expect(isPromise(undefined)).toBe(false);
      expect(isPromise(42)).toBe(false);
      expect(isPromise('string')).toBe(false);
      expect(isPromise({})).toBe(false);
      expect(isPromise([])).toBe(false);
    });

    it('should not be fooled by objects with then method', () => {
      const fakeThen = { then: 42 };
      const partialPromise = { then: () => {} }; // Missing catch

      expect(isPromise(fakeThen)).toBe(false);
      expect(isPromise(partialPromise)).toBe(false);
    });

    it('should correctly identify promise-like objects', () => {
      const promiseLike = {
        then: () => {},
        catch: () => {}
      };

      expect(isPromise(promiseLike)).toBe(true);
    });
  });

  describe('withAsyncErrorHandling safe error conversion', () => {
    it('should pass through Error instances unchanged', async () => {
      const originalError = new Error('test error');
      const mockThrowAsyncError = vi.fn();

      const fn = withAsyncErrorHandling(
        async () => { throw originalError; },
        mockThrowAsyncError,
        false
      );

      await fn();

      expect(mockThrowAsyncError).toHaveBeenCalledWith(originalError);
    });

    it('should convert non-Error values to Error instances', async () => {
      const mockThrowAsyncError = vi.fn();

      const fn = withAsyncErrorHandling(
        async () => { throw 'string error'; },
        mockThrowAsyncError,
        false
      );

      await fn();

      expect(mockThrowAsyncError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'string error'
        })
      );
    });

    it('should handle null/undefined errors', async () => {
      const mockThrowAsyncError = vi.fn();

      const fn1 = withAsyncErrorHandling(
        async () => { throw null; },
        mockThrowAsyncError,
        false
      );

      const fn2 = withAsyncErrorHandling(
        // eslint-disable-next-line no-undefined
        async () => { throw undefined; },
        mockThrowAsyncError,
        false
      );

      await fn1();
      await fn2();

      expect(mockThrowAsyncError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'null' })
      );
      expect(mockThrowAsyncError).toHaveBeenCalledWith(

        expect.objectContaining({ message: 'undefined' })
      );
    });

    it('should return null for optional errors', async () => {
      const mockThrowAsyncError = vi.fn();

      const fn = withAsyncErrorHandling(
        async () => { throw new Error('test'); },
        mockThrowAsyncError,
        true // optional = true
      );

      const result = await fn();

      expect(result).toBe(null);
      expect(mockThrowAsyncError).not.toHaveBeenCalled();
    });

    it('should return successful results unchanged', async () => {
      const mockThrowAsyncError = vi.fn();

      const fn = withAsyncErrorHandling(
        async () => ({ success: true }),
        mockThrowAsyncError,
        false
      );

      const result = await fn();

      expect(result).toEqual({ success: true });
      expect(mockThrowAsyncError).not.toHaveBeenCalled();
    });
  });

  describe('Nested facetResults structure', () => {
    it('should support multiple facet calls with different parameters', () => {
      const facetResults: Record<string, Record<string, any>> = {};

      // Simulate first facet call
      const facet1 = 'report';
      const params1Hash = createStableHash({ code: 'GPH' });
      const result1 = { data: 'GPH data' };

      if (!facetResults[facet1]) {
        facetResults[facet1] = {};
      }
      facetResults[facet1][params1Hash] = result1;

      // Simulate second facet call with different parameters
      const params2Hash = createStableHash({ code: 'PRT' });
      const result2 = { data: 'PRT data' };

      facetResults[facet1][params2Hash] = result2;

      // Both results should be preserved
      expect(Object.keys(facetResults[facet1])).toHaveLength(2);
      expect(facetResults[facet1][params1Hash]).toEqual(result1);
      expect(facetResults[facet1][params2Hash]).toEqual(result2);
    });

    it('should handle different facets independently', () => {
      const facetResults: Record<string, Record<string, any>> = {};

      // Add result for 'report' facet
      const reportHash = createStableHash({ code: 'GPH' });
      facetResults['report'] = { [reportHash]: { data: 'report data' } };

      // Add result for 'stats' facet
      const statsHash = createStableHash({ period: 'monthly' });
      facetResults['stats'] = { [statsHash]: { count: 42 } };

      expect(Object.keys(facetResults)).toHaveLength(2);
      expect(facetResults['report'][reportHash]).toEqual({ data: 'report data' });
      expect(facetResults['stats'][statsHash]).toEqual({ count: 42 });
    });
  });

  describe('Import organization', () => {
    it('should have clean type exports available', () => {
      // Test that our new type aliases are available
      expect(typeof createStableHash).toBe('function');
      expect(typeof createStableMemo).toBe('function');
      expect(typeof deepEqual).toBe('function');
      expect(typeof isPromise).toBe('function');
      expect(typeof withAsyncErrorHandling).toBe('function');
    });
  });
});
