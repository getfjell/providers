
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
    console.log('=== PItemsFind.executeFinder CALLED ===');
    console.log('Finder:', finder);
    console.log('Finder Params:', finderParams);
    console.log('Adapter Context:', !!adapterContext);
    console.log('Adapter Context.find:', !!adapterContext?.find);

    if (finder && finderParams && adapterContext) {
      try {
        if (adapterContext.find) {
          console.log('=== CALLING adapterContext.find ===');
          const result = await adapterContext.find(finder, finderParams);
          console.log('=== adapterContext.find SUCCESS ===');
          console.log('Result items count:', result?.items?.length);
          setItems(result.items as V[] | null);
          setIsLoading(false);
        } else {
          console.error('=== ERROR: adapterContext.find is not available ===');
          setItems(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('=== Find operation failed ===');
        console.error('Error:', error);
        console.error('Error message:', (error as any)?.message);
        console.error('Error stack:', (error as any)?.stack);
        setItems(null);
        setIsLoading(false);
      }
    } else {
      console.log('=== SKIPPING: Missing finder, finderParams, or adapterContext ===');
      console.log('Finder:', finder);
      console.log('Finder Params:', finderParams);
      console.log('Adapter Context:', !!adapterContext);
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
