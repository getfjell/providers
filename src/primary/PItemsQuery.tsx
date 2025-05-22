 
import { Item, ItemQuery } from "@fjell/core";
import React, { useCallback, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";

import LibLogger from '@/logger';
import { PItemAdapterContext } from "./PItemAdapterContext";
import { PItemsContext, PItemsContextType } from "./PItemsContext";
import { PItemsProvider } from "./PItemsProvider";

export const PItemsQuery = <
  V extends Item<S>,
  S extends string
>(
    {
      name,
      adapter,
      addActions = () => ({}),
      addQueries = () => ({}),
      children,
      context,
      query = {},
      renderEach,
    }: {
    name: string;
    adapter: PItemAdapterContext<V, S>;
    addActions?: (contextValues: PItemsContextType<V, S>) =>
      Record<string, (...params: any) => Promise<any>>;
    addQueries?: (contextValues: PItemsContextType<V, S>) =>
      Record<string, (...params: any) => Promise<string | boolean | number | null>>;
    children: React.ReactNode;
    context: PItemsContext<V, S>;
    query?: ItemQuery;
    renderEach?: (item: V) => React.ReactNode;
  }
  ) => {

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = usePItemAdapter<V, S>(adapter);

  // Destructure the values we need to define functions.
  const {
    cacheMap,
    pkTypes,
    all: allItems,
    one: oneItem,
  } = useMemo(() => adapterContext, [adapterContext]);

  const logger = LibLogger.get('PItemsQuery', ...pkTypes);

  // TODO: Same in CItemsProvider, this is a way to avoid needles rerender on a change to the instance of query
  const queryString = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    (async () => {
      logger.trace('useEffect[queryString]', { query });
      await allItems(query);
      setIsLoading(false);
    })();
  }, [queryString]);

  const items: V[] = useMemo(() => {
    logger.trace('useMemo[cacheMap]', { query });
    return cacheMap.queryIn(query) as V[];
  }, [cacheMap]);

  const all = useCallback(async () => {
    logger.trace('all', { query });
    setIsLoading(true);
    const items = await allItems(query) as V[] | null;
    setIsLoading(false);
    logger.debug('Items Returned for All', { items });
    return items;
  }, [allItems]);

  const one = useCallback(async () => {
    logger.trace('one', { query });
    setIsLoading(true);
    const item = await oneItem(query) as V | null;
    setIsLoading(false);
    return item;
  }, [oneItem]);

  return PItemsProvider<V, S>({
    name,
    adapter,
    addActions,
    addQueries,
    children,
    context,
    renderEach,
    items,
    isLoadingParam: isLoading,
    overrides: {
      all,
      one,
    },
  });
}
