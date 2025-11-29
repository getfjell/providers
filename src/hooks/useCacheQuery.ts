import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cache, CacheEventType, normalizeKeyValue } from '@fjell/cache';
import { AllOperationResult, ComKey, Item, ItemQuery, LocKeyArray, PriKey } from '@fjell/core';
import { useCacheSubscription } from './useCacheSubscription';
import { createStableHash, deepEqual } from '../utils';
import LibLogger from '../logger';

const logger = LibLogger.get('useCacheQuery');

/**
 * React hook for subscribing to cache query results
 *
 * @param cache The cache instance
 * @param query The query to execute
 * @param locations Optional locations to query in
 * @param allMethod Optional adapter all method to use instead of cache.operations.all
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
  locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = [],
  allMethod?: (query?: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5> | []) => Promise<AllOperationResult<V> | V[] | null> | null
): {
  items: V[];
  isLoading: boolean;
  refetch: () => Promise<V[]>;
} {
  const [items, setItems] = useState<V[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stable query and locations strings for dependency tracking
  const queryString = useMemo(() => createStableHash(query), [query]);
  const locationsString = useMemo(() => createStableHash(locations), [locations]);

  // Load initial items from cache
  useEffect(() => {
    if (!cache && !allMethod) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const loadItems = async () => {
      logger.debug('QUERY_CACHE: useCacheQuery.loadItems() called', {
        query: JSON.stringify(query),
        locations: JSON.stringify(locations),
        hasAllMethod: !!allMethod,
        hasCache: !!cache
      });
      try {
        let cachedItems: V[] | null = null;
        if (allMethod) {
          // Use the adapter method if provided (includes error handling, logging, etc.)
          logger.debug('QUERY_CACHE: Using allMethod adapter', { query: JSON.stringify(query), locations: JSON.stringify(locations) });
          const result = await allMethod(query, locations);
          // Handle AllOperationResult or array
          if (result && typeof result === 'object' && 'items' in result) {
            cachedItems = (result as AllOperationResult<V>).items;
          } else if (Array.isArray(result)) {
            cachedItems = result;
          }
        } else if (cache) {
          // Fallback to direct cache access
          logger.debug('QUERY_CACHE: Using cache.operations.all()', { query: JSON.stringify(query), locations: JSON.stringify(locations) });
          const result = await cache.operations.all(query, locations);
          cachedItems = result.items;
        } else {
          logger.debug('QUERY_CACHE: No cache or allMethod available', {});
          cachedItems = null;
        }
        logger.debug('QUERY_CACHE: loadItems completed', {
          itemCount: cachedItems?.length || 0,
          query: JSON.stringify(query),
          locations: JSON.stringify(locations)
        });
        setItems(cachedItems || []);
        setIsLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('QUERY_CACHE: Error querying items from cache', {
          error: errorMessage,
          query: JSON.stringify(query),
          locations: JSON.stringify(locations)
        });
        console.error('Error querying items from cache:', error);
        setItems([]);
        setIsLoading(false);
      }
    };

    loadItems();
  }, [cache, queryString, locationsString, allMethod]); // Only use stable strings and allMethod

  // Normalize a key for comparison (same logic as CacheEventEmitter)
  const normalizeKey = useCallback((key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>): string => {
    // Normalize then create stable string
    const normalized = ((): any => {
      const replacer = (value: any): any => {
        if (typeof value === 'string' || typeof value === 'number') {
          return normalizeKeyValue(value);
        }
        if (Array.isArray(value)) return value.map(replacer);
        if (value && typeof value === 'object') {
          const out: any = {};
          for (const k of Object.keys(value)) out[k] = replacer((value as any)[k]);
          return out;
        }
        return value;
      };
      return replacer(key);
    })();
    return createStableHash(normalized);
  }, []);

  // Improved query comparison that handles object ordering
  const queriesMatch = useCallback((q1: ItemQuery, q2: ItemQuery): boolean => {
    return deepEqual(q1, q2);
  }, []);

  // Create event listener to update items when they change
  const eventListener = useCallback((event: any) => {
    switch (event.type) {
      case 'items_queried':
        // Check if this event matches our query with improved comparison
        if (queriesMatch(event.query, query) &&
            createStableHash(event.locations) === locationsString) {
          setItems(event.items);
        }
        break;

      case 'item_created':
      case 'item_updated':
      case 'item_retrieved':
      case 'item_set':
        // TODO: Re-enable automatic re-querying after fixing infinite loop issues
        // For now, we rely on explicit cache invalidation to avoid infinite loops
        // This means query results may become stale until manually refreshed
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

      case 'query_invalidated':
        // When queries are invalidated, we need to refetch
        logger.debug('QUERY_CACHE: Query invalidated event received, refetching', {
          query: JSON.stringify(query),
          locations: JSON.stringify(locations)
        });
        // Use the allMethod if provided, otherwise use cache.operations.all
        if (allMethod || cache) {
          const loadItems = async () => {
            try {
              let results: V[] | null = null;
              if (allMethod) {
                logger.debug('QUERY_CACHE: Refetching using allMethod after invalidation', { query: JSON.stringify(query), locations: JSON.stringify(locations) });
                const result = await allMethod(query, locations);
                // Handle AllOperationResult or array
                if (result && typeof result === 'object' && 'items' in result) {
                  results = (result as AllOperationResult<V>).items;
                } else if (Array.isArray(result)) {
                  results = result;
                }
              } else if (cache) {
                logger.debug('QUERY_CACHE: Refetching using cache.operations.all() after invalidation', { query: JSON.stringify(query), locations: JSON.stringify(locations) });
                const result = await cache.operations.all(query, locations);
                results = result.items;
              } else {
                results = null;
              }
              logger.debug('QUERY_CACHE: Refetch completed after invalidation', {
                itemCount: results?.length || 0,
                query: JSON.stringify(query),
                locations: JSON.stringify(locations)
              });
              setItems(results || []);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              logger.error('QUERY_CACHE: Error refetching after query invalidation', {
                error: errorMessage,
                query: JSON.stringify(query),
                locations: JSON.stringify(locations)
              });
              console.error('Error refetching after query invalidation:', error);
              setItems([]);
            }
          };
          loadItems();
        }
        break;
    }
  }, [queryString, locationsString, normalizeKey, queriesMatch, allMethod, cache]); // Use stable strings

  // Subscription options with debouncing for query updates
  const subscriptionOptions = useMemo(() => ({
    eventTypes: [
      'items_queried',
      'item_created',
      'item_updated',
      'item_removed',
      'item_retrieved',
      'item_set',
      'cache_cleared',
      'query_invalidated'
    ] as CacheEventType[],
    debounceMs: 0 // No debounce - execute immediately to avoid race conditions
  }), []);

  // Subscribe to cache events
  useCacheSubscription(cache, eventListener, subscriptionOptions);

  // Refetch function to manually reload the query
  const refetch = useCallback(async (): Promise<V[]> => {
    logger.debug('QUERY_CACHE: useCacheQuery.refetch() called', {
      query: JSON.stringify(query),
      locations: JSON.stringify(locations),
      hasAllMethod: !!allMethod,
      hasCache: !!cache
    });
    
    if (!cache && !allMethod) {
      logger.debug('QUERY_CACHE: No cache or allMethod available for refetch', {});
      return [];
    }

    setIsLoading(true);
    try {
      let results: V[] | null = null;
      if (allMethod) {
        logger.debug('QUERY_CACHE: Refetching using allMethod', { query: JSON.stringify(query), locations: JSON.stringify(locations) });
        const result = await allMethod(query, locations);
        // Handle AllOperationResult or array
        if (result && typeof result === 'object' && 'items' in result) {
          results = (result as AllOperationResult<V>).items;
        } else if (Array.isArray(result)) {
          results = result;
        }
      } else if (cache) {
        logger.debug('QUERY_CACHE: Refetching using cache.operations.all()', { query: JSON.stringify(query), locations: JSON.stringify(locations) });
        const result = await cache.operations.all(query, locations);
        results = result.items;
      } else {
        results = null;
      }
      logger.debug('QUERY_CACHE: Refetch completed', {
        itemCount: results?.length || 0,
        query: JSON.stringify(query),
        locations: JSON.stringify(locations)
      });
      setItems(results || []);
      return results || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('QUERY_CACHE: Error refetching query', {
        error: errorMessage,
        query: JSON.stringify(query),
        locations: JSON.stringify(locations)
      });
      console.error('Error refetching query:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [cache, allMethod, queryString, locationsString]); // Use stable strings

  return {
    items,
    isLoading,
    refetch
  };
}
