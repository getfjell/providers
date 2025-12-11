import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCacheItem } from "../../src/hooks/useCacheItem";

describe("useCacheItem edge cases", () => {
  let mockCache: any;
  let mockCacheMap: any;
  let mockOperations: any;
  let mockEventEmitter: any;
  let eventListeners: Map<string, Set<(...args: any[]) => void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    
    eventListeners = new Map();

    mockCacheMap = {
      get: vi.fn().mockResolvedValue(null)
    };

    mockOperations = {
      get: vi.fn().mockResolvedValue(null)
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
      cacheMap: mockCacheMap,
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
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.item).toBeNull();
      
      await act(async () => {
        await vi.runAllTimersAsync();
      });
    });

    it("should handle null cache", async () => {
      const { result } = renderHook(() =>
        useCacheItem(null, { kt: "test", pk: "1" } as any)
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.item).toBeNull();
    });

    it("should handle null key", async () => {
      const { result } = renderHook(() =>
        useCacheItem(mockCache, null)
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.item).toBeNull();
    });
  });

  describe("cache loading", () => {
    it("should load item from cache on mount", async () => {
      const item = { key: { kt: "test", pk: "1" }, name: "cached" };
      mockCacheMap.get.mockResolvedValue(item);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toEqual(item);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle cache error gracefully", async () => {
      mockCacheMap.get.mockRejectedValue(new Error("Cache error"));

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("race conditions", () => {
    it("should handle rapid key changes without stale data", async () => {
      const item1 = { key: { kt: "test", pk: "1" }, name: "item1" };
      const item2 = { key: { kt: "test", pk: "2" }, name: "item2" };
      
      // Simulate slow first request, fast second request
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise((resolve) => { resolveFirst = resolve; });
      
      mockCacheMap.get
        .mockReturnValueOnce(firstPromise) // First key - slow
        .mockResolvedValue(item2); // Second key - fast

      const { result, rerender } = renderHook(
        ({ key }) => useCacheItem(mockCache, key),
        { initialProps: { key: { kt: "test", pk: "1" } as any } }
      );

      // Change key before first request completes
      rerender({ key: { kt: "test", pk: "2" } as any });
      
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Now resolve the first (stale) request
      await act(async () => {
        resolveFirst!(item1);
        await vi.runAllTimersAsync();
      });

      // Should have item2, not item1 (the stale response)
      expect(result.current.item).toEqual(item2);
    });

    it("should handle refetch during pending load", async () => {
      const item1 = { key: { kt: "test", pk: "1" }, name: "cached" };
      const item2 = { key: { kt: "test", pk: "1" }, name: "fresh" };
      
      // Initial load returns cached item
      mockCacheMap.get.mockResolvedValue(item1);
      
      // Refetch returns fresh item
      mockOperations.get.mockResolvedValue(item2);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      // Wait for initial load
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toEqual(item1);

      // Trigger refetch
      await act(async () => {
        result.current.refetch();
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toEqual(item2);
    });
  });

  describe("event handling", () => {
    it("should update item on item_set event", async () => {
      const initialItem = { key: { kt: "test", pk: "1" }, name: "initial" };
      const updatedItem = { key: { kt: "test", pk: "1" }, name: "updated" };
      
      mockCacheMap.get.mockResolvedValue(initialItem);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toEqual(initialItem);

      // Simulate item_set event
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({
            type: 'item_set',
            key: { kt: "test", pk: "1" },
            item: updatedItem
          });
        });
      });

      expect(result.current.item).toEqual(updatedItem);
    });

    it("should clear item on item_removed event", async () => {
      const initialItem = { key: { kt: "test", pk: "1" }, name: "initial" };
      
      mockCacheMap.get.mockResolvedValue(initialItem);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toEqual(initialItem);

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

      expect(result.current.item).toBeNull();
    });

    it("should clear item on cache_cleared event", async () => {
      const initialItem = { key: { kt: "test", pk: "1" }, name: "initial" };
      
      mockCacheMap.get.mockResolvedValue(initialItem);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toEqual(initialItem);

      // Simulate cache_cleared event
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({ type: 'cache_cleared' });
        });
      });

      expect(result.current.item).toBeNull();
    });

    it("should ignore events for different keys", async () => {
      const myItem = { key: { kt: "test", pk: "1" }, name: "mine" };
      const otherItem = { key: { kt: "test", pk: "2" }, name: "other" };
      
      mockCacheMap.get.mockResolvedValue(myItem);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.item).toEqual(myItem);

      // Simulate event for different key
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({
            type: 'item_set',
            key: { kt: "test", pk: "2" },
            item: otherItem
          });
        });
      });

      // Should still have my item
      expect(result.current.item).toEqual(myItem);
    });
  });

  describe("refetch function", () => {
    it("should return null when cache is null", async () => {
      const { result } = renderHook(() =>
        useCacheItem(null, { kt: "test", pk: "1" } as any)
      );

      const refetchResult = await act(async () => {
        return result.current.refetch();
      });

      expect(refetchResult).toBeNull();
    });

    it("should return null when key is null", async () => {
      const { result } = renderHook(() =>
        useCacheItem(mockCache, null)
      );

      const refetchResult = await act(async () => {
        return result.current.refetch();
      });

      expect(refetchResult).toBeNull();
    });

    it("should handle refetch error gracefully", async () => {
      mockCacheMap.get.mockResolvedValue(null);
      mockOperations.get.mockRejectedValue(new Error("Refetch error"));

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      const refetchResult = await act(async () => {
        return result.current.refetch();
      });

      expect(refetchResult).toBeNull();
    });

    it("should set isLoading during refetch", async () => {
      const item = { key: { kt: "test", pk: "1" }, name: "item" };
      
      let resolveGet: (value: any) => void;
      const getPromise = new Promise((resolve) => { resolveGet = resolve; });
      
      mockCacheMap.get.mockResolvedValue(null);
      mockOperations.get.mockReturnValue(getPromise);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: "1" } as any)
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
        resolveGet!(item);
        await refetchPromise;
        await vi.runAllTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.item).toEqual(item);
    });
  });

  describe("key normalization", () => {
    it("should match keys with string and number pk values", async () => {
      const item = { key: { kt: "test", pk: "1" }, name: "item" };
      
      mockCacheMap.get.mockResolvedValue(item);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { kt: "test", pk: 1 } as any) // numeric pk
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Simulate event with string pk
      await act(async () => {
        const handlers = eventListeners.get('all') || new Set();
        handlers.forEach(handler => {
          handler({
            type: 'item_set',
            key: { kt: "test", pk: "1" }, // string pk
            item: { ...item, name: "updated" }
          });
        });
      });

      // Should match and update
      expect(result.current.item?.name).toBe("updated");
    });
  });
});
