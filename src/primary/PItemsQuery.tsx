
import { AllOptions, Item, ItemQuery, PaginationMetadata } from "@fjell/types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePItemAdapter } from "./PItemAdapter";

import LibLogger from '../logger';
import * as PItemAdapter from "./PItemAdapter";
import * as PItems from "./PItems";
import { PItemsProvider } from "./PItemsProvider";
import { createStableHash } from '../utils';

const logger = LibLogger.get('PItemsQuery');

export const PItemsQuery = <V extends Item<S>, S extends string>(
  {
    name,
    adapter,
    children,
    context,
    contextName,
    query = {},
    renderEach,
    allOptions,
  }: {
    name: string;
    adapter: PItemAdapter.Context<V, S>;
    children: React.ReactNode;
    context: PItems.Context<V, S>;
    contextName: string;
    query?: ItemQuery;
    renderEach?: (item: V) => React.ReactNode;
    allOptions?: AllOptions;
  }
) => {

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = usePItemAdapter<V, S>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    all: allItems,
    one: oneItem,
    cache,
  } = useMemo(() => adapterContext, [adapterContext]);

  const queryString = useMemo(() => createStableHash(query), [query]);
  const allOptionsString = useMemo(() => createStableHash(allOptions), [allOptions]);
  const [items, setItems] = useState<V[]>([]);
  const [metadata, setMetadata] = useState<PaginationMetadata | undefined>(void 0);

  // Load items when query changes
  useEffect(() => {
    (async () => {
      try {
        logger.trace('useEffect[queryString] %s', createStableHash(query));
        setIsLoading(true);
        const result = await allItems(query, [], allOptions);
        setItems(result?.items || []);
        setMetadata(result?.metadata);
        setIsLoading(false);
      } catch (error) {
        logger.error(`${name}: Error loading items:`, error);
        setItems([]);
        setMetadata(void 0);
        setIsLoading(false);
        // Don't throw here as this would be lost in the async context
        // Let the all/one override functions handle error throwing
      }
    })();
  }, [queryString, allOptionsString, allItems, name]);

  // Store cache reference to detect changes
  const cacheRef = React.useRef(cache);
  const allItemsRef = React.useRef(allItems);
  const queryRef = React.useRef(query);
  const allOptionsRef = React.useRef(allOptions);

  // Listen for cache invalidation events to refetch data
  useEffect(() => {
    // Update refs
    cacheRef.current = cache;
    allItemsRef.current = allItems;
    queryRef.current = query;
    allOptionsRef.current = allOptions;

    if (!cache) {
      return;
    }

    const handleCacheInvalidation = async () => {
      try {
        logger.trace('Cache invalidation event received, refetching items');
        setIsLoading(true);
        const currentQuery = queryRef.current;
        const currentAllOptions = allOptionsRef.current;
        const currentAllItems = allItemsRef.current;
        const result = await currentAllItems(currentQuery, [], currentAllOptions);
        setItems(result?.items || []);
        setMetadata(result?.metadata);
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
  }, [cache, allItems, query, allOptions, name]);

  const all = useCallback(async () => {
    try {
      logger.trace('all', { query });
      setIsLoading(true);
      const result = await allItems(query, [], allOptions);
      const items = result?.items || null;
      setMetadata(result?.metadata);
      setIsLoading(false);
      logger.debug('Items Returned for All', { items });
      return items;
    } catch (error) {
      logger.error('Error in all:', error);
      setIsLoading(false);
      throw error;
    }
  }, [allItems, query, allOptions]);

  const one = useCallback(async () => {
    try {
      logger.trace('one', { query });
      setIsLoading(true);
      const item = await oneItem(query) as V | null;
      setIsLoading(false);
      return item;
    } catch (error) {
      logger.error('Error in one:', error);
      setIsLoading(false);
      throw error;
    }
  }, [oneItem]);

  return PItemsProvider<V, S>({
    name,
    adapter,
    children,
    context,
    contextName,
    renderEach,
    items,
    isLoadingParam: isLoading,
    metadata,
    overrides: {
      all,
      one,
    },
  });
}
