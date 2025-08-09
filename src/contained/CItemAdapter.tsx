/* eslint-disable indent */
/* eslint-disable no-undefined */
import LibLogger from "../logger";
import { AggregateConfig, Cache, CacheMap, createAggregator, MemoryCacheMap } from "@fjell/cache";
import {
  abbrevIK, abbrevLKA, abbrevQuery,
  ComKey,
  Item,
  ItemQuery, LocKey, LocKeyArray, PriKey
} from "@fjell/core";
import * as React from "react";
import * as AItem from "../AItem";
import * as AItemAdapter from "../AItemAdapter";
import * as AItems from "../AItems";
import * as Faceted from "../Faceted";

const logger = LibLogger.get('CItemAdapter');

export type ContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = AItemAdapter.ContextType<V, S, L1, L2, L3, L4, L5>;

export type Context<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<ContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useCItemAdapter = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: Context<V, S, L1, L2, L3, L4, L5>, contextName: string):
  ContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};

export const Adapter = <
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
  context: Context<V, S, L1, L2, L3, L4, L5>;
  aggregates?: AggregateConfig;
  events?: AggregateConfig;
  addActions?: (action: AItem.ActionMethod<V, S, L1, L2, L3, L4, L5>) => Record<string, AItem.AddedActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addFacets?: (facet: Faceted.FacetMethod<L1, L2, L3, L4, L5>) => Record<string, Faceted.AddedFacetMethod<L1, L2, L3, L4, L5>>;
  addAllActions?: (allAction: AItems.AllActionMethod<V, S, L1, L2, L3, L4, L5>) => Record<string, AItems.AddedAllActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addAllFacets?: (allFacet: Faceted.AllFacetMethod<L1, L2, L3, L4, L5>) => Record<string, Faceted.AddedFacetMethod<L1, L2, L3, L4, L5>>;
  children: React.ReactNode;
}) => {

  // Validate cache at initialization
  React.useEffect(() => {
    if (!cache) {
      logger.error('Cache is undefined in %s. This will cause all operations to fail.', name);
    }
  }, [cache, name]);

  const pkTypes = React.useMemo(() => cache?.coordinate.kta, [cache]);

  const [cacheMap, setCacheMap] =
    React.useState<CacheMap<V, S, L1, L2, L3, L4, L5>>(new MemoryCacheMap<V, S, L1, L2, L3, L4, L5>(pkTypes));

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

  // State to trigger re-renders when cache events occur
  const [cacheVersion, setCacheVersion] = React.useState(0);

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
      cache: cache?.coordinate.kta,
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    if (!resolvedSourceCache) {
      return handleCacheError('all');
    }
    logger.debug('Fetching Items from sourceCache.all');
    const [newCacheMap, items] = await resolvedSourceCache.operations.all(query, locations);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
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
    const [newCacheMap, item] = await resolvedSourceCache.operations.one(query, locations);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return item as V;
  }, [resolvedSourceCache, handleCacheError]);

  const create = React.useCallback(async (
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ): Promise<V> => {
    logger.trace('create', {
      item,
      locations: abbrevLKA(locations as unknown as Array<LocKey<S | L1 | L2 | L3 | L4 | L5>>),
    });
    if (!resolvedSourceCache) {
      return handleCacheError('create');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache.operations.create(item, locations);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const get = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<V> => {
    logger.trace('get', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      return handleCacheError('get');
    }
    const [newCacheMap, item] = await resolvedSourceCache.operations.get(key);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return item as V;
  }, [resolvedSourceCache, handleCacheError]);

  const remove = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<void> => {
    logger.trace('remove', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      return handleCacheError('remove');
    }
    const newCacheMap = await resolvedSourceCache.operations.remove(key);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
  }, [resolvedSourceCache, handleCacheError]);

  const retrieve = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ): Promise<V> => {
    logger.trace('retrieve', { key: abbrevIK(key) });
    if (!resolvedSourceCache) {
      return handleCacheError('retrieve');
    }
    const [newCacheMap, item] = await resolvedSourceCache.operations.retrieve(key);
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
    return item as V;
  }, [resolvedSourceCache, handleCacheError]);

  const update = React.useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  ): Promise<V> => {
    logger.trace('update', { key: abbrevIK(key), item });
    if (!resolvedSourceCache) {
      return handleCacheError('update');
    }
    const [newCacheMap, newItem] = await resolvedSourceCache.operations.update(key, item);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
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
    const [newCacheMap, newItem] = await resolvedSourceCache.operations.action(key, action, body);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
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
    const [newCacheMap, newItems] = await resolvedSourceCache.operations.allAction(action, body, locations);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
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
    const [newCacheMap, response] = await resolvedSourceCache.operations.facet(key, facet);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
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
    const [newCacheMap, response] = await resolvedSourceCache.operations.allFacet(facet, params);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
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
    const [newCacheMap, newItems] = await resolvedSourceCache.operations.find(finder, finderParams, locations);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
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
    const [newCacheMap, newItem] = await resolvedSourceCache.operations.set(key, item);
    if (newCacheMap) {
      setCacheMap(newCacheMap.clone());
    }
    return newItem as V;
  }, [resolvedSourceCache, handleCacheError]);

  const contextValue: Partial<ContextType<V, S, L1, L2, L3, L4, L5>> = React.useMemo(() => ({
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
    set,
    addActions,
    addFacets,
    addAllActions,
    addAllFacets,
    cacheVersion // Include cacheVersion to trigger re-renders on cache events
  ]);

  return React.createElement(
    context.Provider,
    {
      value: contextValue as ContextType<V, S, L1, L2, L3, L4, L5>,
    },
    children,
  );
}
