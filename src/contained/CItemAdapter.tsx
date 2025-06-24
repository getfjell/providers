/* eslint-disable indent */
/* eslint-disable no-undefined */
import LibLogger from "@/logger";
import {
  abbrevIK, abbrevLKA, abbrevQuery,
  ComKey,
  Item,
  ItemQuery, LocKey, LocKeyArray, PriKey, TypesProperties
} from "@fjell/core";
import * as React from "react";
import { CItemAdapterContext, CItemAdapterContextType } from "./CItemAdapterContext";
import { Cache } from "@fjell/cache";
import { CacheMap } from "@fjell/cache";
import { AggregateConfig, createAggregator } from "@fjell/cache";
import { ActionMethod, AllActionMethod, AllFacetMethod, FacetMethod } from "@/AItemAdapterContext";
import { CItemContextType } from "./CItemContext";
import { CItemsContextType } from "./CItemsContext";

const logger = LibLogger.get('CItemAdapter');

export const useCItemAdapter = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>, contextName: string):
  CItemAdapterContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
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
>({
  name,
  cache,
  context,
  aggregates = {},
  events = {},
  addActions,
  addFacets,
  addAllActions,
  addAllFacets,
  children
}: {
  name: string;
  cache: Cache<V, S, L1, L2, L3, L4, L5>;
  context: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>;
  aggregates?: AggregateConfig;
  events?: AggregateConfig;
  addActions?: (contextValues: CItemContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, ActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addFacets?: (contextValues: CItemContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, FacetMethod<S, L1, L2, L3, L4, L5>>;
  addAllActions?: (contextValues: CItemsContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, AllActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addAllFacets?: (contextValues: CItemsContextType<V, S, L1, L2, L3, L4, L5>) => Record<string, AllFacetMethod<L1, L2, L3, L4, L5>>;
  children: React.ReactNode;
}) => {

  // Validate cache at initialization
  React.useEffect(() => {
    if (!cache) {
      logger.error('Cache is undefined in %s. This will cause all operations to fail.', name);
    }
  }, [cache, name]);

  const pkTypes = React.useMemo(() => cache?.pkTypes, [cache]);

  const [cacheMap, setCacheMap] =
    React.useState<CacheMap<V, S, L1, L2, L3, L4, L5>>(new CacheMap<V, S, L1, L2, L3, L4, L5>(pkTypes));

  const sourceCache = React.useMemo(() => {
    if (!cache) {
      logger.error('No cache provided to %s, operations will fail', name);
      return null;
    }
    if ((aggregates && Object.keys(aggregates).length > 0) || (events && Object.keys(events).length > 0)) {
      return createAggregator<V, S, L1, L2, L3, L4, L5>(
        cache, { aggregates, events });
    } else {
      return cache;
    }
  }, [cache, aggregates, events, name]);

  const [resolvedSourceCache, setResolvedSourceCache] = React.useState<Cache<V, S, L1, L2, L3, L4, L5> | null>(null);

  React.useEffect(() => {
    if (sourceCache) {
      if ('then' in sourceCache && typeof sourceCache.then === 'function') {
        (sourceCache as Promise<Cache<V, S, L1, L2, L3, L4, L5>>).then(c => {
          setResolvedSourceCache(c);
        }).catch(error => {
          logger.error('Failed to initialize source cache in %s: %s', name, error);
        });
      } else {
        setResolvedSourceCache(sourceCache as Cache<V, S, L1, L2, L3, L4, L5>);
      }
    }
  }, [sourceCache, name]);

  const handleCacheError = React.useCallback((operation: string) => {
    logger.error('Cache not initialized in %s. Operation "%s" failed.', name, operation);
    throw new Error(`Cache not initialized in ${name}. Operation "${operation}" failed.`);
  }, [name]);

  const all = React.useCallback(async (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V[]> => {
    logger.trace('all', {
      query: query && abbrevQuery(query),
      cache: cache?.pkTypes,
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    if (!resolvedSourceCache) {
      return handleCacheError('all');
    }
    logger.debug('Fetching Items from sourceCache.all');
    const [newCacheMap, items] = await resolvedSourceCache.all(query, locations);
    setCacheMap(newCacheMap.clone());
    return items as V[];
  }, [resolvedSourceCache, handleCacheError]);

  const one = React.useCallback(async (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V> => {
    logger.trace('one', {
      query: query && abbrevQuery(query),
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    if (!resolvedSourceCache) {
      return handleCacheError('one');
    }
    const [newCacheMap, item] = await resolvedSourceCache.one(query, locations);
    setCacheMap(newCacheMap.clone());
    return item as V;
  }, [resolvedSourceCache, handleCacheError]);

  const create = React.useCallback(async (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V> => {
    logger.trace('create', {
      item,
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    if (!resolvedSourceCache) {
      return handleCacheError('create');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache.create(item, locations);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const get = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<V> => {
    logger.trace('get', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      return handleCacheError('get');
    }
    const [newCacheMap, item] = await resolvedSourceCache.get(key);
    setCacheMap(newCacheMap.clone());
    return item as V;
  }, [resolvedSourceCache, handleCacheError]);

  const remove = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<void> => {
    logger.trace('remove', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      return handleCacheError('remove');
    }
    const newCacheMap = await resolvedSourceCache.remove(key);
    setCacheMap(newCacheMap.clone());
  }, [resolvedSourceCache, handleCacheError]);

  const retrieve = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<V> => {
    logger.trace('retrieve', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      return handleCacheError('retrieve');
    }
    const [newCacheMap, item] = await resolvedSourceCache.retrieve(key);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return item as V;
  }, [resolvedSourceCache, handleCacheError]);

  const update = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ): Promise<V> => {
    logger.trace('update', { key: abbrevIK(key), item });
    if (!resolvedSourceCache) {
      return handleCacheError('update');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache.update(key, item);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const action = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body?: any,
  ): Promise<V> => {
    logger.trace('action', { key: abbrevIK(key), action, body });
    if (!resolvedSourceCache) {
      return handleCacheError('action');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache.action(key, action, body);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const allAction = React.useCallback(async (
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V[]> => {
    logger.trace('allAction', {
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
      action,
      body,
    });
    if (!resolvedSourceCache) {
      return handleCacheError('allAction');
    }
    const [newCacheMap, newItems] = await resolvedSourceCache.allAction(action, body, locations);
    setCacheMap(newCacheMap.clone());
    return newItems as V[];
  }, [resolvedSourceCache, handleCacheError]);

  const facet = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    facet: string,
  ): Promise<any> => {
    logger.trace('facet', { key: abbrevIK(key), facet });
    if (!resolvedSourceCache) {
      return handleCacheError('facet');
    }
    const [newCacheMap, response] = await resolvedSourceCache.facet(key, facet);
    setCacheMap(newCacheMap.clone());
    return response as any;
  }, [resolvedSourceCache, handleCacheError]);

  const allFacet = React.useCallback(async (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<any> => {
    logger.trace('allFacet', { facet, params });
    if (!resolvedSourceCache) {
      return handleCacheError('allFacet');
    }
    const [newCacheMap, response] = await resolvedSourceCache.allFacet(facet, params);
    setCacheMap(newCacheMap.clone());
    return response as any;
  }, [resolvedSourceCache, handleCacheError]);

  const find = React.useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V[]> => {
    logger.trace('find', { finder, finderParams, locations });
    if (!resolvedSourceCache) {
      return handleCacheError('find');
    }
    const [newCacheMap, newItems] = await resolvedSourceCache.find(finder, finderParams, locations);
    setCacheMap(newCacheMap.clone());
    return newItems as V[];
  }, [resolvedSourceCache, handleCacheError]);

  const set = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: V,
  ): Promise<V> => {
    logger.trace('set', { key, item });
    if (!resolvedSourceCache) {
      return handleCacheError('set');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache.set(key, item);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const contextValue: Partial<CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>> = {
    name,
    cacheMap,
    pkTypes,
    all,
    one,
    create,
    get,
    remove,
    retrieve,
    update,
    action,
    allAction,
    facet,
    allFacet,
    find,
    set,
    addActions,
    addFacets,
    addAllActions,
    addAllFacets
  };

  return React.createElement(
    context.Provider,
    {
      value: contextValue as CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>,
    },
    children,
  );
}
