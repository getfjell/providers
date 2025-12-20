import { useCallback, useEffect, useRef } from 'react';
import { Cache } from '@fjell/cache';
import { Item } from '@fjell/types';
import { CacheEventListener, CacheSubscription, CacheSubscriptionOptions } from '@fjell/cache';

/**
 * React hook for subscribing to cache events
 *
 * @param cache The cache instance to subscribe to
 * @param listener The event listener function
 * @param options Optional subscription options for filtering events
 * @returns The active subscription (for manual management if needed)
 */
export function useCacheSubscription<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  cache: Cache<V, S, L1, L2, L3, L4, L5> | null,
  listener: CacheEventListener<V, S, L1, L2, L3, L4, L5>,
  options?: CacheSubscriptionOptions<S, L1, L2, L3, L4, L5>
): CacheSubscription | null {
  const subscriptionRef = useRef<CacheSubscription | null>(null);
  const listenerRef = useRef<CacheEventListener<V, S, L1, L2, L3, L4, L5>>(listener);
  const optionsRef = useRef(options);

  // Update refs when props change but don't recreate subscription
  listenerRef.current = listener;
  optionsRef.current = options;

  // Stable wrapper that calls the current listener
  const stableListener = useCallback((event: any) => {
    listenerRef.current(event);
  }, []);

  useEffect(() => {
    if (!cache) {
      // Clear any existing subscription if cache becomes null
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      return;
    }

    // Subscribe to cache events with stable options
    const subscriptionOptions = optionsRef.current ? {
      ...optionsRef.current,
      // eslint-disable-next-line no-undefined
      eventTypes: optionsRef.current.eventTypes ? [...optionsRef.current.eventTypes] : undefined
    } : {};

    subscriptionRef.current = cache.subscribe(stableListener, subscriptionOptions);

    // Cleanup subscription on unmount or cache change
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [cache, stableListener]); // Only recreate when cache changes, not when options change

  return subscriptionRef.current;
}
