/* eslint-disable no-undefined */
import { AItemContext } from "@/AItemContext";
import { useAItem } from "@/AItemProvider";
import LibLogger from "@/logger";
import {
  abbrevIK,
  ComKey,
  ikToLKA,
  isComKey,
  isValidComKey,
  Item,
  LocKeyArray,
  TypesProperties
} from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";
import { CItemAdapterContext } from "./CItemAdapterContext";
import { CItemContext, CItemContextType } from "./CItemContext";

// TODO: ALign the null iks and debugging statement changes made on 9/12 in PItemProvider with this.
const logger = LibLogger.get('CItemLoad');

export const CItemLoad = <
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
      children,
      context,
      contextName,
      ik,
      parent,
      parentContextName,
    }: {
    name: string;
    adapter: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>;
    children: React.ReactNode;
    context: CItemContext<V, S, L1, L2, L3, L4, L5>;
    contextName: string;
    ik: ComKey<S, L1, L2, L3, L4, L5> | null;
    parent: AItemContext<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>;
    parentContextName: string;
  }
  ) => {

  const [error, setError] = React.useState<Error | null>(null);
  if (error) {
    throw error;
  }

  const [itemKey, setItemKey] = React.useState<ComKey<S, L1, L2, L3, L4, L5> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isRemoving, setIsRemoving] = React.useState<boolean>(false);

  // Since we pass this to the actions constructor, don't destructure it yet
  const cItemAdapter = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    cacheMap,
    pkTypes,
    retrieve: retrieveItem,
    remove: removeItem,
    update: updateItem,
    action: actionItem,
    facet: facetItem,
    set: setItem,
    addActions,
    addFacets,
  } = useMemo(() => cItemAdapter, [cItemAdapter]);

  const parentItemAdapter = useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    item: parentItem,
  } = useMemo(() => parentItemAdapter, [parentItemAdapter]);

  const item: V | null = useMemo(() => {
    // We only call the cache if the key is valid.  If we don't do this we end up driving up errors
    // And here's the explanation, there are cases where you don't have a valid key, and a null result is expected
    // if we don't do this we end up with making a request to the server we know will fail.
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      const item = cacheMap && cacheMap.get(itemKey as ComKey<S, L1, L2, L3, L4, L5>);
      setIsLoading(false);
      setIsUpdating(false);
      setIsRemoving(false);
      return item as V | null;
    } else {
      setIsLoading(false);
      setIsUpdating(false);
      setIsRemoving(false);
      return null;
    }
  }, [itemKey, cacheMap]);

  const locations: LocKeyArray<S, L1, L2, L3, L4> | null = useMemo(() => {
    if (item) {
      return ikToLKA(item.key);
    } else {
      return null;
    }
  }, [item])

  useEffect(() => {
    logger.trace('useEffect[ik]', { ik });
    if (ik) {
      if (isComKey(ik)) {
        logger.debug('Key has been provided', { ik });
        setItemKey(ik);
      } else {
        logger.error('Key is not a ComKey', { ik });
        setIsLoading(false);
        setError(new Error('Key is not a ComKey'));
      }
    } else {
      logger.debug('No item key was provided, no item will be retrieved', { ik });
      setIsLoading(false);
    }
  }, [ik]);

  useEffect(() => {
    // TODO: Probably need exception handling here
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      (async () => {
        logger.trace('useEffect[itemKey]', { itemKey: abbrevIK(itemKey) });
        await retrieveItem(itemKey);
        setIsLoading(false);
      })();
    }
  }, [itemKey]);

  const remove = useCallback(async () => {
    // TODO: Probably need exception handling here
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      setIsRemoving(true);
      logger.trace('remove', { ik: abbrevIK(itemKey) });
      await removeItem(itemKey);
      setIsRemoving(false);
    } else {
      setIsRemoving(false);
      setError(new Error('No item key provided for remove'));
    }
  }, [removeItem, itemKey]);

  const update = useCallback(async (item: TypesProperties<V, S, L1, L2, L3, L4, L5>): Promise<V> => {
    // TODO: Probably need exception handling here
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      if (item) {
        setIsUpdating(true);
        logger.trace('update', { itemKey: abbrevIK(itemKey), item });
        const retItem = await updateItem(itemKey, item) as V;
        setIsUpdating(false);
        return retItem;
      } else {
        setIsUpdating(false);
        setError(new Error('No item provided for update'));
        throw new Error('No item provided for update');
      }
    } else {
      setIsUpdating(false);
      setError(new Error('No item key provided for update'));
      throw new Error('No item key provided for update');
    }
  }, [updateItem, itemKey]);

  const set = useCallback(async (item: V): Promise<V> => {
    logger.trace("set", { item });
    if (item && isValidComKey(item.key as ComKey<S, L1, L2, L3, L4, L5>)) {
      const retItem = await setItem(item.key, item);
      return retItem as V;
    } else {
      logger.error(`${name}: Item key is required to set an item`);
      throw new Error(`Item key is required to set an item in ${name}`);
    }
  }, [setItem, itemKey]);

  const action = useCallback(async (
    actionName: string,
    body?: any,
  ): Promise<V> => {
    // TODO: Probably need exception handling here
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      setIsUpdating(true);
      logger.trace('action', { itemKey: abbrevIK(itemKey), actionName, body });
      const retItem = await actionItem(itemKey, actionName, body) as V;
      setIsUpdating(false);
      return retItem;
    } else {
      setIsUpdating(false);
      setError(new Error('No item key provided for action'));
      throw new Error('No item key provided for action');
    }
  }, [cItemAdapter, itemKey]);

  const facet = useCallback(async (
    facetName: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<any | null> => {
    // TODO: Probably need exception handling here
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      setIsUpdating(true);
      logger.trace('facet', { itemKey: abbrevIK(itemKey), facetName });
      const response = await facetItem(itemKey, facetName, params) as any;
      setIsUpdating(false);
      return response;
    } else {
      setIsUpdating(false);
      setError(new Error('No item key provided for action'));
      return null;
    }
  }, [cItemAdapter, itemKey]);

  const contextValue: CItemContextType<V, S, L1, L2, L3, L4, L5> = {
    name,
    key: itemKey as ComKey<S, L1, L2, L3, L4, L5>,
    item,
    parentItem: parentItem as Item<L1, L2, L3, L4, L5> | null,
    isLoading,
    isUpdating,
    isRemoving,
    pkTypes,
    remove,
    update,
    action,
    facet,
    set,
    locations,
  };

  logger.debug(`${name}: Context value created`, {
    name: contextValue.name,
    hasKey: !!contextValue.key,
    hasItem: !!contextValue.item,
    isLoading: contextValue.isLoading,
    isUpdating: contextValue.isUpdating,
    isRemoving: contextValue.isRemoving,
    pkTypes: contextValue.pkTypes,
    hasLocations: !!contextValue.locations
  });

  if (addActions && contextValue) {
    logger.debug(`${name}: Adding custom actions to context`);
    contextValue.actions = addActions(contextValue);
    logger.debug(`${name}: Custom actions added`, {
      actionCount: contextValue.actions ? Object.keys(contextValue.actions).length : 0,
      actionNames: contextValue.actions ? Object.keys(contextValue.actions) : []
    });
  }

  if (addFacets && contextValue) {
    logger.debug(`${name}: Adding custom facets to context`);
    contextValue.facets = addFacets(contextValue);
    logger.debug(`${name}: Custom facets added`, {
      facetCount: contextValue.facets ? Object.keys(contextValue.facets).length : 0,
      facetNames: contextValue.facets ? Object.keys(contextValue.facets) : []
    });
  }

  logger.debug(`${name}: Creating context provider element`, {
    hasContext: !!context,
    hasChildren: !!children
  });

  return createElement(
    context.Provider,
    {
      value: contextValue,
    },
    children,
  );
}
