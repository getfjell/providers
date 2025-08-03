
import { Item, ItemQuery } from "@fjell/core";
import React, { useCallback, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";

import LibLogger from '../logger';
import { PItemsProvider } from "./PItemsProvider";
import * as PItemAdapter from "./PItemAdapter";
import * as PItems from "./PItems";

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

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = usePItemAdapter<V, S>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    cacheMap,
    all: allItems,
    one: oneItem,
  } = useMemo(() => adapterContext, [adapterContext]);
  // TODO: Same in CItemsProvider, this is a way to avoid needles rerender on a change to the instance of query
  const queryString = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    (async () => {
      try {
        logger.trace('useEffect[queryString] %s', query.toString());
        await allItems(query);
        setIsLoading(false);
      } catch (error) {
        logger.error('Error loading items:', error);
        setIsLoading(false);
      }
    })();
  }, [queryString]);

  const items: V[] = useMemo(() => {
    logger.trace('useMemo[cacheMap]', { query });
    return cacheMap.queryIn(query) as V[];
  }, [cacheMap, query]);

  const all = useCallback(async () => {
    try {
      logger.trace('all', { query });
      setIsLoading(true);
      const items = await allItems(query) as V[] | null;
      setIsLoading(false);
      logger.debug('Items Returned for All', { items });
      return items;
    } catch (error) {
      logger.error('Error in all:', error);
      setIsLoading(false);
      throw error;
    }
  }, [allItems]);

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
    overrides: {
      all,
      one,
    },
  });
}
