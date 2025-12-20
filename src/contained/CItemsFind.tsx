import { Item, ItemQuery } from "@fjell/types";
import React, { useCallback, useEffect, useMemo } from "react";
import * as AItem from "../AItem";
import { useCItemAdapter } from "./CItemAdapter";
import { createStableHash } from '../utils';

import * as CItemAdapter from "./CItemAdapter";
import * as CItems from "./CItems";
import { CItemsProvider } from "./CItemsProvider";

export const CItemsFind = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    {
      name,
      adapter,
      children = (<></>),
      context,
      contextName,
      parent,
      parentContextName,
      renderEach,
      finder,
      finderParams = {},
    }: {
    name: string;
    adapter: CItemAdapter.Context<V, S, L1, L2, L3, L4, L5>;
    children?: React.ReactNode;
    context: CItems.Context<V, S, L1, L2, L3, L4, L5>;
    contextName: string;
    query?: ItemQuery;
    parent: AItem.Context<Item<L1, L2, L3, L4, L5, never>, L1, L2, L3, L4, L5>;
    parentContextName: string;
    renderEach?: (item: V) => React.ReactNode;
    finder: string,
    finderParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  }
  ) => {

  const [items, setItems] = React.useState<V[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, contextName);

  const parentContext = AItem.useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    locations: parentLocations,
  } = useMemo(() => parentContext, [parentContext]);

  const finderParamsString = useMemo(() => createStableHash(finderParams), [finderParams]);

  // Function to execute the finder
  const executeFinder = useCallback(async () => {
    if (finder && finderParams && parentLocations && adapterContext) {
      try {
        const result = await adapterContext.find(finder, finderParams, parentLocations);
        // Handle FindOperationResult
        if (result && result.items) {
          setItems(result.items as V[] | null);
        } else {
          setItems(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Find operation failed:', error);
        setItems(null);
        setIsLoading(false);
      }
    }
  }, [finder, finderParams, parentLocations, adapterContext]);

  // Initial execution and refetch when dependencies change
  useEffect(() => {
    executeFinder();
  }, [finder, finderParamsString, parentLocations, adapterContext]);

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

  return CItemsProvider<V, S, L1, L2, L3, L4, L5>({
    name,
    adapter,
    children,
    context,
    contextName,
    renderEach,
    items,
    isLoadingParam: isLoading,
    parent,
    parentContextName,
  });
}
