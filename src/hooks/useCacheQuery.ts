import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cache, normalizeKeyValue } from '@fjell/cache';
import { ComKey, Item, ItemQuery, LocKeyArray, PriKey } from '@fjell/core';
import { useCacheSubscription } from './useCacheSubscription';

/**
 * React hook for subscribing to cache query results
 *
 * @param cache The cache instance
 * @param query The query to execute
 * @param locations Optional locations to query in
 * @returns The current query results and loading state
 */
export function useCacheQuery<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  cache: Cache<V, S, L1, L2, L3, L4, L5> | null,
  query: ItemQuery = {},
  locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
): {
  items: V[];
  isLoading: boolean;
  refetch: () => Promise<V[]>;
} {
  const [items, setItems] = useState<V[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stable query and locations strings for dependency tracking
  const queryString = useMemo(() => JSON.stringify(query), [query]);
  const locationsString = useMemo(() => JSON.stringify(locations), [locations]);

  // Load initial items from cache
  useEffect(() => {
    if (!cache) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    // Get current items from cache
    const cachedItems = cache.cacheMap.queryIn(query, locations);
    setItems(cachedItems);
    setIsLoading(false);
  }, [cache, queryString, locationsString]);

  // Normalize a key for comparison (same logic as CacheEventEmitter)
  const normalizeKey = useCallback((key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>): string => {
    return JSON.stringify(key, (k, v) => {
      if (typeof v === 'string' || typeof v === 'number') {
        return normalizeKeyValue(v);
      }
      return v;
    });
  }, []);

  // Improved query comparison that handles object ordering
  const queriesMatch = useCallback((q1: ItemQuery, q2: ItemQuery): boolean => {
    // Sort keys to ensure consistent comparison
    const normalize = (obj: any): any => {
      // eslint-disable-next-line no-undefined
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(normalize).sort();

      const sorted: any = {};
      Object.keys(obj).sort().forEach(key => {
        sorted[key] = normalize(obj[key]);
      });
      return sorted;
    };

    return JSON.stringify(normalize(q1)) === JSON.stringify(normalize(q2));
  }, []);

  // Create event listener to update items when they change
  const eventListener = useCallback((event: any) => {
    switch (event.type) {
      case 'items_queried':
        // Check if this event matches our query with improved comparison
        if (queriesMatch(event.query, query) &&
            JSON.stringify(event.locations) === JSON.stringify(locations)) {
          setItems(event.items);
        }
        break;

      case 'item_created':
      case 'item_updated':
      case 'item_retrieved':
      case 'item_set':
        // For individual item changes, we need to re-query to see if the item
        // should be included in our result set
        if (cache) {
          const updatedItems = cache.cacheMap.queryIn(query, locations);
          setItems(updatedItems);
        }
        break;

      case 'item_removed':
        // Remove the item from our current results if it was there
        setItems(prevItems =>
          prevItems.filter(item =>
            normalizeKey(item.key) !== normalizeKey(event.key)
          )
        );
        break;

      case 'cache_cleared':
        setItems([]);
        break;
    }
  }, [cache, queryString, locationsString, normalizeKey, queriesMatch]);

  // Subscription options with debouncing for query updates
  const subscriptionOptions = useMemo(() => ({
    eventTypes: [
      'items_queried',
      'item_created',
      'item_updated',
      'item_removed',
      'item_retrieved',
      'item_set',
      'cache_cleared'
    ] as const,
    debounceMs: 50 // Small debounce to batch rapid updates
  }), []);

  // Subscribe to cache events
  useCacheSubscription(cache, eventListener, subscriptionOptions);

  // Refetch function to manually reload the query
  const refetch = useCallback(async (): Promise<V[]> => {
    if (!cache) {
      return [];
    }

    setIsLoading(true);
    try {
      const [, results] = await cache.operations.all(query, locations);
      setItems(results);
      return results;
    } catch (error) {
      console.error('Error refetching query:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [cache, queryString, locationsString]);

  return {
    items,
    isLoading,
    refetch
  };
}
