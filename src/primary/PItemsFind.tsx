
import { Item } from "@fjell/core";
import React, { useCallback, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import { createStableHash } from '../utils';
import * as PItemAdapter from "./PItemAdapter";
import * as PItems from "./PItems";
import { PItemsProvider } from "./PItemsProvider";

export const PItemsFind = <V extends Item<S>, S extends string>(
  {
    name,
    adapter,
    children,
    context,
    contextName,
    finder,
    finderParams = {},
    renderEach,
  }: {
    name: string;
    adapter: PItemAdapter.Context<V, S>;
    children: React.ReactNode;
    context: PItems.Context<V, S>;
    contextName: string;
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    renderEach?: (item: V) => React.ReactNode;
  }
) => {

  const [items, setItems] = React.useState<V[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = usePItemAdapter<V, S>(adapter, contextName);

  const finderParamsString = useMemo(() => createStableHash(finderParams), [finderParams]);

  // Function to execute the finder
  const executeFinder = useCallback(async () => {
    if (finder && finderParams && adapterContext) {
      try {
        if (adapterContext.find) {
          const result = await adapterContext.find(finder, finderParams);
          setItems(result as V[] | null);
          setIsLoading(false);
        } else {
          setItems(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Find operation failed:', error);
        setItems(null);
        setIsLoading(false);
      }
    }
  }, [finder, finderParams, adapterContext]);

  // Initial execution and refetch when dependencies change
  useEffect(() => {
    executeFinder();
  }, [finder, finderParamsString, adapterContext]);

  // Subscribe to cache events to react to cache invalidations
  useEffect(() => {
    if (!adapterContext?.cache) {
      return;
    }

    const handleCacheInvalidation = async () => {
      // Refetch data when cache is invalidated
      await executeFinder();
    };

    // Subscribe to cache events that should trigger a refetch
    const subscription = adapterContext.cache.subscribe(handleCacheInvalidation, {
      eventTypes: [
        'query_invalidated',  // When query results are invalidated
        'item_created',       // When new items are created
        'item_updated',       // When existing items are updated
        'item_removed',       // When items are removed
        'cache_cleared'       // When entire cache is cleared
      ],
      debounceMs: 50  // Small debounce to batch rapid updates
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [adapterContext?.cache, executeFinder]);

  return PItemsProvider<V, S>({
    name,
    adapter,
    children,
    context,
    contextName,
    renderEach,
    items: items || [],
    isLoadingParam: isLoading,
  });
}
