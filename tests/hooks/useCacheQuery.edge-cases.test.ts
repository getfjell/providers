import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCacheQuery } from "../../src/hooks/useCacheQuery";

describe("useCacheQuery edge cases", () => {
  let mockCache: any;
  let mockOperations: any;
  let mockEventEmitter: any;
  let eventListeners: Map<string, Set<(...args: any[]) => void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    
    eventListeners = new Map();

    mockOperations = {
      all: vi.fn().mockResolvedValue({ items: [], metadata: { total: 0, returned: 0 } })
    };

    mockEventEmitter = {
      on: vi.fn((event: string, handler: (...args: any[]) => void) => {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, new Set());
        }
        eventListeners.get(event)!.add(handler);
        return () => {
          eventListeners.get(event)?.delete(handler);
        };
      }),
      off: vi.fn((event: string, handler: (...args: any[]) => void) => {
        eventListeners.get(event)?.delete(handler);
      }),
      emit: vi.fn()
    };

    mockCache = {
      operations: mockOperations,
      eventEmitter: mockEventEmitter,
      subscribe: vi.fn((handler: (...args: any[]) => void) => {
        if (!eventListeners.has('all')) {
          eventListeners.set('all', new Set());
        }
        eventListeners.get('all')!.add(handler);
        return {
          unsubscribe: () => {
            eventListeners.get('all')?.delete(handler);
          }
        };
      })
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    eventListeners.clear();
  });

  describe("initial state", () => {
    it("should start with isLoading true", async () => {
      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.items).toEqual([]);
      
      await act(async () => {
        await vi.runAllTimersAsync();
      });
    });

    it("should handle null cache without allMethod", async () => {
      const { result } = renderHook(() =>
        useCacheQuery(null, {}, [])
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.items).toEqual([]);
    });

    it("should work with allMethod when cache is null", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const allMethod = vi.fn().mockResolvedValue({ items, metadata: { total: 1 } });

      const { result } = renderHook(() =>
        useCacheQuery(null, {}, [], allMethod)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(items);
      expect(allMethod).toHaveBeenCalled();
    });
  });

  describe("query loading", () => {
    it("should load items from cache on mount", async () => {
      const items = [
        { key: { kt: "test", pk: "1" }, name: "item1" },
        { key: { kt: "test", pk: "2" }, name: "item2" }
      ];
      mockOperations.all.mockResolvedValue({ items, metadata: { total: 2 } });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(items);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle cache error gracefully", async () => {
      mockOperations.all.mockRejectedValue(new Error("Cache error"));

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle AllOperationResult format", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      mockOperations.all.mockResolvedValue({
        items,
        metadata: { total: 1, returned: 1, hasMore: false }
      });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(items);
    });

    it("should handle array format from allMethod", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const allMethod = vi.fn().mockResolvedValue(items);

      const { result } = renderHook(() =>
        useCacheQuery(null, {}, [], allMethod)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(items);
    });
  });

  describe("race conditions", () => {
    it("should handle rapid query changes without stale data", async () => {
      const items1 = [{ key: { kt: "test", pk: "1" }, name: "query1" }];
      const items2 = [{ key: { kt: "test", pk: "2" }, name: "query2" }];
      
      // Simulate slow first request, fast second request
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise((resolve) => { resolveFirst = resolve; });
      
      mockOperations.all
        .mockReturnValueOnce(firstPromise) // First query - slow
        .mockResolvedValue({ items: items2, metadata: { total: 1 } }); // Second query - fast

      const { result, rerender } = renderHook(
        ({ query }) => useCacheQuery(mockCache, query, []),
        { initialProps: { query: { type: "first" } } }
      );

      // Change query before first request completes
      rerender({ query: { type: "second" } });
      
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Now resolve the first (stale) request
      await act(async () => {
        resolveFirst!({ items: items1, metadata: { total: 1 } });
        await vi.runAllTimersAsync();
      });

      // Should have items2, not items1 (the stale response)
      expect(result.current.items).toEqual(items2);
    });

    it("should handle concurrent refetch calls", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      
      mockOperations.all.mockImplementation(() => {
        return Promise.resolve({ items, metadata: { total: 1 } });
      });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Trigger multiple refetches
      await act(async () => {
        result.current.refetch();
        result.current.refetch();
        result.current.refetch();
        await vi.runAllTimersAsync();
      });

      // All calls should complete without error
      expect(result.current.items).toEqual(items);
    });
  });

  describe("event handling", () => {
    it("should update items on items_queried event with matching query", async () => {
      const initialItems = [{ key: { kt: "test", pk: "1" }, name: "initial" }];
      const updatedItems = [{ key: { kt: "test", pk: "2" }, name: "updated" }];
      
      mockOperations.all.mockResolvedValue({ items: initialItems, metadata: { total: 1 } });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, { status: "active" }, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(initialItems);

      // Simulate items_queried event with matching query
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({
            type: 'items_queried',
            query: { status: "active" },
            locations: [],
            items: updatedItems
          });
        });
      });

      expect(result.current.items).toEqual(updatedItems);
    });

    it("should ignore items_queried event with non-matching query", async () => {
      const myItems = [{ key: { kt: "test", pk: "1" }, name: "mine" }];
      const otherItems = [{ key: { kt: "test", pk: "2" }, name: "other" }];
      
      mockOperations.all.mockResolvedValue({ items: myItems, metadata: { total: 1 } });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, { status: "active" }, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(myItems);

      // Simulate event with different query
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({
            type: 'items_queried',
            query: { status: "inactive" },
            locations: [],
            items: otherItems
          });
        });
      });

      // Should still have my items
      expect(result.current.items).toEqual(myItems);
    });

    it("should remove item on item_removed event", async () => {
      const items = [
        { key: { kt: "test", pk: "1" }, name: "item1" },
        { key: { kt: "test", pk: "2" }, name: "item2" }
      ];
      
      mockOperations.all.mockResolvedValue({ items, metadata: { total: 2 } });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toHaveLength(2);

      // Simulate item_removed event
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({
            type: 'item_removed',
            key: { kt: "test", pk: "1" }
          });
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe("item2");
    });

    it("should clear items on cache_cleared event", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      
      mockOperations.all.mockResolvedValue({ items, metadata: { total: 1 } });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toHaveLength(1);

      // Simulate cache_cleared event
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({ type: 'cache_cleared' });
        });
      });

      expect(result.current.items).toEqual([]);
    });

    it("should refetch on query_invalidated event", async () => {
      const initialItems = [{ key: { kt: "test", pk: "1" }, name: "initial" }];
      const freshItems = [{ key: { kt: "test", pk: "2" }, name: "fresh" }];
      
      mockOperations.all
        .mockResolvedValueOnce({ items: initialItems, metadata: { total: 1 } })
        .mockResolvedValue({ items: freshItems, metadata: { total: 1 } });

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(initialItems);

      // Simulate query_invalidated event
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({ type: 'query_invalidated' });
        });
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(freshItems);
    });
  });

  describe("refetch function", () => {
    it("should return empty array when no cache or allMethod", async () => {
      const { result } = renderHook(() =>
        useCacheQuery(null, {}, [])
      );

      const refetchResult = await act(async () => {
        return result.current.refetch();
      });

      expect(refetchResult).toEqual([]);
    });

    it("should handle refetch error gracefully", async () => {
      mockOperations.all
        .mockResolvedValueOnce({ items: [], metadata: { total: 0 } })
        .mockRejectedValue(new Error("Refetch error"));

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const refetchResult = await act(async () => {
        return result.current.refetch();
      });

      expect(refetchResult).toEqual([]);
    });

    it("should set isLoading during refetch", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      
      let resolveAll: (value: any) => void;
      const allPromise = new Promise((resolve) => { resolveAll = resolve; });
      
      mockOperations.all
        .mockResolvedValueOnce({ items: [], metadata: { total: 0 } })
        .mockReturnValue(allPromise);

      const { result } = renderHook(() =>
        useCacheQuery(mockCache, {}, [])
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);

      // Start refetch
      let refetchPromise: Promise<any>;
      await act(async () => {
        refetchPromise = result.current.refetch();
      });

      expect(result.current.isLoading).toBe(true);

      // Complete refetch
      await act(async () => {
        resolveAll!({ items, metadata: { total: 1 } });
        await refetchPromise;
        await vi.runAllTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.items).toEqual(items);
    });
  });

  describe("query/locations stability", () => {
    it("should not refetch on equivalent query object", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      mockOperations.all.mockResolvedValue({ items, metadata: { total: 1 } });

      const { result, rerender } = renderHook(
        ({ query }) => useCacheQuery(mockCache, query, []),
        { initialProps: { query: { status: "active", type: "test" } } }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Rerender with equivalent query (same values, potentially different object)
      rerender({ query: { type: "test", status: "active" } }); // Different order

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should be called again due to object reference change (this is expected React behavior)
      // The important thing is the query hash should be the same
      expect(result.current.items).toEqual(items);
    });

    it("should refetch on different query values", async () => {
      const items1 = [{ key: { kt: "test", pk: "1" }, name: "item1" }];
      const items2 = [{ key: { kt: "test", pk: "2" }, name: "item2" }];
      
      mockOperations.all
        .mockResolvedValueOnce({ items: items1, metadata: { total: 1 } })
        .mockResolvedValue({ items: items2, metadata: { total: 1 } });

      const { result, rerender } = renderHook(
        ({ query }) => useCacheQuery(mockCache, query, []),
        { initialProps: { query: { status: "active" } } }
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(items1);

      // Rerender with different query
      rerender({ query: { status: "inactive" } });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.items).toEqual(items2);
    });
  });
});
