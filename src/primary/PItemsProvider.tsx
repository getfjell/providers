
import { Item, PriKey, TypesProperties } from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";

import LibLogger from '@/logger';
import { PItemAdapterContext } from "./PItemAdapterContext";
import { PItemsContext, PItemsContextType } from "./PItemsContext";

export const PItemsProvider = <V extends Item<S>, S extends string>(
  {
    name,
    items = [],
    adapter,
    addQueries = () => ({}),
    children,
    context,
    contextName,
    renderEach,
    isLoadingParam = false,
    overrides,
  }: {
    name: string;
    items?: V[];
    adapter: PItemAdapterContext<V, S>;
    addQueries?: (contextValues: PItemsContextType<V, S>) =>
      Record<string, (...params: any) => Promise<string | boolean | number | null>>;
    children: React.ReactNode;
    context: PItemsContext<V, S>;
    contextName: string;
    renderEach?: (item: V) => React.ReactNode;
    isLoadingParam?: boolean;
    overrides?: {
      all?: () => Promise<V[] | null>;
      one?: () => Promise<V | null>;
    };
  }
) => {

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isRemoving, setIsRemoving] = React.useState<boolean>(false);

  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = usePItemAdapter<V, S>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    pkTypes,
    all: allItems,
    one: oneItem,
    create: createItem,
    update: updateItem,
    remove: removeItem,
    allAction: allItemAction,
    allFacet: allItemFacet,
    set: setItem,
    addAllActions,
    addAllFacets,
  } = useMemo(() => adapterContext, [adapterContext]);

  const logger = LibLogger.get('PItemsProvider', ...pkTypes);

  useEffect(() => {
    setIsLoading(isLoadingParam);
  }, [isLoadingParam]);

  const all = useCallback(async () => {
    logger.trace('all');
    setIsLoading(true);
    const items = await allItems({}) as V[] | null;
    setIsLoading(false);
    logger.debug('Items Returned for All', { items });
    return items;
  }, [allItems]);

  const one = useCallback(async () => {
    logger.trace('one');
    setIsLoading(true);
    const item = await oneItem({}) as V | null;
    setIsLoading(false);
    return item;
  }, [oneItem]);

  const create = useCallback(async (item: TypesProperties<V, S>) => {
    logger.trace('create', { item });
    setIsCreating(true);
    const result = await createItem(item) as V;
    setIsCreating(false);
    return result;
  }, [createItem]);

  const update = useCallback(async (key: PriKey<S>,
    item: TypesProperties<V, S>) => {
    logger.trace('update', { key, item });
    setIsUpdating(true);
    const result = await updateItem(key, item) as V;
    setIsUpdating(false);
    return result;
  }, [updateItem]);

  const remove = useCallback(async (key: PriKey<S>) => {
    logger.trace('remove', { key });
    setIsRemoving(true);
    const result = await removeItem(key);
    setIsRemoving(false);
    return result;
  }, [removeItem]);

  const allAction = useCallback(async (action: string, body: any = {}) => {
    logger.trace('allAction', { action, body });
    setIsUpdating(true);
    const result = await allItemAction(action, body) as V[] | null;
    setIsUpdating(false);
    return result;
  }, [allItemAction]);

  const allFacet = useCallback(async (facet: string, params: any = {}) => {
    logger.trace('allFacet', { facet, params });
    setIsUpdating(true);
    const result = await allItemFacet(facet, params) as any;
    setIsUpdating(false);
    return result;
  }, [allItemFacet]);

  const action = useCallback(async (key: PriKey<S>, action: string, body: any) => {
    logger.trace('action', { key, action, body });
    setIsUpdating(true);
    const result = await adapterContext.action(key, action, body) as V;
    setIsUpdating(false);
    return result;
  }, [adapterContext]);

  const facet = useCallback(async (key: PriKey<S>, facet: string, params: any) => {
    logger.trace('facet', { key, facet, params });
    setIsUpdating(true);
    const result = await adapterContext.facet(key, facet, params) as any;
    setIsUpdating(false);
    return result;
  }, [adapterContext]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => {
    return adapterContext.find(finder, finderParams);
  }, [adapterContext]);

  const findOne = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => {
    return adapterContext.findOne(finder, finderParams);
  }, [adapterContext]);

  const set = useCallback(async (key: PriKey<S>, item: V) => {
    logger.trace('set', { key, item });
    const result = await setItem(key, item) as V;
    return result;
  }, [setItem]);

  const contextValue: PItemsContextType<V, S> = {
    name,
    pkTypes,
    items,
    isLoading,
    isCreating,
    isUpdating,
    isRemoving,
    create,
    update,
    remove,
    all: overrides?.all || all,
    one: overrides?.one || one,
    allAction,
    allFacet,
    find,
    findOne,
    set,
    action,
    facet,
  };

  if (addAllActions && contextValue) {
    contextValue.allActions = addAllActions(contextValue);
    logger.debug(`${name}: Custom actions added`, {
      actionCount: contextValue.allActions ? Object.keys(contextValue.allActions).length : 0,
      actionNames: contextValue.allActions ? Object.keys(contextValue.allActions) : []
    });
  };

  if (addAllFacets && contextValue) {
    contextValue.allFacets = addAllFacets(contextValue);
    logger.debug(`${name}: Custom facets added`, {
      facetCount: contextValue.allFacets ? Object.keys(contextValue.allFacets).length : 0,
      facetNames: contextValue.allFacets ? Object.keys(contextValue.allFacets) : []
    });
  };

  contextValue.queries = useMemo(() =>
    addQueries(contextValue as PItemsContextType<V, S>), [adapterContext, contextValue]);

  return createElement(
    context.Provider,
    {
      value: contextValue as PItemsContextType<V, S>,
    },
    (
      <>
        {renderEach && items && items.map((item) => renderEach(item))}
        {children}
      </>
    ));
}
