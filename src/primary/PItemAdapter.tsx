/* eslint-disable no-undefined */
import { abbrevIK, AllItemTypeArrays, Item, ItemQuery, PriKey } from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";

import { AggregateConfig, Cache, CacheMap, createAggregator, MemoryCacheMap } from "@fjell/cache";
import * as AItemAdapter from "../AItemAdapter";
import * as AItem from "../AItem";
import * as AItems from "../AItems";
import LibLogger from '../logger';
import { isPromise } from '../utils';
import * as Faceted from "../Faceted";
import { FacetParams } from "src/types";

const logger = LibLogger.get('PItemAdapter');

export interface ContextType<
    V extends Item<S>,
    S extends string
  > extends AItemAdapter.ContextType<V, S> {
    name: string;
    cacheMap: CacheMap<V, S>;
    pkTypes: AllItemTypeArrays<S>;
    addFacets?: (facet: Faceted.FacetMethod) => Record<string, Faceted.AddedFacetMethod>;
    addAllFacets?: (allFacet: Faceted.AllFacetMethod) => Record<string, Faceted.AddedFacetMethod>;
  }

export type Context<V extends Item<S>, S extends string> =
    React.Context<ContextType<V, S> | undefined>;

export const usePItemAdapter = <
  V extends Item<S>,
  S extends string
>(context: Context<V, S>, contextName: string): ContextType<V, S> => {
  const contextInstance = React.useContext(context);

  if (contextInstance === undefined) {
    throw new Error(
      `usePItemAdapter hook must be used within a ${contextName} provider. ` +
      `Make sure to wrap your component with <${contextName}.Provider value={...}> ` +
      `or use the corresponding Provider component.`
    );
  }
  return contextInstance;
};

export const Adapter = <
  V extends Item<S>,
  S extends string
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
  cache: Cache<V, S>;
  context: Context<V, S>;
  aggregates?: AggregateConfig;
  events?: AggregateConfig;
  addActions?: (action: AItem.ActionMethod<V, S>) => Record<string, AItem.AddedActionMethod<V, S>>;
  addFacets?: (facet: Faceted.FacetMethod) => Record<string, Faceted.AddedFacetMethod>;
  addAllActions?: (allAction: AItems.AllActionMethod<V, S>) => Record<string, AItems.AddedAllActionMethod<V, S>>;
  addAllFacets?: (allFacet: Faceted.AllFacetMethod) => Record<string, Faceted.AddedFacetMethod>;
  children: React.ReactNode;
}) => {

  // Validate cache at initialization
  React.useEffect(() => {
    if (!cache) {
      logger.error('Cache is undefined in %s. This will cause all operations to fail.', name);
    }
  }, [cache, name]);

  const pkTypes = useMemo(() => {
    // Handle the case where cache might be a Promise (async initialization)
    if (!cache || typeof (cache as any).then === 'function') {
      return undefined;
    }
    return cache.coordinate?.kta;
  }, [cache]);

  const [cacheMap, setCacheMap] =
    React.useState<CacheMap<V, S>>(() => {
      // Use a placeholder type when pkTypes is not available yet
      const defaultTypes = (pkTypes || ['placeholder' as S]) as AllItemTypeArrays<S>;
      return new MemoryCacheMap<V, S>(defaultTypes);
    });

  // Update CacheMap when pkTypes becomes available
  React.useEffect(() => {
    if (pkTypes) {
      setCacheMap(new MemoryCacheMap<V, S>(pkTypes));
    }
  }, [pkTypes]);

  const sourceCache = useMemo(() => {
    if (!cache) {
      logger.error('No cache provided to %s, operations will fail', name);
      return null;
    }
    if (aggregates && Object.keys(aggregates).length > 0) {
      return createAggregator<V, S>(cache, { aggregates, events });
    } else {
      return cache;
    }
  }, [cache, aggregates, events, name]);

  const [resolvedSourceCache, setResolvedSourceCache] = React.useState<Cache<V, S> | null>(() => {
    if (sourceCache && !isPromise(sourceCache)) {
      return sourceCache as Cache<V, S>;
    }
    return null;
  });

  // State to trigger re-renders when cache events occur
  const [cacheVersion, setCacheVersion] = React.useState(0);

  React.useEffect(() => {
    if (sourceCache) {
      if (isPromise<Cache<V, S>>(sourceCache)) {
        sourceCache.then(c => {
          setResolvedSourceCache(c);
        }).catch(error => {
          logger.error('Failed to initialize source cache in %s: %s', name, error);
        });
      } else {
        setResolvedSourceCache(sourceCache);
      }
    } else {
      setResolvedSourceCache(null);
    }
  }, [sourceCache, name]);

  // Subscribe to cache events to trigger re-renders
  React.useEffect(() => {
    if (!resolvedSourceCache || typeof resolvedSourceCache.subscribe !== 'function') {
      return;
    }

    try {
      const subscription = resolvedSourceCache.subscribe((event) => {
        // Increment version to trigger re-renders for any cache change
        setCacheVersion(prev => prev + 1);
        logger.debug(`Cache event in ${name}:`, event.type, event);
      }, {
        // Subscribe to all cache events for this adapter
        eventTypes: [
          'item_created',
          'item_updated',
          'item_removed',
          'item_retrieved',
          'item_set',
          'items_queried',
          'cache_cleared',
          'location_invalidated',
          'query_invalidated'
        ],
        debounceMs: 50 // Small debounce to batch rapid updates
      });

      return () => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      logger.debug(`Cache subscription not available in ${name}:`, error);
      // Return a no-op cleanup function
      return () => {};
    }
  }, [resolvedSourceCache, name]);

  const handleCacheError = useCallback((operation: string): never => {
    logger.error('Cache not initialized in %s. Operation "%s" failed.', name, operation);
    throw new Error(
      `Cache not initialized in ${name}. Operation "${operation}" failed. ` +
      `This usually means the cache prop was not provided to the adapter or ` +
      `the cache Promise has not resolved yet. Check your adapter configuration.`
    );
  }, [name]);

  const ensureCache = useCallback((operation: string) => {
    if (!resolvedSourceCache) {
      handleCacheError(operation);
    }
    return resolvedSourceCache!;
  }, [resolvedSourceCache, handleCacheError]);

  const all = useCallback(async (
    query?: ItemQuery,
  ): Promise<V[] | null> => {
    logger.trace('all', { query: query && query.toString() });
    const cache = ensureCache('all');
    const result = await cache.operations.all(query);
    if (!Array.isArray(result)) {
      logger.error('Invalid result from cache.all() in %s', name);
      return null;
    }
    const [newCacheMap, items] = result;
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return items as V[] | null;
  }, [ensureCache, name]);

  const one = useCallback(async (
    query?: ItemQuery,
  ): Promise<V | null> => {
    logger.trace('one', { query: query && query.toString() });
    const cache = ensureCache('one');
    const [newCacheMap, item] = await cache.operations.one(query);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return item as V | null;
  }, [resolvedSourceCache, handleCacheError]);

  const create = useCallback(async (
    item: Partial<Item<S>>,
  ): Promise<V> => {
    logger.trace('create', { item });
    const cache = ensureCache('create');
    const [newCacheMap, newItem] = await cache.operations.create(item);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItem as V;
  }, [ensureCache]);

  const get = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('get', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      handleCacheError('get');
    }
    const [newCacheMap, item] = await resolvedSourceCache!.operations.get(key);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return item as V | null;
  }, [resolvedSourceCache, handleCacheError]);

  const remove = useCallback(async (
    key: PriKey<S>,
  ): Promise<void> => {
    logger.trace('remove', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      handleCacheError('remove');
    }
    const newCacheMap = await resolvedSourceCache!.operations.remove(key);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
  }, [resolvedSourceCache, handleCacheError]);

  const retrieve = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('retrieve', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      handleCacheError('retrieve');
    }
    const [newCacheMap, item] = await resolvedSourceCache!.operations.retrieve(key);
    // Update the cacheMap state if there's a new cache map from the underlying cache
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    } else if (item) {
      // If newCacheMap is null but we have an item, it means the item was already cached
      // in the underlying cache but might not be in our React state cacheMap, so update it
      setCacheMap(prevCacheMap => {
        const newMap = prevCacheMap.clone();
        newMap.set(key, item);
        return newMap;
      });
    }
    return item as V | null;
  }, [resolvedSourceCache, handleCacheError]);

  const update = useCallback(async (
    key: PriKey<S>,
    item: Partial<Item<S>>,
  ): Promise<V> => {
    logger.trace('update', { key: abbrevIK(key), item });
    if (!resolvedSourceCache) {
      handleCacheError('update');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache!.operations.update(key, item);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const action = useCallback(async (
    key: PriKey<S>,
    action: string,
    body?: any,
  ): Promise<V> => {
    logger.trace('action', { key: abbrevIK(key), action, body });
    if (!resolvedSourceCache) {
      handleCacheError('action');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache!.operations.action(key, action, body);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const allAction = useCallback(async (
    action: string,
    body?: any,
  ): Promise<V[] | null> => {
    logger.trace('action', { action, body });
    if (!resolvedSourceCache) {
      handleCacheError('allAction');
    }
    const [newCacheMap, newItems] = await resolvedSourceCache!.operations.allAction(action, body);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItems as V[];
  }, [resolvedSourceCache, handleCacheError]);

  const facet = useCallback(async (
    key: PriKey<S>,
    facet: string,
    params?: FacetParams,
  ): Promise<any | null> => {
    logger.trace('facet', { key: abbrevIK(key), facet, params });
    if (!resolvedSourceCache) {
      handleCacheError('facet');
    }
    const [newCacheMap, response] = params !== undefined
      ? await resolvedSourceCache!.operations.facet(key, facet, params)
      : await resolvedSourceCache!.operations.facet(key, facet);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return response as any | null;
  }, [resolvedSourceCache, handleCacheError]);

  const allFacet = useCallback(async (
    facet: string,
    params?: FacetParams,
  ): Promise<any> => {
    logger.trace('allFacet', { facet, params });
    if (!resolvedSourceCache) {
      handleCacheError('allFacet');
    }
    const [newCacheMap, response] = await resolvedSourceCache!.operations.allFacet(facet, params);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return response as any;
  }, [resolvedSourceCache, handleCacheError]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<V[] | null> => {
    logger.trace('find', { finder, finderParams });
    if (!resolvedSourceCache) {
      handleCacheError('find');
    }
    const [newCacheMap, newItems] = await resolvedSourceCache!.operations.find(finder, finderParams);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItems as V[];
  }, [resolvedSourceCache, handleCacheError]);

  const findOne = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<V | null> => {
    logger.trace('findOne', { finder, finderParams });
    if (!resolvedSourceCache) {
      handleCacheError('findOne');
    }
    const [newCacheMap, newItems] = await resolvedSourceCache!.operations.find(finder, finderParams);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItems && newItems.length > 0 ? (newItems[0] as V) : null;
  }, [resolvedSourceCache, handleCacheError]);

  const set = useCallback(async (
    key: PriKey<S>,
    item: V,
  ): Promise<V> => {
    logger.trace('set', { key: abbrevIK(key), item });
    if (!resolvedSourceCache) {
      handleCacheError('set');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache!.operations.set(key, item);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const contextValue: ContextType<V, S> = useMemo(() => ({
    name,
    cacheMap,
    pkTypes: pkTypes || (['placeholder' as S] as AllItemTypeArrays<S>),
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
    findOne,
    set,
    addActions,
    addFacets,
    addAllActions,
    addAllFacets,
  }), [
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
    findOne,
    set,
    addActions,
    addFacets,
    addAllActions,
    addAllFacets,
    cacheVersion // Include cacheVersion to trigger re-renders on cache events
  ]);

  return createElement(
    context.Provider,
    {
      value: contextValue,
    },
    children,
  );
}
