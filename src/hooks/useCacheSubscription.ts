import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Cache } from '@fjell/cache';
import { Item } from '@fjell/types';
import { CacheEventListener, CacheSubscription, CacheSubscriptionOptions } from '@fjell/cache';
import { createStableHash } from '../utils';

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

  // Keep refs current without forcing resubscribe on identity-only changes
  listenerRef.current = listener;
  optionsRef.current = options;

  // Stable wrapper that calls the current listener
  const stableListener = useCallback((event: any) => {
    listenerRef.current(event);
  }, []);

  // Content-stable key so we resubscribe when filters change, not on object identity
  const optionsKey = useMemo(
    () => (options == null ? 'null' : createStableHash(options)),
    [options]
  );

  useEffect(() => {
    if (!cache) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      return;
    }

    const currentOptions = optionsRef.current;
    const subscriptionOptions = currentOptions ? {
      ...currentOptions,
      // eslint-disable-next-line no-undefined
      eventTypes: currentOptions.eventTypes ? [...currentOptions.eventTypes] : undefined
    } : {};

    subscriptionRef.current = cache.subscribe(stableListener, subscriptionOptions);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [cache, stableListener, optionsKey]);

  return subscriptionRef.current;
}
