/* eslint-disable no-undefined */
import { abbrevIK, AllItemTypeArrays, ComKey, Item, ItemQuery, LocKeyArray, OperationParams, PriKey } from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";

import { AggregateConfig, Cache, createAggregator } from "@fjell/cache";
import { FacetParams } from "src/types";
import * as AItem from "../AItem";
import * as AItemAdapter from "../AItemAdapter";
import * as AItems from "../AItems";
import * as Faceted from "../Faceted";
import LibLogger from '../logger';
import { isPromise } from '../utils';

const logger = LibLogger.get('PItemAdapter');

export interface ContextType<
    V extends Item<S>,
    S extends string
  > extends AItemAdapter.ContextType<V, S> {
    name: string;
    pkTypes: AllItemTypeArrays<S>;
    /** The resolved cache instance for direct access */
    cache: Cache<V, S> | null;
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
  useEffect(() => {
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
        debounceMs: 0 // No debounce - execute immediately to avoid race conditions
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
    // Validate that result is an array or null, return null for invalid results
    if (result === null || result === undefined) {
      return null;
    }
    if (!Array.isArray(result)) {
      logger.debug('Invalid result from cache.operations.all: expected array or null, got %s', typeof result);
      return null;
    }
    return result as V[];
  }, [ensureCache, name]);

  const one = useCallback(async (
    query?: ItemQuery,
  ): Promise<V | null> => {
    logger.trace('one', { query: query && query.toString() });
    const cache = ensureCache('one');
    const item = await cache.operations.one(query);
    return item as V | null;
  }, [ensureCache, name]);

  const create = useCallback(async (
    item: Partial<Item<S>>,
  ): Promise<V> => {
    logger.trace('create', { item });
    const cache = ensureCache('create');
    const newItem = await cache.operations.create(item);
    return newItem as V;
  }, [ensureCache]);

  const get = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('get', { key: abbrevIK(key) });
    const cache = ensureCache('get');
    const item = await cache.operations.get(key);
    return item as V | null;
  }, [ensureCache]);

  const remove = useCallback(async (
    key: PriKey<S>,
  ): Promise<void> => {
    logger.trace('remove', { key: abbrevIK(key) });
    const cache = ensureCache('remove');
    await cache.operations.remove(key);
  }, [ensureCache, cacheVersion]); // Add cacheVersion to force recreation on cache events

  const retrieve = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('retrieve', { key: abbrevIK(key) });
    const cache = ensureCache('retrieve');
    const item = await cache.operations.retrieve(key);
    return item as V | null;
  }, [ensureCache, cacheVersion]); // Add cacheVersion to force recreation on cache events

  const update = useCallback(async (
    key: PriKey<S>,
    item: Partial<Item<S>>,
  ): Promise<V> => {
    logger.trace('update', { key: abbrevIK(key), item });
    const cache = ensureCache('update');
    const newItem = await cache.operations.update(key, item);
    return newItem as V;
  }, [ensureCache]);

  const action = useCallback(async (
    key: PriKey<S>,
    action: string,
    params?: OperationParams,
  ): Promise<[V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> => {
    logger.trace('action', { key: abbrevIK(key), action, params });
    const cache = ensureCache('action');
    const newItem = await cache.operations.action(key, action, params);
    return newItem;
  }, [ensureCache]);

  const allAction = useCallback(async (
    action: string,
    params?: OperationParams,
  ): Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> => {
    logger.trace('allAction', { action, params });
    const cache = ensureCache('allAction');
    const newItems = await cache.operations.allAction(action, params);
    return newItems;
  }, [ensureCache]);

  const facet = useCallback(async (
    key: PriKey<S>,
    facet: string,
    params?: FacetParams,
  ): Promise<any | null> => {
    logger.trace('facet', { key: abbrevIK(key), facet, params });
    const cache = ensureCache('facet');
    const response = params !== undefined
      ? await cache.operations.facet(key, facet, params)
      : await cache.operations.facet(key, facet);
    return response as any | null;
  }, [ensureCache]);

  const allFacet = useCallback(async (
    facet: string,
    params?: FacetParams,
  ): Promise<any> => {
    logger.trace('allFacet', { facet, params });
    const cache = ensureCache('allFacet');
    const response = await cache.operations.allFacet(facet, params);
    return response as any;
  }, [ensureCache]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<V[] | null> => {
    logger.trace('find', { finder, finderParams });
    const cache = ensureCache('find');
    const newItems = await cache.operations.find(finder, finderParams);
    return newItems as V[];
  }, [ensureCache]);

  const findOne = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<V | null> => {
    logger.trace('findOne', { finder, finderParams });
    const cache = ensureCache('findOne');
    const newItems = await cache.operations.find(finder, finderParams);
    // findOne should return the first item from find results, or null if no results
    if (!Array.isArray(newItems) || newItems.length === 0) {
      return null;
    }
    return newItems[0] as V;
  }, [ensureCache]);

  const set = useCallback(async (
    key: PriKey<S>,
    item: V,
  ): Promise<V> => {
    logger.trace('set', { key: abbrevIK(key), item });
    const cache = ensureCache('set');
    const newItem = await cache.operations.set(key, item);
    return newItem as V;
  }, [ensureCache]);

  const contextValue: ContextType<V, S> = useMemo(() => ({
    name,
    pkTypes: pkTypes || (['placeholder' as S] as AllItemTypeArrays<S>),
    cache: resolvedSourceCache,
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
    pkTypes,
    resolvedSourceCache,
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
    cacheVersion, // Add cacheVersion to force context recreation when cache events occur

  ]);

  return createElement(
    context.Provider,
    {
      value: contextValue,
    },
    children,
  );
}
