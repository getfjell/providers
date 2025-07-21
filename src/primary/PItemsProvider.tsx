import { AllItemTypeArrays, Item, PriKey } from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";

import LibLogger from '@/logger';
import * as PItemAdapter from "./PItemAdapter";
import * as PItems from "./PItems";

export const PItemsProvider = <V extends Item<S>, S extends string>(
  {
    name,
    items = [],
    adapter,
    children,
    context,
    contextName,
    renderEach,
    isLoadingParam = false,
    overrides,
  }: {
    name: string;
    items?: V[];
    adapter: PItemAdapter.Context<V, S>;
    addQueries?: (contextValues: PItems.ContextType<V, S>) =>
      Record<string, (...params: any) => Promise<string | boolean | number | null>>;
    children: React.ReactNode;
    context: PItems.Context<V, S>;
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
    action: actionItem,
    facet: facetItem,
    find: findItem,
    findOne: findOneItem,
    addAllActions,
    addAllFacets,
  } = adapterContext;

  const logger = LibLogger.get('PItemsProvider', JSON.stringify(pkTypes));

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

  const create = useCallback(async (item: Partial<Item<S>>) => {
    logger.trace('create', { item });
    setIsCreating(true);
    const result = await createItem(item) as V;
    setIsCreating(false);
    return result;
  }, [createItem]);

  const update = useCallback(async (key: PriKey<S>,
    item: Partial<Item<S>>) => {
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
    try {
      const result = await allItemAction(action, body) as V[] | null;
      return result;
    } finally {
      setIsUpdating(false);
    }
  }, [allItemAction]);

  const allFacet = useCallback(async (facet: string, params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {}) => {
    logger.trace('allFacet', { facet, params });
    setIsUpdating(true);
    try {
      const result = await allItemFacet(facet, params) as any;
      return result;
    } finally {
      setIsUpdating(false);
    }
  }, [allItemFacet]);

  const action = useCallback(async (key: PriKey<S>, action: string, body: any) => {
    logger.trace('action', { key, action, body });
    setIsUpdating(true);
    try {
      const result = await actionItem(key, action, body) as V;
      return result;
    } finally {
      setIsUpdating(false);
    }
  }, [actionItem]);

  const facet = useCallback(async (key: PriKey<S>, facet: string, params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {}) => {
    logger.trace('facet', { key, facet, params });
    setIsUpdating(true);
    try {
      const result = await facetItem(key, facet, params) as any;
      return result;
    } finally {
      setIsUpdating(false);
    }
  }, [facetItem]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => {
    return findItem(finder, finderParams);
  }, [findItem]);

  const findOne = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => {
    return findOneItem && findOneItem(finder, finderParams);
  }, [findOneItem]);

  const set = useCallback(async (key: PriKey<S>, item: V) => {
    logger.trace('set', { key, item });
    const result = await setItem(key, item) as V;
    return result;
  }, [setItem]);

  const contextValue: PItems.ContextType<V, S> = {
    name,
    pkTypes: pkTypes as AllItemTypeArrays<S>,
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

  contextValue.allActions = useMemo(() => addAllActions && addAllActions(contextValue.allAction), [addAllActions, contextValue.allAction]);
  contextValue.allFacets = useMemo(() => addAllFacets && addAllFacets(contextValue.allFacet), [addAllFacets, contextValue.allFacet]);

  return createElement(
    context.Provider,
    {
      value: contextValue,
    },
    (
      <>
        {renderEach && items && items.map((item) => renderEach(item))}
        {children}
      </>
    ));
}
