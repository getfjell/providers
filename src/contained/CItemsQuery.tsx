 
import { useAItem } from "@/AItemProvider";
import { abbrevLKA, abbrevQuery, Item, ItemQuery, LocKeyArray } from "@fjell/core";
import React, { useCallback, useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";

import { AItemContext } from "@/AItemContext";
import LibLogger from "@/logger";
import { CItemAdapterContext, CItemAdapterContextType } from "./CItemAdapterContext";
import { CItemsContext } from "./CItemsContext";
import { CItemsProvider } from "./CItemsProvider";

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
      addActions = () => ({}),
      addQueries = () => ({}),
      children = (<></>),
      context,
      parent,
      query = {},
      renderEach,
    }: {
    name: string;
    adapter: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>;
    // TODO: Put more structure on what an action *actually* is.  Should it return a string specifying the action
    // along with the parameters that would be used as a body?
    addActions?: (
      adapter: CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>,
      locations: LocKeyArray<L1, L2, L3, L4, L5>,
      parentItem: Item<L1, L2, L3, L4, L5, never>
    ) =>
      Record<string, (params: any) => Promise<any>>;
    addQueries?: (
      adapter: CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>,
      locations: LocKeyArray<L1, L2, L3, L4, L5>,
      parentItem: Item<L1, L2, L3, L4, L5, never>
    ) =>
      Record<string, (params: any) => Promise<string | boolean | number | null>>;
    children?: React.ReactNode;
    context: CItemsContext<V, S, L1, L2, L3, L4, L5>;
    query?: ItemQuery;
    parent: AItemContext<Item<L1, L2, L3, L4, L5, never>, L1, L2, L3, L4, L5>;
    renderEach?: (item: V) => React.ReactNode;
  }
  ) => {

  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter);

  // Destructure the values we need to define functions.
  const {
    cacheMap,
    pkTypes,
    all: allItems,
    one: oneItem,
  } = useMemo(() => adapterContext, [adapterContext]);

  const logger = LibLogger.get('CItemsQuery', ...pkTypes);

  const parentContext = useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent);

  const {
    name: parentName,
    locations: parentLocations,
    item: parentItem,
  } = useMemo(() => parentContext, [parentContext]);

  // TODO: Ok, I sort of hate this, but we're making sure that we're not requerying unless the string has changed.
  const queryString = useMemo(() => JSON.stringify(query), [query]);

  const all = useCallback(async () => {
    // TODO: Probably need exception handling here
    if (parentLocations) {
      logger.debug(`${name}: all`, { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      const result = await allItems(query, parentLocations) as V[] | null;
      setIsLoading(false);
      return result;
    } else {
      logger.default(`${name}: No parent locations present to query for all containeditems`,
        { query: abbrevQuery(query) });
      throw new Error(`No parent locations present to query for all containeditems in ${name}`);
    }
  }, [allItems, parentLocations, queryString]);

  const one = useCallback(async () => {
    // TODO: Probably need exception handling here
    if (parentLocations) {
      logger.trace('one', { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      const result = await oneItem(query, parentLocations) as V | null;
      setIsLoading(false);
      return result;
    } else {
      logger.default(`${name}: No parent locations present to query for one containeditem`,
        { query: abbrevQuery(query) });
      throw new Error(`No parent locations present to query for one containeditem in ${name}`);
    }
  }, [oneItem, parentLocations, queryString]);

  useEffect(() => {
    // TODO: Probably need exception handling here
    logger.trace('useEffect[queryString, parentLocations, parentName, item]',
      { queryString, parentLocations: abbrevLKA(parentLocations as any), parentName, parentItem });
    (async () => {
      if (parentLocations) {
        logger.trace('useEffect[queryString]',
          { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
        await allItems(query, parentLocations);
        setIsLoading(false);
      } else {
        logger.warning(`${name}: useEffect[queryString, parentLocations] without parent locations`,
          { query: abbrevQuery(query) });
        // logger.warn('No parent locations present to process queryString for containeditems', {
        //   query,
        //   queryString,
        //   parentLocations,
        //   parentItem,
        // });
        // throw new Error('No parent locations present to process queryString for containeditems');
      }
    })();
  }, [queryString, parentLocations, parentName, parentItem]);

  const items: V[] | null = useMemo(() => {
    // TODO: Probably need exception handling here
    logger.trace('useMemo[cacheMap, parentLocations]',
      { cacheMapIsNull: cacheMap === null, parentLocations: abbrevLKA(parentLocations as any) });
    if (parentLocations) {
      const results: V[] | null = cacheMap.queryIn(query, parentLocations) as V[] | null;
      setIsLoading(false);
      return results;
    } else {
      logger.warning(`${name}: items without parent locations`, { query: abbrevQuery(query) });
      // logger.warn('No parent locations present to query cacheMap for containeditems', {
      //   query,
      //   queryString,
      //   parentLocations,
      //   parentItem,
      // });
      //throw new Error('No parent locations present to query cacheMap for containeditems');
      return null;
    }
  }, [cacheMap, parentLocations]);

  return CItemsProvider<V, S, L1, L2, L3, L4, L5>({
    name,
    adapter,
    addActions,
    addQueries,
    children,
    context,
    renderEach,
    items,
    isLoadingParam: isLoading,
    parent,
    overrides: {
      all: all,
      one: one,
    },
  });
}
