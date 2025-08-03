/* eslint-disable no-undefined */
import LibLogger from "../logger";
import {
  AllItemTypeArrays,
  ikToLKA,
  isValidPriKey,
  Item,
  LocKeyArray,
  PriKey,
} from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import * as PItem from "./PItem";
import * as PItemAdapter from "./PItemAdapter";

const logger = LibLogger.get('PItemLoad');

export const PItemLoad = <
  V extends Item<S>,
  S extends string
>({
    name,
    adapter,
    children,
    context,
    contextName,
    ik,
    item: providedItem
  }: {
  name: string;
  // TODO: I want this to be two separate properties.
  adapter: PItemAdapter.Context<V, S>;
  children: React.ReactNode;
  context: PItem.Context<V, S>;
  contextName: string;
  ik?: PriKey<S> | null;
  item?: V | null;
}) => {
  logger.debug(`${name}: Component initialized with props`, {
    name,
    hasAdapter: !!adapter,
    hasChildren: !!children,
    hasContext: !!context,
    ik,
    providedItem
  });

  // const [error, setError] = React.useState<Error | null>(null);
  // if (error) {
  //   throw error;
  // }

  // Validate that both ik and item are not provided at the same time
  if (ik !== undefined && providedItem !== undefined) {
    const errorMessage = `${name}: Cannot provide both 'ik' and 'item' parameters. Please provide only one.`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const [itemKey, setItemKey] = React.useState<PriKey<S> | undefined>(ik ?? undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isRemoving, setIsRemoving] = React.useState<boolean>(false);

  logger.debug(`${name}: Initial state set`, {
    itemKey,
    isLoading,
    isUpdating,
    isRemoving
  });

  // Since we pass this to the actions constructor, don't destructure it yet
  const PItemAdapter = usePItemAdapter<V, S>(adapter, contextName);
  logger.debug(`${name}: PItemAdapter initialized`, { hasAdapter: !!PItemAdapter });

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
  } = PItemAdapter;

  const itemLogger = LibLogger.get('PItemLoad', ...(pkTypes || []));
  logger.debug(`${name}: Item logger created with pkTypes`, { pkTypes });

  const item: V | null = useMemo(() => {
    if (providedItem) {
      return providedItem;
    }
    if (itemKey && isValidPriKey(itemKey)) {
      return (cacheMap?.get(itemKey as PriKey<S>) as V) || null;
    }
    return null;
  }, [itemKey, cacheMap, providedItem]);

  const locations: LocKeyArray<S> | null = useMemo(() => {
    logger.debug(`${name}: Computing locations memoization`, { hasItem: !!item });

    if (item) {
      logger.debug(`${name}: Item exists, converting key to location array`, { itemKey: item.key });
      const result = ikToLKA(item.key) as unknown as LocKeyArray<S>;
      logger.debug(`${name}: Location array computed`, { locations: result });
      return result;
    } else {
      logger.debug(`${name}: No item, returning null locations`);
      return null;
    }
  }, [item])

  useEffect(() => {
    logger.debug(`${name}: useEffect[ik] triggered`, { ik, providedItem });

    if (providedItem) {
      setItemKey(providedItem.key as PriKey<S>);
      setIsLoading(false);
      return;
    }

    if (ik && isValidPriKey(ik)) {
      setItemKey(ik);
      const cachedItem = cacheMap?.get(ik);

      if (!cachedItem) {
        setIsLoading(true); // Set loading to true ONLY when we are about to fetch
        retrieveItem(ik)
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else {
      setItemKey(undefined);
      setIsLoading(false);
    }
  }, [ik, providedItem, cacheMap, retrieveItem]); // Removing cacheMap and retrieveItem from deps

  const remove = useCallback(async () => {
    logger.debug(`${name}: remove() called`, {
      itemKey,
      isValidKey: itemKey ? isValidPriKey(itemKey) : false
    });

    if (itemKey && isValidPriKey(itemKey)) {
      logger.debug(`${name}: Valid key for remove, setting isRemoving to true`, { itemKey });
      setIsRemoving(true);
      try {
        await removeItem(itemKey);
        logger.debug(`${name}: removeItem completed successfully`, { itemKey });
      } catch (error) {
        logger.error(`${name}: Error during item removal`, { itemKey, error });
        throw error;
      } finally {
        setIsRemoving(false);
        logger.debug(`${name}: isRemoving set to false after successful removal`);
      }
    } else {
      logger.debug(`${name}: Invalid itemKey for remove`, { itemKey });
      itemLogger.error(`${name}: Item key is required to remove an item`);
      throw new Error(`Item key is required to remove an item in ${name}`);
    }
  }, [removeItem, itemKey]);

  const update = useCallback(async (
    updateData: Partial<Item<S>>,
  ) => {
    logger.debug(`${name}: update() called`, {
      itemKey,
      isValidKey: itemKey ? isValidPriKey(itemKey) : false,
      hasUpdateData: !!updateData
    });

    if (itemKey && isValidPriKey(itemKey)) {
      logger.debug(`${name}: Valid key for update, setting isUpdating to true`, { itemKey });
      setIsUpdating(true);
      try {
        const retItem = await updateItem(itemKey, updateData);
        logger.debug(`${name}: updateItem completed successfully`, {
          itemKey,
          hasResult: !!retItem,
          resultType: retItem ? typeof retItem : 'undefined'
        });
        return retItem;
      } catch (error) {
        logger.error(`${name}: Error during item update`, { itemKey, updateData, error });
        throw error;
      } finally {
        setIsUpdating(false);
        logger.debug(`${name}: isUpdating set to false after successful update`);
      }
    } else {
      logger.debug(`${name}: Invalid itemKey for update`, { itemKey });
      itemLogger.error(`${name}: Item key is required to update an item`);
      throw new Error(`Item key is required to update an item in ${name}`);
    }
  }, [updateItem, itemKey]);

  const set = useCallback(async (
    item: V
  ) => {
    logger.debug(`${name}: set() called`, {
      itemKey: item.key,
    });
    if (item && item.key) {
      setIsUpdating(true);
      try {
        const retItem = await setItem(item.key as PriKey<S>, item);
        return retItem;
      } finally {
        setIsUpdating(false);
      }
    } else {
      itemLogger.error(`${name}: Item key is required to set an item`);
      throw new Error(`Item key is required to set an item in ${name}`);
    }
  }, [setItem]);

  const action = useCallback(async (
    actionName: string,
    body?: any,
  ) => {
    if (itemKey && isValidPriKey(itemKey)) {
      setIsUpdating(true);
      try {
        return await actionItem(itemKey, actionName, body) as V;
      } finally {
        setIsUpdating(false);
      }
    } else {
      itemLogger.error(`${name}: Item key is required to perform an action`);
      throw new Error(`Item key is required to perform an action in ${name}`);
    }
  }, [actionItem, itemKey]);

  const facet = useCallback(async (
    facetName: string,
    params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
  ) => {
    if (itemKey && isValidPriKey(itemKey)) {
      try {
        return await facetItem(itemKey, facetName, params) as any;
      } catch (error) {
        logger.error(`${name}: Error during facet retrieval`, { itemKey, facetName, error });
        throw error;
      }
    } else {
      itemLogger.error(`${name}: Item key is required to retrieve a facet`);
      throw new Error(`Item key is required to retrieve a facet in ${name}`);
    }
  }, [facetItem, itemKey]);

  const contextValue: PItem.ContextType<V, S> = {
    name,
    key: itemKey as PriKey<S>,
    item,
    isLoading,
    isUpdating,
    isRemoving,
    pkTypes: pkTypes as AllItemTypeArrays<S>,
    remove,
    update,
    action,
    facet,
    set,
    locations,
    facetResults: {},
  };

  contextValue.actions = useMemo(() => addActions && addActions(contextValue.action), [addActions, contextValue.action]);
  contextValue.facets = useMemo(() => addFacets && addFacets(contextValue.facet), [addFacets, contextValue.facet]);

  return createElement(
    context.Provider,
    {
      value: contextValue,
    },
    children,
  );
}
