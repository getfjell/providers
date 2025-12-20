import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cache, CacheEventType, normalizeKeyValue } from '@fjell/cache';
import { ComKey, Item, PriKey } from '@fjell/types';
import { useCacheSubscription } from './useCacheSubscription';
import { createStableHash } from '../utils';

/**
 * React hook for subscribing to a specific cache item
 *
 * @param cache The cache instance
 * @param key The key of the item to track
 * @returns The current item value and loading state
 */
export function useCacheItem<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  cache: Cache<V, S, L1, L2, L3, L4, L5> | null,
  key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S> | null
): {
  item: V | null;
  isLoading: boolean;
  refetch: () => Promise<V | null>;
} {
  const [item, setItem] = useState<V | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Track the current request to prevent stale updates
  const requestIdRef = useRef<number>(0);
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // Create stable key string for dependency tracking
  const keyString = useMemo(() => key ? createStableHash(key) : null, [key]);

  // Normalize a key for comparison (same logic as CacheEventEmitter)
  const normalizeKey = useCallback((key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>): string => {
    // Normalize string/number values in the key (same logic as CacheEventEmitter) first,
    // then produce a stable, circular-safe string using createStableHash
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

  // Create event listener to update item when it changes
  const eventListener = useCallback((event: any) => {
    if (!key || !isMountedRef.current) return;

    const currentKeyString = normalizeKey(key);

    switch (event.type) {
      case 'item_created':
      case 'item_updated':
      case 'item_retrieved':
      case 'item_set':
        if (normalizeKey(event.key) === currentKeyString) {
          setItem(event.item);
        }
        break;

      case 'item_removed':
        if (normalizeKey(event.key) === currentKeyString) {
          setItem(null);
        }
        break;

      case 'cache_cleared':
        setItem(null);
        break;
    }
  }, [key, normalizeKey]);

  // Subscription options to filter events for this specific key
  const subscriptionOptions = useMemo(() => {
    // eslint-disable-next-line no-undefined
    if (!key) return undefined;

    return {
      keys: [key],
      eventTypes: ['item_created', 'item_updated', 'item_removed', 'item_retrieved', 'item_set', 'cache_cleared'] as CacheEventType[]
    };
  }, [key]);

  // Subscribe to cache events
  useCacheSubscription(cache, eventListener, subscriptionOptions);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load initial item from cache - this effect should run whenever cache or key changes
  useEffect(() => {
    if (!cache || !key) {
      setItem(null);
      setIsLoading(false);
      return;
    }

    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;

    // Reset loading state when key changes
    setIsLoading(true);

    // Get current item from cache
    const loadInitialItem = async () => {
      try {
        const cachedItem = await cache.cacheMap.get(key);
        
        // Only update state if this is still the current request and component is mounted
        if (currentRequestId === requestIdRef.current && isMountedRef.current) {
          setItem(cachedItem);
        }
      } catch (error) {
        console.error('Error loading initial item:', error);
        if (currentRequestId === requestIdRef.current && isMountedRef.current) {
          setItem(null);
        }
      } finally {
        if (currentRequestId === requestIdRef.current && isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitialItem();
    
    // Cleanup: mark this request as stale if key changes
    return () => {
      // Request ID is already incremented in the next effect run
    };
  }, [cache, keyString]); // Use stable keyString instead of key object

  // Refetch function to manually reload the item
  const refetch = useCallback(async (): Promise<V | null> => {
    if (!cache || !key) {
      return null;
    }

    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;

    setIsLoading(true);
    try {
      const result = await cache.operations.get(key);
      
      // Only update state if this is still the current request and component is mounted
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setItem(result);
      }
      return result;
    } catch (error) {
      console.error('Error refetching item:', error);
      return null;
    } finally {
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [cache, keyString]); // Use stable keyString

  return {
    item,
    isLoading,
    refetch
  };
}
