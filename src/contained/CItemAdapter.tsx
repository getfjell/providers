/* eslint-disable no-undefined, max-params */
import LibLogger from "@/logger";
import { AggregateConfig, AItemAggregator, CacheMap, CItemCache } from "@fjell/cache";
import {
  abbrevIK, abbrevLKA, abbrevQuery,
  ComKey,
  Item,
  ItemQuery, LocKey, LocKeyArray, PriKey, TypesProperties
} from "@fjell/core";
import React, { createElement, useCallback, useMemo } from "react";
import { CItemAdapterContext, CItemAdapterContextType } from "./CItemAdapterContext";

export const useCItemAdapter = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>): CItemAdapterContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This generic item adapter hook must be used within a ${context.displayName}`,
    );
  }
  return contextInstance;
};

export const CItemAdapter = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    { name, cache, context, aggregates, events, addActions, children }: {
    name: string;
    cache: CItemCache<V, S, L1, L2, L3, L4, L5>;
    context: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>;
    aggregates?: AggregateConfig;
    events?: AggregateConfig;
    addActions?: (contextValues: CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>) =>
      Record<string, (
        ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
        body?: any,
      ) => Promise<V | null>>;
    children: React.ReactNode;
  }
  ) => {

  const pkType = useMemo(() => cache.getPkType(), [cache]);
  const logger = LibLogger.get('CItemAdapter', pkType);

  const [cacheMap, setCacheMap] =
    React.useState<CacheMap<V, S, L1, L2, L3, L4, L5>>(new CacheMap<V, S, L1, L2, L3, L4, L5>(cache.getKeyTypes()));

  const sourceCache = useMemo(() => {
    if ((aggregates && Object.keys(aggregates).length > 0) || (events && Object.keys(events).length > 0)) {
      return new AItemAggregator<V, S, L1, L2, L3, L4, L5>(
        cache, { aggregates, events });
    } else {
      return cache
    }
  }, [cache, aggregates]);

  // TODO: Locations should be required here
  const all = useCallback(async (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V[] | null> => {
    logger.trace('all', {
      query: query && abbrevQuery(query),
      cache: cache.getPkType(),
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    logger.debug('Fetching Items from sourceCache.all');
    const [newCacheMap, items] = await sourceCache.all(query, locations);
    setCacheMap(newCacheMap.clone());
    return items as V[];
  }, [cache]);

  const one = useCallback(async (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V | null> => {
    logger.trace('one', {
      query: query && abbrevQuery(query),
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    // TODO: This isLoading thing could be a decorator method...  look into it.
    const [newCacheMap, item] = await sourceCache.one(query, locations);
    setCacheMap(newCacheMap.clone());
    return item as V | null;
  }, [cache]);

  const create = useCallback(async (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V> => {
    logger.trace('create', {
      item,
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    const [newCacheMap, newItem] = await sourceCache.create(item, locations);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [cache]);

  const get = useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('get', { key: abbrevIK(key) });
    const [newCacheMap, item] = await sourceCache.get(key);
    setCacheMap(newCacheMap.clone());
    return item as V | null;
  }, [cache]);

  const remove = useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<void> => {
    logger.trace('remove', { key: abbrevIK(key) });
    const newCacheMap = await sourceCache.remove(key);
    setCacheMap(newCacheMap.clone());
  }, [cache]);

  const retrieve = useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('retrieve', { key: abbrevIK(key) });
    const [newCacheMap, item] = await sourceCache.retrieve(key);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return item as V | null;
  }, [cache]);

  const update = useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ): Promise<V> => {
    logger.trace('update', { key: abbrevIK(key), item });
    const [newCacheMap, newItem] = await sourceCache.update(key, item);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [cache]);

  const action = useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body?: any,
  ): Promise<V> => {
    logger.trace('action', { key: abbrevIK(key), action, body });
    const [newCacheMap, newItem] = await sourceCache.action(key, action, body);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [cache]);

  // TODO: Locations should be mandatory here
  const allAction = useCallback(async (
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V[]> => {
    logger.trace('allAction', {
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
      action,
      body,
    });
    const [newCacheMap, newItems] = await sourceCache.allAction(action, body, locations);
    setCacheMap(newCacheMap.clone());
    return newItems as V[];
  }, [cache]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V[]> => {
    logger.trace('find', { finder, finderParams, locations });
    const [newCacheMap, newItems] = await sourceCache.find(finder, finderParams, locations);
    setCacheMap(newCacheMap.clone());
    return newItems as V[];
  }, [cache]);

  const contextValue: CItemAdapterContextType<V, S, L1, L2, L3, L4, L5> = {
    name,
    cacheMap,
    pkType,
    all,
    one,
    create,
    get,
    remove,
    retrieve,
    update,
    action,
    allAction,
    find,
  };

  if (addActions && contextValue) {
    contextValue.actions = addActions(contextValue);
  }

  return createElement(
    context.Provider,
    {
      value: contextValue,
    },
    children,
  );
}
