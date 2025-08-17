
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

  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    all: allItems,
    one: oneItem,
  } = useMemo(() => adapterContext, [adapterContext]);

  const parentContext = AItem.useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    name: parentName,
    locations: parentLocations,
    item: parentItem,
  } = useMemo(() => parentContext, [parentContext]);

  const queryString = useMemo(() => createStableHash(query), [query]);

  const all = useCallback(async () => {
    if (parentLocations) {
      logger.debug(`${name}: all`, { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      try {
        const result = await allItems(query, parentLocations) as V[] | null;
        return result;
      } catch (error) {
        logger.error(`${name}: Error getting all items`, error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      logger.default(`${name}: No parent locations present to query for all containeditems`,
        { query: abbrevQuery(query) });
      throw new Error(`No parent locations present to query for all containeditems in ${name}`);
    }
  }, [allItems, parentLocations, queryString]);

  const one = useCallback(async () => {
    if (parentLocations) {
      logger.trace('one', { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      try {
        const result = await oneItem(query, parentLocations) as V | null;
        return result;
      } catch (error) {
        logger.error(`${name}: Error getting one item`, error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      logger.default(`${name}: No parent locations present to query for one containeditem`,
        { query: abbrevQuery(query) });
      throw new Error(`No parent locations present to query for one containeditem in ${name}`);
    }
  }, [oneItem, parentLocations, queryString]);

  const [items, setItems] = useState<V[] | null>(null);

  // Load items when query or parent context changes
  useEffect(() => {
    logger.trace('useEffect[queryString, parentLocations, parentName, item]',
      { queryString, parentLocations: abbrevLKA(parentLocations as any), parentName, parentItem });
    (async () => {
      try {
        if (parentLocations) {
          logger.trace('useEffect[queryString]',
            { query: abbrevQuery(query), parentLocations: abbrevLKA(parentLocations as any) });
          setIsLoading(true);
          const results = await allItems(query, parentLocations);
          setItems(results as V[] | null);
          setIsLoading(false);
        } else {
          logger.warning(`${name}: useEffect[queryString, parentLocations] without parent locations`,
            { query: abbrevQuery(query) });
          setItems(null);
          setIsLoading(false);
        }
      } catch (error) {
        logger.error(`${name}: Error in useEffect`, error);
        setItems(null);
        setIsLoading(false);
        // Don't throw here as this would be lost in the async context
        // Let the all/one override functions handle error throwing
      }
    })();
  }, [queryString, parentLocations, parentName, parentItem, allItems, name]);

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
    overrides: {
      all: all,
      one: one,
    },
  });
}
