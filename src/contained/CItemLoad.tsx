/* eslint-disable no-undefined */
import * as AItem from "../AItem";
import LibLogger from "../logger";
import {
  abbrevIK,
  ComKey,
  ikToLKA,
  isComKey,
  isValidComKey,
  Item,
  LocKey,
  LocKeyArray,
  OperationParams,
  PriKey,
} from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";
import * as CItemAdapter from "./CItemAdapter";
import * as CItem from "./CItem";
import * as Faceted from "../Faceted";
import { useAsyncError } from "../useAsyncError";

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
      item: providedItem,
      parent,
      parentContextName,
    }: {
    name: string;
    adapter: CItemAdapter.Context<V, S, L1, L2, L3, L4, L5>;
    children: React.ReactNode;
    context: CItem.Context<V, S, L1, L2, L3, L4, L5>;
    contextName: string;
    ik?: ComKey<S, L1, L2, L3, L4, L5> | null;
    item?: V | null;
    parent: AItem.Context<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>;
    parentContextName: string;
  }
  ) => {

  const { throwAsyncError } = useAsyncError();

  // Validate that both ik and item are not provided at the same time
  if (ik !== undefined && providedItem !== undefined) {
    const errorMessage = `${name}: Cannot provide both 'ik' and 'item' parameters. Please provide only one.`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const [itemKey, setItemKey] = React.useState<ComKey<S, L1, L2, L3, L4, L5> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(providedItem !== undefined ? false : true);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isRemoving, setIsRemoving] = React.useState<boolean>(false);

  // Since we pass this to the actions constructor, don't destructure it yet
  const cItemAdapter = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    pkTypes,
    retrieve: retrieveItem,
    remove: removeItem,
    update: updateItem,
    action: actionItem,
    facet: facetItem,
    set: setCacheItem,
    addActions,
    addFacets,
  } = cItemAdapter;

  const parentItemAdapter = AItem.useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    item: parentItem,
    locations: parentLocations,
  } = useMemo(() => parentItemAdapter, [parentItemAdapter]);

  const [item, setItemState] = React.useState<V | null>(null);

  const locations: LocKeyArray<S, L1, L2, L3, L4> | null = useMemo(() => {
    if (!item) {
      return null;
    }
    // For composite items, combine parent locations with the current item's location
    // Location arrays must be ordered: immediate parent FIRST, root LAST
    // The current item is the immediate parent for any child items
    if (parentLocations && isComKey(item.key)) {
      const itemLocKey = { kt: item.key.kt, lk: item.key.pk } as LocKey<S>;
      // Prepend the current item (immediate parent) to parent locations (ancestors)
      return [itemLocKey, ...parentLocations] as unknown as LocKeyArray<S, L1, L2, L3, L4>;
    } else {
      // Fallback to item's own location keys if no parent locations available
      // For primary keys, ikToLKA returns [{ kt: itemType, lk: itemId }]
      return ikToLKA(item.key);
    }
  }, [item, parentLocations])

  // Set item key from ik or provided item
  useEffect(() => {
    logger.trace('useEffect[ik]', { ik, providedItem });

    // If a providedItem is supplied, extract the key from it
    if (providedItem !== undefined) {
      if (providedItem && providedItem.key) {
        logger.debug('Using key from provided item', { itemKey: providedItem.key });
        setItemKey(providedItem.key as ComKey<S, L1, L2, L3, L4, L5>);
      } else {
        logger.debug('Provided item is null or has no key');
        setItemKey(undefined);
      }
      return;
    }

    if (ik) {
      if (isComKey(ik)) {
        logger.debug('Key has been provided', { ik });
        setItemKey(ik);
      } else {
        const errorMessage = `${name}: Key is not a ComKey`;
        logger.error(errorMessage, { ik });
        setIsLoading(false);
        throwAsyncError(new Error(errorMessage));
      }
    } else {
      logger.debug('No item key was provided, no item will be retrieved', { ik });
      setIsLoading(false);
      setItemKey(undefined);
    }
  }, [ik, providedItem]);

  // Load item from cache or use provided item (consolidated effect)
  useEffect(() => {
    // If a providedItem is supplied, use it directly and skip cache retrieval
    if (providedItem !== undefined) {
      logger.debug('Using provided item directly', { providedItem });
      setItemState(providedItem);
      setIsLoading(false);
      setIsUpdating(false);
      setIsRemoving(false);
      return;
    }

    // We only call the cache if the key is valid.  If we don't do this we end up driving up errors
    // And here's the explanation, there are cases where you don't have a valid key, and a null result is expected
    // if we don't do this we end up with making a request to the server we know will fail.
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      (async () => {
        try {
          logger.trace('useEffect[itemKey]', { itemKey: abbrevIK(itemKey) });
          setIsLoading(true);
          const retrievedItem = await retrieveItem(itemKey);
          setItemState(retrievedItem as V | null);
          setIsLoading(false);
          setIsUpdating(false);
          setIsRemoving(false);
        } catch (error) {
          logger.error(`${name}: Error retrieving item`, error);
          setItemState(null);
          setIsLoading(false);
          setIsUpdating(false);
          setIsRemoving(false);
          throwAsyncError(error as Error);
        }
      })();
    } else {
      setItemState(null);
      setIsLoading(false);
      setIsUpdating(false);
      setIsRemoving(false);
    }
  }, [itemKey, providedItem, retrieveItem, name]);

  const remove = useCallback(async () => {
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      setIsRemoving(true);
      try {
        logger.trace('remove', { ik: abbrevIK(itemKey) });
        await removeItem(itemKey);
      } catch (error) {
        logger.error(`${name}: Error removing item`, error);
        throw error;
      } finally {
        setIsRemoving(false);
      }
    } else {
      const errorMessage = itemKey ? `${name}: Invalid item key provided for remove` : `${name}: No item key provided for remove`;
      logger.error(errorMessage, { itemKey });
      throw new Error(errorMessage);
    }
  }, [removeItem, itemKey, name]);

  const update = useCallback(async (item: Partial<Item<S, L1, L2, L3, L4, L5>>): Promise<V> => {
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      if (item) {
        setIsUpdating(true);
        try {
          logger.trace('update', { itemKey: abbrevIK(itemKey), item });
          const retItem = await updateItem(itemKey, item) as V;
          return retItem;
        } catch (error) {
          logger.error(`${name}: Error updating item`, error);
          throw error;
        } finally {
          setIsUpdating(false);
        }
      } else {
        const errorMessage = `${name}: No item provided for update`;
        throw new Error(errorMessage);
      }
    } else {
      const errorMessage = itemKey ? `${name}: Invalid item key provided for update` : `${name}: No item key provided for update`;
      logger.error(errorMessage, { itemKey });
      throw new Error(errorMessage);
    }
  }, [updateItem, itemKey, name]);

  const set = useCallback(async (item: V): Promise<V> => {
    logger.trace("set", { item });
    if (item && isValidComKey(item.key as ComKey<S, L1, L2, L3, L4, L5>)) {
      const retItem = await setCacheItem(item.key, item);
      return retItem as V;
    } else {
      const errorMessage = !item ? `${name}: No item provided to set` : `${name}: Invalid or missing key in item provided to set`;
      logger.error(errorMessage, { item });
      throw new Error(errorMessage);
    }
  }, [setCacheItem, name]);

  const action = useCallback(async (
    actionName: string,
    params?: OperationParams,
  ): Promise<[V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> => {
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      setIsUpdating(true);
      try {
        logger.trace('action', { itemKey: abbrevIK(itemKey), actionName, params });
        const retItem = await actionItem(itemKey, actionName, params);
        return retItem;
      } catch (error) {
        logger.error(`${name}: Error executing action '${actionName}'`, error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    } else {
      const errorMessage = itemKey ? `${name}: Invalid item key provided for action '${actionName}'` : `${name}: No item key provided for action '${actionName}'`;
      logger.error(errorMessage, { itemKey, actionName });
      throw new Error(errorMessage);
    }
  }, [actionItem, itemKey, name]);

  const facet = useCallback(async (
    facetName: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ): Promise<any | null> => {
    if (itemKey && isValidComKey(itemKey as ComKey<S, L1, L2, L3, L4, L5>)) {
      setIsUpdating(true);
      try {
        logger.trace('facet', { itemKey: abbrevIK(itemKey), facetName, params });
        const response = await facetItem(itemKey, facetName, params) as any;

        // Log response for debugging
        logger.debug(`${name}: Facet '${facetName}' response received`, {
          facetName,
          responseType: typeof response,
          isNull: response === null,
          isUndefined: response === undefined,
          isEmptyObject: response && typeof response === 'object' && Object.keys(response).length === 0,
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : []
        });

        return response;
      } catch (error: any) {
        // Provide better error information
        const errorMessage = error?.message || String(error);
        const errorDetails = {
          facetName,
          itemKey: abbrevIK(itemKey),
          params,
          errorType: error?.constructor?.name || typeof error,
          errorMessage,
          errorString: String(error),
          errorKeys: error && typeof error === 'object' ? Object.keys(error) : []
        };
        logger.error(`${name}: Error executing facet '${facetName}'`, errorDetails);

        // Re-throw with better context if possible
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(`Error executing facet '${facetName}': ${errorMessage}`);
        }
      } finally {
        setIsUpdating(false);
      }
    } else {
      const errorMessage = itemKey ? `${name}: Invalid item key provided for facet '${facetName}'` : `${name}: No item key provided for facet '${facetName}'`;
      logger.error(errorMessage, { itemKey, facetName });
      throw new Error(errorMessage);
    }
  }, [facetItem, itemKey, name]);

  const contextValue: CItem.ContextType<V, S, L1, L2, L3, L4, L5> = {
    name,
    key: itemKey as ComKey<S, L1, L2, L3, L4, L5>,
    item,
    parentItem: parentItem as Item<L1, L2, L3, L4, L5>,
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
    facetResults: {},
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
  contextValue.facets = useMemo(() => addFacets && addFacets(contextValue.facet as Faceted.FacetMethod<L1, L2, L3, L4, L5>), [addFacets, contextValue.facet]);

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
