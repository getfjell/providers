
import { AllOptions, Item, ItemQuery, PaginationMetadata } from "@fjell/types";
import { abbrevLKA, abbrevQuery } from "@fjell/core";
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
      allOptions,
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
    allOptions?: AllOptions;
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
  const allOptionsString = useMemo(() => createStableHash(allOptions), [allOptions]);
  const [items, setItems] = useState<V[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metadata, setMetadata] = useState<PaginationMetadata | undefined>(void 0);

  // Load items when query changes or when cache events occur
  useEffect(() => {
    (async () => {
      if (!parentLocations) {
        setItems([]);
        setMetadata(void 0);
        setIsLoading(false);
        return;
      }

      try {
        logger.trace('useEffect[queryString] %s', createStableHash(query));
        setIsLoading(true);
        const result = await allItems(query, parentLocations, allOptions);
        setItems(result?.items || []);
        setMetadata(result?.metadata);
        setIsLoading(false);
      } catch (error) {
        logger.error(`${name}: Error loading items:`, error);
        setItems([]);
        setMetadata(void 0);
        setIsLoading(false);
      }
    })();
  }, [queryString, allOptionsString, allItems, parentLocations, name]);

  // Store cache reference to detect changes
  const cacheRef = React.useRef(cache);
  const parentLocationsRef = React.useRef(parentLocations);
  const allItemsRef = React.useRef(allItems);
  const queryRef = React.useRef(query);  // CRITICAL FIX: Track current query
  const allOptionsRef = React.useRef(allOptions);

  // Listen for cache invalidation events to refetch data
  useEffect(() => {
    // Update refs
    cacheRef.current = cache;
    parentLocationsRef.current = parentLocations;
    allItemsRef.current = allItems;
    queryRef.current = query;  // CRITICAL FIX: Update query ref
    allOptionsRef.current = allOptions;

    if (!cache || !parentLocations) {
      return;
    }

    const handleCacheInvalidation = async () => {
      try {
        logger.trace('Cache invalidation event received, refetching items');
        setIsLoading(true);

        // CRITICAL FIX: Use current query from ref, not stale closure query
        const currentQuery = queryRef.current;
        const currentParentLocations = parentLocationsRef.current;
        const currentAllItems = allItemsRef.current;
        const currentAllOptions = allOptionsRef.current;

        if (currentParentLocations && currentAllItems) {
          const result = await currentAllItems(currentQuery, currentParentLocations, currentAllOptions);
          setItems(result?.items || []);
          setMetadata(result?.metadata);
        } else {
          logger.error(`${name}: Missing current refs during cache invalidation`);
          setItems([]);
          setMetadata(void 0);
        }
        setIsLoading(false);
      } catch (error) {
        logger.error(`${name}: Error refetching items after cache invalidation:`, error);
        // Keep existing items on error
        setIsLoading(false);
      }
    };

    // Subscribe to cache events
    const subscription = cache.subscribe(handleCacheInvalidation, {
      eventTypes: ['query_invalidated'],
      debounceMs: 0  // No debounce - execute immediately
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [cache, allItems, query, allOptions, parentLocations, name]);

  const all = useCallback(async () => {
    if (parentLocations) {
      logger.debug(`${name}: all`, { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
      try {
        const result = await allItems(query, parentLocations, allOptions);
        setMetadata(result?.metadata);
        return result?.items || null;
      } catch (error) {
        logger.error(`${name}: Error getting all items`, error);
        throw error;
      }
    } else {
      logger.default(`${name}: No parent locations present to query for all containeditems`,
        { query: abbrevQuery(query) });
      throw new Error(`No parent locations present to query for all containeditems in ${name}`);
    }
  }, [allItems, parentLocations, query, allOptions, name]);

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
    metadata,
    parent,
    parentContextName,
    overrides: {
      all: all,
      one: one,
    },
  });
}
