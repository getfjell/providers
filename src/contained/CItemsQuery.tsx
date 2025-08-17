
import { abbrevLKA, abbrevQuery, Item, ItemQuery } from "@fjell/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCItemAdapter } from "./CItemAdapter";

import LibLogger from "../logger";
import { createStableHash } from '../utils';
import * as AItem from "../AItem";
import * as CItemAdapter from "./CItemAdapter";
import * as CItems from "./CItems";
import { CItemsProvider } from "./CItemsProvider";

const logger = LibLogger.get('CItemsQuery');

export const CItemsQuery = <
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
      query = {},
      renderEach,
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
  }
  ) => {

  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    all: allItems,
    one: oneItem,
    cache,
  } = useMemo(() => adapterContext, [adapterContext]);

  const parentContext = AItem.useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    locations: parentLocations,
  } = useMemo(() => parentContext, [parentContext]);

  const queryString = useMemo(() => createStableHash(query), [query]);
  const [items, setItems] = useState<V[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load items when query changes or when cache events occur
  useEffect(() => {
    (async () => {
      console.log(`[ORDERDATES] ${name}: Initial data loading effect triggered`, {
        hasParentLocations: !!parentLocations,
        parentLocationsCount: parentLocations?.length || 0,
        queryString,
        query: JSON.stringify(query)
      });

      if (!parentLocations) {
        console.log(`[ORDERDATES] ${name}: No parent locations, setting empty items`);
        setItems([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[ORDERDATES] ${name}: Starting initial data load`);
        logger.trace('useEffect[queryString] %s', createStableHash(query));
        setIsLoading(true);
        console.log(`[ORDERDATES] ${name}: About to call allItems for initial load`, {
          query: JSON.stringify(query),
          parentLocations: parentLocations?.map(l => `${l.kt}:${l.lk}`),
          allItemsType: allItems?.constructor?.name,
          hasAllItems: !!allItems
        });
        const results = await allItems(query, parentLocations);
        console.log(`[ORDERDATES] ${name}: Initial data load completed`, {
          itemsCount: results?.length || 0,
          items: results?.map((item: any) => ({
            id: item.id,
            targetDate: item.targetDate,
            phaseCode: item.phase?.code
          })) || []
        });
        setItems(results as V[] || []);
        setIsLoading(false);
      } catch (error) {
        console.error(`[ORDERDATES] ${name}: Error loading items:`, error);
        logger.error(`${name}: Error loading items:`, error);
        setItems([]);
        setIsLoading(false);
      }
    })();
  }, [queryString, allItems, parentLocations, name]);

  // Store cache reference to detect changes
  const cacheRef = React.useRef(cache);
  const parentLocationsRef = React.useRef(parentLocations);
  const allItemsRef = React.useRef(allItems);

  // Listen for cache invalidation events to refetch data
  useEffect(() => {
    console.log(`[ORDERDATES] ${name}: Cache event subscription useEffect triggered`, {
      hasCache: !!cache,
      hasParentLocations: !!parentLocations,
      parentLocationsLength: parentLocations?.length,
      queryString: JSON.stringify(query),
      allItemsRef: !!allItems,
      nameRef: name,
      cacheChanged: cacheRef.current !== cache,
      parentLocationsChanged: parentLocationsRef.current !== parentLocations,
      allItemsChanged: allItemsRef.current !== allItems
    });

    // Update refs
    cacheRef.current = cache;
    parentLocationsRef.current = parentLocations;
    allItemsRef.current = allItems;

    if (!cache || !parentLocations) {
      console.log(`[ORDERDATES] ${name}: Cache event subscription skipped - cache:`, !!cache, 'parentLocations:', !!parentLocations);
      return;
    }

    console.log(`[ORDERDATES] ${name}: Setting up cache event subscription`, {
      cacheType: cache.constructor.name,
      parentLocations: parentLocations.length,
      query: JSON.stringify(query)
    });

    const handleCacheInvalidation = async () => {
      try {
        console.log(`[ORDERDATES] ${name}: Cache invalidation event received, refetching items`, {
          currentItemsCount: items.length,
          query: JSON.stringify(query),
          parentLocations: parentLocations.length
        });
        logger.trace('Cache invalidation event received, refetching items');
        setIsLoading(true);
        console.log(`[ORDERDATES] ${name}: About to call allItems for refetch`, {
          query: JSON.stringify(query),
          parentLocations: parentLocations?.map(l => `${l.kt}:${l.lk}`),
          allItemsType: allItems?.constructor?.name,
          hasAllItems: !!allItems
        });
        const results = await allItems(query, parentLocations);
        console.log(`[ORDERDATES] ${name}: Cache invalidation refetch completed`, {
          newItemsCount: results?.length || 0,
          previousItemsCount: items.length,
          hasChanged: (results?.length || 0) !== items.length,
          resultsData: results?.map((item: any) => ({
            id: item.id,
            targetDate: item.targetDate,
            phaseCode: item.phase?.code,
            key: item.key
          })) || []
        });
        setItems(results as V[] || []);
        setIsLoading(false);
      } catch (error) {
        console.error(`[ORDERDATES] ${name}: Error refetching items after cache invalidation:`, error);
        logger.error(`${name}: Error refetching items after cache invalidation:`, error);
        // Keep existing items on error
        setIsLoading(false);
      }
    };

    // Subscribe to cache events
    console.log(`[ORDERDATES] ${name}: Subscribing to cache events with eventTypes: ['query_invalidated']`);
    const subscription = cache.subscribe(handleCacheInvalidation, {
      eventTypes: ['query_invalidated'],
      debounceMs: 0  // No debounce - execute immediately
    });

    console.log(`[ORDERDATES] ${name}: Cache subscription created:`, !!subscription);

    return () => {
      console.log(`[ORDERDATES] ${name}: Unsubscribing from cache events`);
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [cache, allItems, query, parentLocations, name]);

  const all = useCallback(async () => {
    if (parentLocations) {
      logger.debug(`${name}: all`, { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
      try {
        const result = await allItems(query, parentLocations) as V[] | null;
        return result;
      } catch (error) {
        logger.error(`${name}: Error getting all items`, error);
        throw error;
      }
    } else {
      logger.default(`${name}: No parent locations present to query for all containeditems`,
        { query: abbrevQuery(query) });
      throw new Error(`No parent locations present to query for all containeditems in ${name}`);
    }
  }, [allItems, parentLocations, query, name]);

  const one = useCallback(async () => {
    if (parentLocations) {
      logger.trace('one', { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
      try {
        const result = await oneItem(query, parentLocations) as V | null;
        return result;
      } catch (error) {
        logger.error(`${name}: Error getting one item`, error);
        throw error;
      }
    } else {
      logger.default(`${name}: No parent locations present to query for one containeditem`,
        { query: abbrevQuery(query) });
      throw new Error(`No parent locations present to query for one containeditem in ${name}`);
    }
  }, [oneItem, parentLocations, query, name]);

  return CItemsProvider<V, S, L1, L2, L3, L4, L5>({
    name,
    adapter,
    children,
    context,
    contextName,
    renderEach,
    items: items || null,
    isLoadingParam: isLoading,
    parent,
    parentContextName,
    overrides: {
      all: all,
      one: one,
    },
  });
}
