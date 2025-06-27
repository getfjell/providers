/* eslint-disable no-undefined */
import LibLogger from "@/logger";
import {
  ikToLKA,
  isPriKey,
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
    ik
  }: {
  name: string;
  // TODO: I want this to be two separate properties.
  adapter: PItemAdapter.Context<V, S>;
  children: React.ReactNode;
  context: PItem.Context<V, S>;
  contextName: string;
  ik: PriKey<S> | null;
}) => {
  logger.debug(`${name}: Component initialized with props`, {
    name,
    hasAdapter: !!adapter,
    hasChildren: !!children,
    hasContext: !!context,
    ik
  });

  const [itemKey, setItemKey] = React.useState<PriKey<S> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
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

  const itemLogger = LibLogger.get('PItemLoad', ...pkTypes);
  logger.debug(`${name}: Item logger created with pkTypes`, { pkTypes });

  const item: V | null = useMemo(() => {
    logger.debug(`${name}: Computing item memoization`, { itemKey, hasCacheMap: !!cacheMap });

    let item: V | null = null;
    // We only make a call to the cache if the key is valid.  If we don't do this we end up driving up errors
    // And here's the explanation, there are cases where you don't have a valid key, and a null result is expected
    // if we don't catch this here, what we end up with is making a request to the server we know will fail.
    if (itemKey && isValidPriKey(itemKey)) {
      logger.debug(`${name}: Valid item key found, checking cache`, { itemKey });
      item = cacheMap && cacheMap.get(itemKey as PriKey<S>) as V | null;
      logger.debug(`${name}: Cache lookup result`, {
        itemKey,
        foundInCache: !!item,
        itemType: item ? typeof item : 'null'
      });

      logger.debug(`${name}: Setting loading states to false after cache lookup`);
      setIsLoading(false);
      setIsUpdating(false);
      setIsRemoving(false);

      logger.debug(`${name}: Returning cached item`, { item: !!item });
      return item as V | null;
    } else {
      logger.debug(`${name}: Invalid or missing item key, returning null`, {
        itemKey,
        isValid: itemKey ? isValidPriKey(itemKey) : false
      });

      logger.debug(`${name}: Setting loading states to false after invalid key`);
      setIsLoading(false);
      setIsUpdating(false);
      setIsRemoving(false);

      return null;
    }
  }, [itemKey, cacheMap]);

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
    itemLogger.trace('useEffect[ik]', { ik });
    logger.debug(`${name}: useEffect[ik] triggered`, { ik, previousIk: undefined });

    if (ik) {
      logger.debug(`${name}: ik provided, checking if it's a valid PriKey`, { ik });
      // TODO: We don't just check to see if the key is a PriKey, we check to see if the PK is defined
      if (isPriKey(ik) && ik.pk) {
        itemLogger.debug(`${name}: Key has been provided`, { ik });
        logger.debug(`${name}: Valid PriKey with pk, setting itemKey`, { ik });
        setItemKey(ik as PriKey<S>);
        logger.debug(`${name}: itemKey state updated`, { newItemKey: ik });
      } else {
        // TODO: If we get here log a debug message, but don't fail.
        itemLogger.debug(`${name}: Key is either not a PriKey or a PK is not defined`, { ik });
        logger.debug(`${name}: Invalid key or missing pk, setting loading to false`, {
          isPriKeyCheck: isPriKey(ik),
          hasPk: ik && typeof ik === 'object' && 'pk' in ik ? !!ik.pk : false
        });
        setIsLoading(false);
      }
    } else {
      itemLogger.debug(`${name}: No item key was provided, no item will be retrieved`, { ik });
      logger.debug(`${name}: No ik provided, setting loading to false`);
      setIsLoading(false);
    }
  }, [ik]);

  useEffect(() => {
    logger.debug(`${name}: useEffect[itemKey] triggered`, { itemKey });

    // TODO: We check to see not only that the itemKey is defined, but that the PK is defined if it is a PriKey
    if (itemKey && isValidPriKey(itemKey) && itemKey.pk) {
      logger.debug(`${name}: Valid itemKey with pk, initiating retrieval`, { itemKey });

      (async () => {
        itemLogger.debug(`${name}: useEffect[itemKey]`, { itemKey });
        logger.debug(`${name}: Starting async item retrieval`, { itemKey });

        try {
          const result = await retrieveItem(itemKey);
          logger.debug(`${name}: Item retrieval completed`, {
            itemKey,
            retrievalResult: !!result,
            resultType: result ? typeof result : 'undefined'
          });
        } catch (error) {
          logger.error(`${name}: Error during item retrieval`, { itemKey, error });
        }
      })();
    } else {
      logger.debug(`${name}: Skipping retrieval - invalid itemKey or missing pk`, {
        itemKey,
        isValid: itemKey ? isValidPriKey(itemKey) : false,
        hasPk: itemKey && 'pk' in itemKey ? !!itemKey.pk : false
      });
    }
  }, [itemKey]);

  const remove = useCallback(async () => {
    itemLogger.trace("remove");
    logger.debug(`${name}: remove() called`, { itemKey, isValidKey: itemKey ? isValidPriKey(itemKey) : false });

    if (itemKey && isValidPriKey(itemKey)) {
      logger.debug(`${name}: Valid key for removal, setting isRemoving to true`, { itemKey });
      setIsRemoving(true);

      try {
        logger.debug(`${name}: Calling removeItem`, { itemKey });
        const result = await removeItem(itemKey);
        logger.debug(`${name}: removeItem completed successfully`, { itemKey, result });
        setIsRemoving(false);
        logger.debug(`${name}: isRemoving set to false after successful removal`);
      } catch (error) {
        logger.error(`${name}: Error during item removal`, { itemKey, error });
        setIsRemoving(false);
        throw error;
      }
    } else {
      logger.debug(`${name}: Invalid itemKey for removal`, { itemKey });
      setIsRemoving(false);
      itemLogger.error(`${name}: Item key is required to remove an item`);
      throw new Error(`Item key is required to remove an item in ${name}`);
    }
  }, [removeItem, itemKey]);

  const update = useCallback(async (item: Partial<Item<S>>) => {
    itemLogger.trace("update", { item });
    logger.debug(`${name}: update() called`, {
      itemKey,
      hasItem: !!item,
      isValidKey: itemKey ? isValidPriKey(itemKey) : false
    });

    if (itemKey && isValidPriKey(itemKey)) {
      if (item) {
        logger.debug(`${name}: Valid key and item for update, setting isUpdating to true`, { itemKey });
        setIsUpdating(true);

        try {
          logger.debug(`${name}: Calling updateItem`, { itemKey, item });
          const retItem = await updateItem(itemKey, item);
          logger.debug(`${name}: updateItem completed successfully`, {
            itemKey,
            hasResult: !!retItem,
            resultType: retItem ? typeof retItem : 'undefined'
          });
          setIsUpdating(false);
          logger.debug(`${name}: isUpdating set to false after successful update`);
          return retItem as V;
        } catch (error) {
          logger.error(`${name}: Error during item update`, { itemKey, item, error });
          setIsUpdating(false);
          throw error;
        }
      } else {
        logger.debug(`${name}: No item provided for update`);
        setIsUpdating(false);
        itemLogger.error(`${name}: Non-null Item is required to update an item`);
        throw new Error(`Non-null Item is required to update an item in ${name}`);
      }
    } else {
      logger.debug(`${name}: Invalid itemKey for update`, { itemKey });
      itemLogger.error(`${name}: Item key is required to update an item`);
      throw new Error(`Item key is required to update an item in ${name}`);
    }
  }, [updateItem, itemKey]);

  const set = useCallback(async (item: V): Promise<V> => {
    itemLogger.trace("set", { item });
    logger.debug(`${name}: set() called`, {
      hasItem: !!item,
      itemKey: item ? item.key : undefined,
      isValidItemKey: item ? isValidPriKey(item.key) : false
    });

    if (item && isValidPriKey(item.key)) {
      try {
        logger.debug(`${name}: Valid item and key for set operation`, { itemKey: item.key });
        const retItem = await setItem(item.key, item);
        logger.debug(`${name}: setItem completed successfully`, {
          itemKey: item.key,
          hasResult: !!retItem,
          resultType: retItem ? typeof retItem : 'undefined'
        });
        return retItem as V;
      } catch (error) {
        logger.error(`${name}: Error during item set`, { itemKey: item.key, item, error });
        throw error;
      }
    } else {
      logger.debug(`${name}: Invalid item or key for set operation`, {
        hasItem: !!item,
        itemKey: item ? item.key : undefined
      });
      itemLogger.error(`${name}: Item key is required to set an item`);
      throw new Error(`Item key is required to set an item in ${name}`);
    }
  }, [setItem, itemKey]);

  const action = useCallback(async (
    actionName: string,
    body?: any,
  ) => {
    itemLogger.trace("action", { actionName, body });
    logger.debug(`${name}: action() called`, {
      actionName,
      hasBody: body !== undefined,
      bodyType: typeof body,
      itemKey,
      isValidKey: itemKey ? isValidPriKey(itemKey) : false
    });

    if (itemKey && isValidPriKey(itemKey)) {
      logger.debug(`${name}: Valid key for action, setting isUpdating to true`, { itemKey, actionName });
      setIsUpdating(true);

      try {
        logger.debug(`${name}: Calling actionItem`, { itemKey, actionName, body });
        const retItem = await actionItem(itemKey, actionName, body);
        logger.debug(`${name}: actionItem completed successfully`, {
          itemKey,
          actionName,
          hasResult: !!retItem,
          resultType: retItem ? typeof retItem : 'undefined'
        });
        setIsUpdating(false);
        logger.debug(`${name}: isUpdating set to false after successful action`);
        return retItem as V;
      } catch (error) {
        logger.error(`${name}: Error during action execution`, { itemKey, actionName, body, error });
        setIsUpdating(false);
        throw error;
      }
    } else {
      logger.debug(`${name}: Invalid itemKey for action`, { itemKey, actionName });
      setIsUpdating(false);
      itemLogger.error(`${name}: Item key is required to perform an action`);
      throw new Error(`Item key is required to perform an action in ${name}`);
    }
  }, [actionItem, itemKey]);

  const facet = useCallback(async (
    facetName: string,
    params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
  ) => {
    itemLogger.trace("facet", { facetName });
    logger.debug(`${name}: facet() called`, {
      facetName,
      itemKey,
      isValidKey: itemKey ? isValidPriKey(itemKey) : false
    });

    if (itemKey && isValidPriKey(itemKey)) {

      try {
        logger.debug(`${name}: Calling facetItem`, { itemKey, facetName });
        const response = await facetItem(itemKey, facetName, params);
        logger.debug(`${name}: facetItem completed successfully`, {
          itemKey,
          facetName,
          hasResult: !!response,
          resultType: response ? typeof response : 'undefined'
        });
        return response as any;
      } catch (error) {
        logger.error(`${name}: Error during facet retrieval`, { itemKey, facetName, error });
        setIsUpdating(false);
        throw error;
      }
    } else {
      logger.debug(`${name}: Invalid itemKey for facet`, { itemKey, facetName });
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

  contextValue.actions = useMemo(() => addActions && addActions(contextValue.action), [addActions, contextValue.action]);
  contextValue.facets = useMemo(() => addFacets && addFacets(contextValue.facet), [addFacets, contextValue.facet]);

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
