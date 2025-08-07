import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache, MemoryCacheMap } from '@fjell/cache';
import { ComKey, Item, ItemQuery, LocKeyArray, PriKey, UUID } from '@fjell/core';
import { useCacheQuery } from '../../src/hooks/useCacheQuery';

// Mock logger to avoid console noise in tests
vi.mock('../../src/logger', () => ({
  default: {
    get: () => ({
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

interface TestItem extends Item<'test', 'container'> {
  name: string;
  value: number;
  key: ComKey<'test', 'container'>;
  events: {
    created: { at: Date };
    updated: { at: Date };
    deleted: { at: null };
  };
}

type TestItemCache = Cache<TestItem, 'test', 'container'>;

describe('useCacheQuery', () => {
  let cacheMap: MemoryCacheMap<TestItem, 'test', 'container', never, never, never, never>;
  let cache: TestItemCache;
  let eventListeners: Array<(event: any) => void>;
  let unsubscribeFunctions: Array<() => void>;

  const priKey1: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
  const priKey2: PriKey<'test'> = { pk: '2-2-2-2-2' as UUID, kt: 'test' };
  const locKeyArray: LocKeyArray<'container'> = [{ lk: '3-3-3-3-3' as UUID, kt: 'container' }];

  const itemKey1: ComKey<'test', 'container'> = { kt: priKey1.kt, pk: priKey1.pk, loc: locKeyArray };
  const itemKey2: ComKey<'test', 'container'> = { kt: priKey2.kt, pk: priKey2.pk, loc: locKeyArray };

  const testItem1: TestItem = {
    key: itemKey1,
    name: 'test1',
    value: 10,
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  const testItem2: TestItem = {
    key: itemKey2,
    name: 'test2',
    value: 20,
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  beforeEach(() => {
    vi.resetAllMocks();
    eventListeners = [];
    unsubscribeFunctions = [];

    // Set up cache with test data
    cacheMap = new MemoryCacheMap<TestItem, 'test', 'container', never, never, never, never>(['test']);
    cacheMap.set(itemKey1, testItem1);
    cacheMap.set(itemKey2, testItem2);

    // Create cache with mocked operations and subscription
    cache = {
      coordinate: {
        kta: ['test']
      },
      cacheMap,
      operations: {
        all: vi.fn().mockResolvedValue([null, [testItem1, testItem2]]),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      },
      subscribe: vi.fn((listener, options) => {
        // Prevent infinite subscription loops
        if (eventListeners.includes(listener)) {
          return eventListeners.find((_, index) => eventListeners[index] === listener);
        }

        eventListeners.push(listener);
        const unsubscribe = () => {
          const index = eventListeners.indexOf(listener);
          if (index > -1) {
            eventListeners.splice(index, 1);
          }
        };
        unsubscribeFunctions.push(unsubscribe);

        return {
          id: `sub_${eventListeners.length}`,
          unsubscribe,
          isActive: () => eventListeners.includes(listener),
          getOptions: () => options || {}
        };
      }),
      unsubscribe: vi.fn()
    } as any;
  });

  afterEach(() => {
    // Clean up all subscriptions first
    unsubscribeFunctions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch {
        // Ignore cleanup errors
      }
    });

    vi.clearAllMocks();

    // Clear all event listeners and ensure cleanup
    eventListeners.length = 0;
    unsubscribeFunctions.length = 0;

    // Force garbage collection if available (test environment)
    if (global.gc) {
      global.gc();
    }
  });

  // Helper function to trigger events
  const triggerEvent = (event: any) => {
    eventListeners.forEach(listener => listener(event));
  };

  describe('Initial State and Loading', () => {
    it('should handle null cache', () => {
      const { result } = renderHook(() => useCacheQuery(null, {}, []));

      expect(result.current.items).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should load initial items from cache', () => {
      const { result } = renderHook(() => useCacheQuery(cache, {}, []));

      expect(result.current.items).toEqual([testItem1, testItem2]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should filter items based on query', () => {
      vi.spyOn(cacheMap, 'queryIn').mockReturnValue([testItem1]);

      const { result } = renderHook(() => useCacheQuery(cache, { name: 'test1' }, []));

      expect(result.current.items).toEqual([testItem1]);
      expect(cacheMap.queryIn).toHaveBeenCalledWith({ name: 'test1' }, []);
    });
  });

  describe('Event Handling', () => {
    it('should update items when items_queried event matches query', () => {
      const query: ItemQuery = {};
      const locations: LocKeyArray<'container'> = [];

      const { result } = renderHook(() => useCacheQuery(cache, query, locations));

      const newItems = [testItem2];
      const event = {
        type: 'items_queried',
        query,
        locations,
        items: newItems
      };

      act(() => {
        triggerEvent(event);
      });

      expect(result.current.items).toEqual(newItems);
    });

    it('should re-query cache for item_created event', () => {
      const { result } = renderHook(() => useCacheQuery(cache, {}, []));

      const newItems = [testItem1, testItem2, testItem1];
      vi.spyOn(cacheMap, 'queryIn').mockReturnValue(newItems);

      act(() => {
        triggerEvent({ type: 'item_created', item: testItem1 });
      });

      expect(result.current.items).toEqual(newItems);
    });

    it('should remove item for item_removed event', () => {
      const { result } = renderHook(() => useCacheQuery(cache, {}, []));

      expect(result.current.items).toEqual([testItem1, testItem2]);

      act(() => {
        triggerEvent({ type: 'item_removed', key: itemKey1 });
      });

      expect(result.current.items).toEqual([testItem2]);
    });

    it('should clear items for cache_cleared event', () => {
      const { result } = renderHook(() => useCacheQuery(cache, {}, []));

      expect(result.current.items).toEqual([testItem1, testItem2]);

      act(() => {
        triggerEvent({ type: 'cache_cleared' });
      });

      expect(result.current.items).toEqual([]);
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch items from cache operations', async () => {
      const { result } = renderHook(() => useCacheQuery(cache, {}, []));

      const newItems = [testItem1];
      vi.mocked(cache.operations.all).mockResolvedValue([null, newItems]);

      let refetchResult: TestItem[];
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(refetchResult!).toEqual(newItems);
      expect(result.current.items).toEqual(newItems);
    });

    it('should handle refetch errors', async () => {
      const { result } = renderHook(() => useCacheQuery(cache, {}, []));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(cache.operations.all).mockRejectedValue(new Error('Test error'));

      let refetchResult: TestItem[];
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(refetchResult!).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when refetching with null cache', async () => {
      const { result } = renderHook(() => useCacheQuery(null, {}, []));

      const refetchResult = await result.current.refetch();
      expect(refetchResult).toEqual([]);
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to cache events', () => {
      renderHook(() => useCacheQuery(cache, {}, []));

      expect(cache.subscribe).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          eventTypes: expect.arrayContaining([
            'items_queried',
            'item_created',
            'item_updated',
            'item_removed',
            'item_retrieved',
            'item_set',
            'cache_cleared'
          ]),
          debounceMs: 50
        })
      );
    });
  });

  describe('Parameter Changes', () => {
    it('should update when query changes and handle memory cleanup', () => {
      const { result, rerender, unmount } = renderHook(
        ({ query }) => useCacheQuery(cache, query, []),
        { initialProps: { query: {} } }
      );

      expect(result.current.items).toEqual([testItem1, testItem2]);

      vi.spyOn(cacheMap, 'queryIn').mockReturnValue([testItem1]);
      rerender({ query: { name: 'test1' } });

      expect(result.current.items).toEqual([testItem1]);

      // Explicitly unmount to ensure cleanup
      unmount();
    });
  });
});
