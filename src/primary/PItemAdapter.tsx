/* eslint-disable no-undefined */
import { abbrevIK, Item, ItemQuery, PriKey, TypesProperties } from "@fjell/core";
import React, { createElement, useCallback, useMemo } from "react";
import { PItemAdapterContext, PItemAdapterContextType } from "./PItemAdapterContext";

import LibLogger from '@/logger';
import { AggregateConfig, createAggregator } from "@fjell/cache";
import { Cache } from "@fjell/cache";
import { CacheMap } from "@fjell/cache";

export const usePItemAdapter = <
  V extends Item<S>,
  S extends string
>(context: PItemAdapterContext<V, S>): PItemAdapterContextType<V, S> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This generic item adapter hook must be used within a ${context.displayName}`,
    );
  }
  return contextInstance;
};

export const PItemAdapter = <
  C extends Cache<V, S>,
  V extends Item<S>,
  S extends string
>({ name, cache, context, aggregates = {}, events = {}, addActions, children }: {
  name: string;
  cache: C;
  context: PItemAdapterContext<V, S>;
  aggregates?: AggregateConfig;
  events?: AggregateConfig;
  addActions?: (contextValues: PItemAdapterContextType<V, S>) =>
    Record<string, (
      ik: PriKey<S>,
      body?: any
    ) => Promise<V | null>>;
  children: React.ReactNode;
}) => {

  // Validate cache at initialization
  React.useEffect(() => {
    if (!cache) {
      logger.error('Cache is undefined in %s. This will cause all operations to fail.', name);
    }
  }, [cache, name]);

  const pkTypes = useMemo(() => cache?.pkTypes ?? [], [cache]);
  const logger = LibLogger.get('PItemAdapter', ...pkTypes);

  const [cacheMap, setCacheMap] =
    React.useState<CacheMap<V, S>>(new CacheMap<V, S>(pkTypes));

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

  const handleCacheError = useCallback((operation: string) => {
    logger.error('Cache not initialized in %s. Operation "%s" failed.', name, operation);
    throw new Error(`Cache not initialized in ${name}. Operation "${operation}" failed.`);
  }, [name]);

  const all = useCallback(async (
    query?: ItemQuery,
  ): Promise<V[] | null> => {
    logger.trace('all', { query: query && query.toString() });
    if (!sourceCache) {
      return handleCacheError('all');
    }
    const [newCacheMap, items] = await sourceCache.all(query);
    setCacheMap(newCacheMap.clone());
    return items as V[] | null;
  }, [sourceCache, handleCacheError]);

  const one = useCallback(async (
    query?: ItemQuery,
  ): Promise<V | null> => {
    logger.trace('one', { query: query && query.toString() });
    if (!sourceCache) {
      return handleCacheError('one');
    }
    const [newCacheMap, item] = await sourceCache.one(query);
    setCacheMap(newCacheMap.clone());
    return item as V | null;
  }, [sourceCache, handleCacheError]);

  const create = useCallback(async (
    item: TypesProperties<V, S>,
  ): Promise<V> => {
    logger.trace('create', { item });
    if (!sourceCache) {
      return handleCacheError('create');
    }
    const [newCacheMap, newItem] = await sourceCache.create(item);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [sourceCache, handleCacheError]);

  const get = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('get', { key: abbrevIK(key) });
    if (!sourceCache) {
      return handleCacheError('get');
    }
    const [newCacheMap, item] = await sourceCache.get(key);
    setCacheMap(newCacheMap.clone());
    return item as V | null;
  }, [sourceCache, handleCacheError]);

  const remove = useCallback(async (
    key: PriKey<S>,
  ): Promise<void> => {
    logger.trace('remove', { key: abbrevIK(key) });
    if (!sourceCache) {
      return handleCacheError('remove');
    }
    const newCacheMap = await sourceCache.remove(key);
    setCacheMap(newCacheMap.clone());
  }, [sourceCache, handleCacheError]);

  const retrieve = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('retrieve', { key: abbrevIK(key) });
    if (!sourceCache) {
      return handleCacheError('retrieve');
    }
    const [newCacheMap, item] = await sourceCache.retrieve(key);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return item as V | null;
  }, [sourceCache, handleCacheError]);

  const update = useCallback(async (
    key: PriKey<S>,
    item: TypesProperties<V, S>,
  ): Promise<V> => {
    logger.trace('update', { key: abbrevIK(key), item });
    if (!sourceCache) {
      return handleCacheError('update');
    }
    const [newCacheMap, newItem] = await sourceCache.update(key, item);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [sourceCache, handleCacheError]);

  const action = useCallback(async (
    key: PriKey<S>,
    action: string,
    body?: any,
  ): Promise<V> => {
    logger.trace('action', { key: abbrevIK(key), action, body });
    if (!sourceCache) {
      return handleCacheError('action');
    }
    const [newCacheMap, newItem] = await sourceCache.action(key, action, body);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [sourceCache, handleCacheError]);

  const allAction = useCallback(async (
    action: string,
    body?: any,
  ): Promise<V[] | null> => {
    logger.trace('action', { action, body });
    if (!sourceCache) {
      return handleCacheError('allAction');
    }
    const [newCacheMap, newItems] = await sourceCache.allAction(action, body);
    setCacheMap(newCacheMap.clone());
    return newItems as V[];
  }, [sourceCache, handleCacheError]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<V[] | null> => {
    logger.trace('find', { finder, finderParams });
    if (!sourceCache) {
      return handleCacheError('find');
    }
    const [newCacheMap, newItems] = await sourceCache.find(finder, finderParams);
    setCacheMap(newCacheMap.clone());
    return newItems as V[];
  }, [sourceCache, handleCacheError]);

  const set = useCallback(async (
    key: PriKey<S>,
    item: V,
  ): Promise<V> => {
    logger.trace('set', { key: abbrevIK(key), item });
    if (!sourceCache) {
      return handleCacheError('set');
    }
    const [newCacheMap, newItem] = await sourceCache.set(key, item);
    setCacheMap(newCacheMap.clone());
    return newItem as V;
  }, [sourceCache, handleCacheError]);

  const contextValue: PItemAdapterContextType<V, S> = {
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
    find,
    set,
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
