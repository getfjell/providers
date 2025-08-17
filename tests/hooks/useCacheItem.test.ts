import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache } from '@fjell/cache';
import { ComKey, Item, PriKey } from '@fjell/core';
import { useCacheItem } from '../../src/hooks/useCacheItem';

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

interface TestUser extends Item<'test-user'> {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

describe('useCacheItem', () => {
  let mockCache: Cache<TestUser, 'test-user'>;
  let eventListeners: Array<(event: any) => void>;
  let consoleErrorSpy: any;

  beforeEach(() => {
    eventListeners = [];
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a mock cache with event subscription support
    mockCache = {
      coordinate: {
        kta: ['test-user']
      },
      cacheMap: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn(),
        clone: vi.fn(() => mockCache.cacheMap)
      },
      operations: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(null),
        remove: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(null),
        retrieve: vi.fn().mockResolvedValue(null),
        one: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue([]),
        action: vi.fn().mockResolvedValue(null),
        allAction: vi.fn().mockResolvedValue([]),
        facet: vi.fn().mockResolvedValue(null),
        allFacet: vi.fn().mockResolvedValue(null),
        find: vi.fn().mockResolvedValue([]),
      },
      subscribe: vi.fn((listener, options) => {
        eventListeners.push(listener);
        return {
          id: `sub_${eventListeners.length}`,
          unsubscribe: () => {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
              eventListeners.splice(index, 1);
            }
          },
          isActive: () => true,
          getOptions: () => options || {}
        };
      }),
      unsubscribe: vi.fn()
    } as any;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('initial state and loading behavior', () => {
    it('should return null item and false loading when cache is null', () => {
      const { result } = renderHook(() =>
        useCacheItem(null, { pk: 'test-user-1' })
      );

      expect(result.current.item).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should return null item and false loading when key is null', () => {
      const { result } = renderHook(() =>
        useCacheItem(mockCache, null)
      );

      expect(result.current.item).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should load item from cache on mount', async () => {
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };

      mockCache.cacheMap.get = vi.fn().mockResolvedValue(testUser);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { pk: 'test-user-1' })
      );

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.item).toEqual(testUser);
      expect(result.current.isLoading).toBe(false);
      expect(mockCache.cacheMap.get).toHaveBeenCalledWith({ pk: 'test-user-1' });
    });

    it('should return null when item not found in cache', async () => {
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useCacheItem(mockCache, { pk: 'test-user-1' })
      );

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.item).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('cache subscription and event handling', () => {
    it('should subscribe to cache events with correct options', () => {
      const key = { pk: 'test-user-1' };

      renderHook(() => useCacheItem(mockCache, key));

      expect(mockCache.subscribe).toHaveBeenCalledWith(
        expect.any(Function),
        {
          keys: [key],
          eventTypes: ['item_created', 'item_updated', 'item_removed', 'item_retrieved', 'item_set', 'cache_cleared']
        }
      );
    });

    it('should update item when item_created event occurs', async () => {
      const key = { pk: 'test-user-1' };
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate item_created event
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_created',
            key: key,
            item: testUser,
            timestamp: Date.now(),
            source: 'api'
          });
        }
      });

      expect(result.current.item).toEqual(testUser);
    });

    it('should update item when item_updated event occurs', async () => {
      const key = { pk: 'test-user-1' };
      const updatedUser: TestUser = {
        id: 'test-user-1',
        name: 'Updated User',
        email: 'updated@example.com',
        status: 'inactive'
      };

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate item_updated event
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_updated',
            key: key,
            item: updatedUser,
            timestamp: Date.now(),
            source: 'api'
          });
        }
      });

      expect(result.current.item).toEqual(updatedUser);
    });

    it('should update item when item_retrieved event occurs', async () => {
      const key = { pk: 'test-user-1' };
      const retrievedUser: TestUser = {
        id: 'test-user-1',
        name: 'Retrieved User',
        email: 'retrieved@example.com',
        status: 'active'
      };

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate item_retrieved event
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_retrieved',
            key: key,
            item: retrievedUser,
            timestamp: Date.now(),
            source: 'cache'
          });
        }
      });

      expect(result.current.item).toEqual(retrievedUser);
    });

    it('should update item when item_set event occurs', async () => {
      const key = { pk: 'test-user-1' };
      const setUser: TestUser = {
        id: 'test-user-1',
        name: 'Set User',
        email: 'set@example.com',
        status: 'active'
      };

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate item_set event
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_set',
            key: key,
            item: setUser,
            timestamp: Date.now(),
            source: 'manual'
          });
        }
      });

      expect(result.current.item).toEqual(setUser);
    });

    it('should set item to null when item_removed event occurs', async () => {
      const key = { pk: 'test-user-1' };
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };

      // Mock initial cache load to return the test user
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(testUser);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial item should be loaded
      expect(result.current.item).toEqual(testUser);

      // Simulate item_removed event
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_removed',
            key: key,
            timestamp: Date.now(),
            source: 'api'
          });
        }
      });

      expect(result.current.item).toBe(null);
    });

    it('should set item to null when cache_cleared event occurs', async () => {
      const key = { pk: 'test-user-1' };
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };

      // Mock initial cache load to return the test user
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(testUser);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial item should be loaded
      expect(result.current.item).toEqual(testUser);

      // Simulate cache_cleared event
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'cache_cleared',
            timestamp: Date.now(),
            source: 'manual'
          });
        }
      });

      expect(result.current.item).toBe(null);
    });

    it('should ignore events for different keys', async () => {
      const key = { pk: 'test-user-1' };
      const otherKey = { pk: 'test-user-2' };
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };
      const otherUser: TestUser = {
        id: 'test-user-2',
        name: 'Other User',
        email: 'other@example.com',
        status: 'inactive'
      };

      // Mock initial cache load to return the test user
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(testUser);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial item should be loaded
      expect(result.current.item).toEqual(testUser);

      // Simulate event for different key
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_updated',
            key: otherKey,
            item: otherUser,
            timestamp: Date.now(),
            source: 'api'
          });
        }
      });

      // Item should remain unchanged
      expect(result.current.item).toEqual(testUser);
    });

    it('should handle composite keys correctly', async () => {
      const compositeKey: ComKey<'test-user', 'category'> = {
        pk: 'test-user-1',
        sk: 'category-1'
      };
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useCacheItem(mockCache, compositeKey));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate event with matching composite key
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_created',
            key: compositeKey,
            item: testUser,
            timestamp: Date.now(),
            source: 'api'
          });
        }
      });

      expect(result.current.item).toEqual(testUser);
    });
  });

  describe('refetch functionality', () => {
    it('should refetch item successfully', async () => {
      const key = { pk: 'test-user-1' };
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Refetched User',
        email: 'refetched@example.com',
        status: 'active'
      };

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);
      // Mock operations.get to return the test user
      mockCache.operations.get = vi.fn().mockResolvedValue(testUser);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let refetchResult: TestUser | null = null;
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(mockCache.operations.get).toHaveBeenCalledWith(key);
      expect(result.current.item).toEqual(testUser);
      expect(refetchResult).toEqual(testUser);
    });

    it('should handle refetch with loading state', async () => {
      const key = { pk: 'test-user-1' };
      const testUser: TestUser = {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);
      // Mock a delayed response
      mockCache.operations.get = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(testUser), 50))
      );

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start refetch
      act(() => {
        result.current.refetch();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.item).toEqual(testUser);
    });

    it('should handle refetch error gracefully', async () => {
      const key = { pk: 'test-user-1' };
      const error = new Error('Fetch failed');

      // Mock initial cache load to return null
      mockCache.cacheMap.get = vi.fn().mockResolvedValue(null);
      mockCache.operations.get = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useCacheItem(mockCache, key));

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial item will be null from cache.get()
      const initialItem = result.current.item;

      let refetchResult: TestUser | null = null;
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error refetching item:', error);
      expect(result.current.item).toBe(initialItem); // Should remain the same since error occurred
      expect(refetchResult).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return null when refetching with null cache', async () => {
      const { result } = renderHook(() =>
        useCacheItem(null, { pk: 'test-user-1' })
      );

      const refetchResult = await act(async () => {
        return await result.current.refetch();
      });

      expect(refetchResult).toBe(null);
    });

    it('should return null when refetching with null key', async () => {
      const { result } = renderHook(() =>
        useCacheItem(mockCache, null)
      );

      const refetchResult = await act(async () => {
        return await result.current.refetch();
      });

      expect(refetchResult).toBe(null);
    });
  });

  describe('dependency changes', () => {
    it('should update subscription when cache changes', () => {
      const key = { pk: 'test-user-1' };
      const newCache = { ...mockCache } as any;
      newCache.subscribe = vi.fn().mockReturnValue({
        id: 'new-sub',
        unsubscribe: vi.fn(),
        isActive: () => true,
        getOptions: () => ({})
      });

      const { rerender } = renderHook(
        ({ cache }) => useCacheItem(cache, key),
        { initialProps: { cache: mockCache } }
      );

      expect(mockCache.subscribe).toHaveBeenCalledTimes(1);

      // Change cache
      rerender({ cache: newCache });

      expect(newCache.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should update subscription when key changes', () => {
      const key1 = { pk: 'test-user-1' };
      const key2 = { pk: 'test-user-2' };

      const { rerender } = renderHook(
        ({ key }) => useCacheItem(mockCache, key),
        { initialProps: { key: key1 } }
      );

      expect(mockCache.subscribe).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ keys: [key1] })
      );

      // Change key - subscription should not be recreated, only options updated internally
      rerender({ key: key2 });

      // The subscription should only be called once (when cache was first provided)
      expect(mockCache.subscribe).toHaveBeenCalledTimes(1);

      // The subscription options are updated internally without recreating the subscription
      // This is the correct behavior to prevent infinite loops
    });

    it('should reload item from cache when key changes', async () => {
      const key1 = { pk: 'test-user-1' };
      const key2 = { pk: 'test-user-2' };
      const user1: TestUser = {
        id: 'test-user-1',
        name: 'User 1',
        email: 'user1@example.com',
        status: 'active'
      };
      const user2: TestUser = {
        id: 'test-user-2',
        name: 'User 2',
        email: 'user2@example.com',
        status: 'inactive'
      };

      // Mock cache.get to return different values for different keys
      mockCache.cacheMap.get = vi.fn()
        .mockImplementation((key) => {
          if (key.pk === 'test-user-1') {
            return Promise.resolve(user1);
          } else if (key.pk === 'test-user-2') {
            return Promise.resolve(user2);
          }
          return Promise.resolve(null);
        });

      const { result, rerender } = renderHook(
        ({ key }) => useCacheItem(mockCache, key),
        { initialProps: { key: key1 } }
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.item).toEqual(user1);

      // Change key
      rerender({ key: key2 });

      // Wait for the new key to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.item).toEqual(user2);
      expect(mockCache.cacheMap.get).toHaveBeenCalledWith(key1);
      expect(mockCache.cacheMap.get).toHaveBeenCalledWith(key2);
    });
  });

  describe('edge cases', () => {
    it('should handle events when key is null', async () => {
      renderHook(() => useCacheItem(mockCache, null));

      // Simulate event - should not crash
      await act(async () => {
        if (eventListeners.length > 0) {
          eventListeners[0]({
            type: 'item_created',
            key: { pk: 'test-user-1' },
            item: { id: 'test-user-1', name: 'Test User' },
            timestamp: Date.now(),
            source: 'api'
          });
        }
      });

      // Should not crash - the event is ignored when key is null
    });

    it('should handle subscription options being null when key is null', () => {
      renderHook(() => useCacheItem(mockCache, null));

      // useCacheSubscription converts null options to empty object
      expect(mockCache.subscribe).toHaveBeenCalledWith(
        expect.any(Function),
        {}
      );
    });

    it('should handle different key types correctly', () => {
      const priKey: PriKey<'test-user'> = { pk: 'test-user-1' };
      const comKey: ComKey<'test-user', 'category'> = { pk: 'test-user-1', sk: 'category-1' };

      // Test with primary key
      renderHook(() => useCacheItem(mockCache, priKey));
      expect(mockCache.subscribe).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ keys: [priKey] })
      );

      // Test with composite key
      renderHook(() => useCacheItem(mockCache, comKey));
      expect(mockCache.subscribe).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ keys: [comKey] })
      );
    });
  });
});
