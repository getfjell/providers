
import { Item, ItemQuery } from "@fjell/core";
import React, { useCallback, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";

import LibLogger from '../logger';
import { useCacheQuery } from '../hooks/useCacheQuery';
import * as PItemAdapter from "./PItemAdapter";
import * as PItems from "./PItems";
import { PItemsProvider } from "./PItemsProvider";

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
  }: {
    name: string;
    adapter: PItemAdapter.Context<V, S>;
    children: React.ReactNode;
    context: PItems.Context<V, S>;
    contextName: string;
    query?: ItemQuery;
    renderEach?: (item: V) => React.ReactNode;
  }
) => {

  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = usePItemAdapter<V, S>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    cache,
    all: allItems,
    one: oneItem,
  } = useMemo(() => adapterContext, [adapterContext]);

  // Use the cache-aware query hook for automatic invalidation
  const { items, isLoading } = useCacheQuery(
    cache,
    query,
    [], // Primary items don't have location context
    allItems // Pass the adapter's all method for proper error handling and logging
  );

  const all = useCallback(async () => {
    try {
      logger.trace('all', { query });
      const items = await allItems(query, []) as V[] | null;
      logger.debug('Items Returned for All', { items });
      return items;
    } catch (error) {
      logger.error('Error in all:', error);
      throw error;
    }
  }, [allItems, query]);

  const one = useCallback(async () => {
    try {
      logger.trace('one', { query });
      const item = await oneItem(query) as V | null;
      return item;
    } catch (error) {
      logger.error('Error in one:', error);
      throw error;
    }
  }, [oneItem, query]);

  return PItemsProvider<V, S>({
    name,
    adapter,
    children,
    context,
    contextName,
    renderEach,
    items,
    isLoadingParam: isLoading,
    overrides: {
      all,
      one,
    },
  });
}
