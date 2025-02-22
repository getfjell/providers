/* eslint-disable no-undefined */
import LibLogger from "@/logger";
import {
  ikToLKA,
  isPriKey,
  isValidPriKey,
  Item,
  LocKeyArray,
  PriKey,
  TypesProperties
} from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import { PItemAdapterContext } from "./PItemAdapterContext";
import { PItemContext, PItemContextType } from "./PItemContext";

export const PItemLoad = <
  V extends Item<S>,
  S extends string
>(
    {
      name,
      adapter,
      addActions = () => ({}),
      children,
      context,
      ik,
    }: {
      name: string;
    // TODO: I want this to be two separate properties.
    adapter: PItemAdapterContext<V, S>;
    addActions?: (contextValues: PItemContextType<V, S>) => Record<string, (args?: any) => Promise<V | null>>;
    children: React.ReactNode;
    context: PItemContext<V, S>;
    ik: PriKey<S> | null;
  }
  ) => {
  const [itemKey, setItemKey] = React.useState<PriKey<S> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [isRemoving, setIsRemoving] = React.useState<boolean>(false);

  // Since we pass this to the actions constructor, don't destructure it yet
  const PItemAdapter = usePItemAdapter<V, S>(adapter);

  // Destructure the values we need to define functions.
  const {
    cacheMap,
    pkType,
    retrieve: retrieveItem,
    remove: removeItem,
    update: updateItem,
    action: actionItem,
  } = useMemo(() => PItemAdapter, [PItemAdapter]);

  const logger = LibLogger.get('PItemLoad', pkType);

  const item: V | null = useMemo(() => {
    let item: V | null = null;
    // We only make a call to the cache if the key is valid.  If we don't do this we end up driving up errors
    // And here's the explanation, there are cases where you don't have a valid key, and a null result is expected
    // if we don't catch this here, what we end up with is making a request to the server we know will fail.
    if (itemKey && isValidPriKey(itemKey)) {
      item = cacheMap && cacheMap.get(itemKey as PriKey<S>) as V | null;
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

  const locations: LocKeyArray<S> | null = useMemo(() => {
    if (item) {
      return ikToLKA(item.key) as unknown as LocKeyArray<S>;
    } else {
      return null;
    }
  }, [item])

  useEffect(() => {
    logger.trace('useEffect[ik]', { ik });
    if (ik) {
      // TODO: We don't just check to see if the key is a PriKey, we check to see if the PK is defined
      if( isPriKey(ik) && ik.pk ) {
        logger.debug(`${name}: Key has been provided`, { ik });
        setItemKey(ik as PriKey<S>);
      } else {
        // TODO: If we get here log a debug message, but don't fail.
        logger.debug(`${name}: Key is either not a PriKey or a PK is not defined`, { ik });
        setIsLoading(false);
      }
    } else {
      logger.debug(`${name}: No item key was provided, no item will be retrieved`, { ik });
      setIsLoading(false);
    }
  }, [ik]);

  useEffect(() => {
    // TODO: We check to see not only that the itemKey is defined, but that the PK is defined if it is a PriKey
    if (itemKey && isValidPriKey(itemKey) && itemKey.pk) {
      (async () => {
        logger.debug(`${name}: useEffect[itemKey]`, { itemKey });
        await retrieveItem(itemKey);
      })();
    }
  }, [itemKey]);

  const remove = useCallback(async () => {
    logger.trace("remove");
    if (itemKey && isValidPriKey(itemKey)) {
      setIsRemoving(true);
      await removeItem(itemKey);
      setIsRemoving(false);
    } else {
      setIsRemoving(false);
      logger.error(`${name}: Item key is required to remove an item`);
      throw new Error(`Item key is required to remove an item in ${name}`);
    }
  }, [removeItem, itemKey]);

  const update = useCallback(async (item: TypesProperties<V, S>) => {
    logger.trace("update", { item });
    if (itemKey && isValidPriKey(itemKey)) {
      if (item) {
        setIsUpdating(true);
        const retItem = await updateItem(itemKey, item);
        setIsUpdating(false);
        return retItem as V;
      } else {
        setIsUpdating(false);
        logger.error(`${name}: Non-null Item is required to update an item`);
        throw new Error(`Non-null Item is required to update an item in ${name}`);
      }
    } else {
      logger.error(`${name}: Item key is required to update an item`);
      throw new Error(`Item key is required to update an item in ${name}`);
    }
  }, [updateItem, itemKey]);

  const action = useCallback(async (
    actionName: string,
    body?: any,
  ) => {
    logger.trace("action", { actionName, body });
    if (itemKey && isValidPriKey(itemKey)) {
      setIsUpdating(true);
      const retItem = await actionItem(itemKey, actionName, body);
      setIsUpdating(false);
      return retItem as V;
    } else {
      setIsUpdating(false);
      logger.error(`${name}: Item key is required to perform an action`);
      throw new Error(`Item key is required to perform an action in ${name}`);
    }
  }, [actionItem, itemKey]);

  const contextValue: PItemContextType<V, S> = {
    name,
    key: itemKey as PriKey<S>,
    item,
    parentItem: null,
    isLoading,
    isUpdating,
    isRemoving,
    pkType,
    remove,
    update,
    action,
    locations,
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
