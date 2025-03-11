/* eslint-disable no-undefined */
import { abbrevIK, Item, ItemQuery, PriKey, TypesProperties } from "@fjell/core";
import React, { createElement, useCallback, useMemo } from "react";
import { PItemAdapterContext, PItemAdapterContextType } from "./PItemAdapterContext";

import LibLogger from '@/logger';
import { AggregateConfig, createAggregator } from "@fjell/cache/dist/src/Aggregator";
import { Cache } from "@fjell/cache/dist/src/Cache";
import { CacheMap } from "@fjell/cache/dist/src/CacheMap";

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
>(
    { name, cache, context, aggregates = {}, events = {}, addActions, children }: {
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
  }
  ) => {

  const pkTypes = useMemo(() => cache.pkTypes, [cache]);
  const logger = LibLogger.get('PItemAdapter', ...pkTypes);

  const [cacheMap, setCacheMap] =
    React.useState<CacheMap<V, S>>(new CacheMap<V, S>(cache.pkTypes));

  const sourceCache = useMemo(() => {
    if (aggregates && Object.keys(aggregates).length > 0) {
      return createAggregator<V, S>(cache, { aggregates, events });
    } else {
      return cache
    }
  }, [cache, aggregates]);

  const all = useCallback(async (
    query?: ItemQuery,
  ): Promise<V[] | null> => {
    logger.trace('all', { query: query && query.toString() });
    if (cache) {
      const [newCacheMap, items] = await sourceCache.all(query);
      setCacheMap(newCacheMap.clone());
      return items as V[] | null;
    } else {
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const one = useCallback(async (
    query?: ItemQuery,
  ): Promise<V | null> => {
    logger.trace('one', { query: query && query.toString() });
    if (cache) {
      const [newCacheMap, item] = await sourceCache.one(query);
      setCacheMap(newCacheMap.clone());
      return item as V | null;
    } else {
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const create = useCallback(async (
    item: TypesProperties<V, S>,
  ): Promise<V> => {
    logger.trace('create', { item });
    if (cache) {
      const [newCacheMap, newItem] = await sourceCache.create(item);
      setCacheMap(newCacheMap.clone());
      return newItem as V;
    } else {
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const get = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('get', { key: abbrevIK(key) });
    // TODO: Add check for valid key
    if (cache) {
      const [newCacheMap, item] = await sourceCache.get(key);
      setCacheMap(newCacheMap.clone());
      return item as V | null;
    } else {
      // TODO: Fix this error message it is misleading
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const remove = useCallback(async (
    key: PriKey<S>,
  ): Promise<void> => {
    logger.trace('remove', { key: abbrevIK(key) });
    // TODO: Add check for valid key
    if (cache) {
      const newCacheMap = await sourceCache.remove(key);
      setCacheMap(newCacheMap.clone());
    } else {
      // TODO: Fix this error message it is misleading
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const retrieve = useCallback(async (
    key: PriKey<S>,
  ): Promise<V | null> => {
    logger.trace('retrieve', { key: abbrevIK(key) });
    // TODO: Add check for valid key
    if (cache) {
      const [newCacheMap, item] = await sourceCache.retrieve(key);
      if (newCacheMap) {
        setCacheMap(newCacheMap.clone());
      }
      return item as V | null;
    } else {
      // TODO: Fix this error message it is misleading
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const update = useCallback(async (
    key: PriKey<S>,
    item: TypesProperties<V, S>,
  ): Promise<V> => {
    logger.trace('update', { key: abbrevIK(key), item });

    if (cache) {
      const [newCacheMap, newItem] = await sourceCache.update(key, item);
      setCacheMap(newCacheMap.clone());
      return newItem as V;
    } else {
      // TODO: Fix this error message it is misleading
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const action = useCallback(async (
    key: PriKey<S>,
    action: string,
    body?: any,
  ): Promise<V> => {
    logger.trace('action', { key: abbrevIK(key), action, body });
    
    if (cache) {
      const [newCacheMap, newItem] = await sourceCache.action(key, action, body);
      setCacheMap(newCacheMap.clone());
      return newItem as V;
    } else {
      // TODO: Fix this error message it is misleading
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const allAction = useCallback(async (
    action: string,
    body?: any,
  ): Promise<V[] | null> => {
    logger.trace('action', { action, body });
    if (cache) {
      const [newCacheMap, newItems] = await sourceCache.allAction(action, body);
      setCacheMap(newCacheMap.clone());
      return newItems as V[];
    } else {
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<V[] | null> => {
    logger.trace('find', { finder, finderParams });
    if (cache) {
      const [newCacheMap, newItems] = await sourceCache.find(finder, finderParams);
      setCacheMap(newCacheMap.clone());
      return newItems as V[];
    } else {
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

  // TODO: This may be temporary, it is related to the fact that the consumer may have a subscription to update events.
  // In fact, this begs the question, should the consumer be subscribing or should the cache be subscribing?
  const set = useCallback(async (
    key: PriKey<S>,
    item: V,
  ): Promise<V> => {
    logger.trace('set', { key: abbrevIK(key), item });
    if (cache) {
      const [newCacheMap, newItem] = await sourceCache.set(key, item);
      setCacheMap(newCacheMap.clone());
      return newItem as V;
    } else {
      logger.error('Cache not initialized in %s', name);
      throw new Error(`Cache not initialized in ${name}`);
    }
  }, [cache]);

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
