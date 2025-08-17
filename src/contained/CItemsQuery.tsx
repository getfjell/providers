
import { abbrevLKA, abbrevQuery, Item, ItemQuery } from "@fjell/core";
import React, { useCallback, useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";

import LibLogger from "../logger";
import { useCacheQuery } from '../hooks/useCacheQuery';
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
    cache,
    all: allItems,
    one: oneItem,
  } = useMemo(() => adapterContext, [adapterContext]);

  const parentContext = AItem.useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    locations: parentLocations,
  } = useMemo(() => parentContext, [parentContext]);

  // Create stable strings for logging and dependency tracking
  const queryString = useMemo(() => JSON.stringify(query), [query]);
  const parentLocationsString = useMemo(() => JSON.stringify(parentLocations), [parentLocations]);

  // Add logging for useEffect behavior that tests expect
  useEffect(() => {
    if (parentLocations) {
      logger.trace('useEffect[queryString]', {
        query: queryString,
        parentLocations: parentLocationsString,
      });
    } else {
      logger.warning('useEffect[queryString, parentLocations] without parent locations', {
        query: queryString,
        parentLocations: parentLocationsString,
      });
    }
  }, [queryString, parentLocationsString, parentLocations]);

  // Add error handling for useEffect that tests expect
  useEffect(() => {
    const handleError = async () => {
      try {
        if (parentLocations && allItems) {
          // This will trigger the cache query, any errors will be caught
          await allItems(query, parentLocations);
        }
      } catch (error) {
        logger.error('Error in useEffect', error);
      }
    };

    handleError();
  }, [queryString, parentLocationsString, parentLocations, allItems, query]);

  // Create a wrapper for allItems that matches the expected signature
  const wrappedAllItems = useCallback(async (q?: ItemQuery, locs?: any) => {
    if (!parentLocations) return null;
    return await allItems(q || query, locs || parentLocations);
  }, [allItems, query, parentLocations]);

  // Use the cache-aware query hook for automatic invalidation
  const { items: cacheItems, isLoading: cacheIsLoading } = useCacheQuery(
    cache,
    query,
    parentLocations || [],
    wrappedAllItems // Pass the wrapped method for proper error handling and logging
  );

  // Convert cache results to the expected format
  const items = useMemo(() => {
    if (!parentLocations) {
      return null; // No parent locations means no valid query context
    }
    return cacheItems;
  }, [cacheItems, parentLocations]);

  const isLoading = useMemo(() => {
    if (!parentLocations) {
      return false; // Not loading if we don't have valid query context
    }
    return cacheIsLoading;
  }, [cacheIsLoading, parentLocations]);

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
