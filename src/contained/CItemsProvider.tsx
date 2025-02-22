/* eslint-disable no-undefined */
import { useAItem } from "@/AItemProvider";
import { abbrevIK, abbrevLKA, ComKey, Item, LocKeyArray, PriKey, TypesProperties } from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";

import { AItemContext } from "@/AItemContext";
import LibLogger from "@/logger";
import { CItemAdapterContext, CItemAdapterContextType } from "./CItemAdapterContext";
import { CItemsContext, CItemsContextType } from "./CItemsContext";

export const CItemsProvider = <
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
      addActions = () => ({}),
      addQueries = () => ({}),
      children = (<></>),
      context,
      parent,
      renderEach,
      items = [],
      isLoadingParam = false,
      overrides,
    }: {
    name: string;
    adapter: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>;
    // TODO: Put more structure on what an action *actually* is.  Should it return a string specifying the action
    // along with the parameters that would be used as a body?
    addActions?: (
      adapter: CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>,
      locations: LocKeyArray<L1, L2, L3, L4, L5>,
      parentItem: Item<L1, L2, L3, L4, L5, never>
    ) =>
      Record<string, (params: any) => Promise<any>>;
    // TODO: Ok, let's add a function called "Add Queries" that will allow us to run a query that returns
    // counts, booleans, or data
    addQueries?: (
      adapter: CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>,
      locations: LocKeyArray<L1, L2, L3, L4, L5>,
      parentItem: Item<L1, L2, L3, L4, L5, never>
    ) =>
      Record<string, (...params: any) => Promise<string | boolean | number | null>>;
    children?: React.ReactNode;
    context: CItemsContext<V, S, L1, L2, L3, L4, L5>;
    parent: AItemContext<Item<L1, L2, L3, L4, L5, never>, L1, L2, L3, L4, L5>;
    renderEach?: (item: V) => React.ReactNode;
    items?: V[] | null;
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
  const adapterContext = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter);

  // Destructure the values we need to define functions.
  const {
    pkType,
    all: allItems,
    one: oneItem,
    create: createItem,
    update: updateItem,
    remove: removeItem,
    allAction: allActionItem,
  } = useMemo(() => adapterContext, [adapterContext]);

  const logger = LibLogger.get('CItemsProvider', pkType);

  const parentContext = useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent);

  const {
    locations: parentLocations,
    item: parentItem,
  } = useMemo(() => parentContext, [parentContext]);

  useEffect(() => {
    setIsLoading(isLoadingParam);
  }, [isLoadingParam]);

  const create = useCallback(async (item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => {
    // TODO: Probably need exception handling here
    if (parentLocations) {
      logger.debug(`${name}: create`, { item, parentLocations: abbrevLKA(parentLocations as any) });
      setIsCreating(true);
      const result = await createItem(item, parentLocations) as V;
      setIsCreating(false);
      return result;
    } else {
      logger.error(`${name}: No parent locations present to create containeditem`, { item });
      throw new Error(`No parent locations present to create containeditem in ${name}`);
    }
  }, [createItem, parentLocations]);

  const update = useCallback(async (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => {
    // TODO: Probably need exception handling here
    logger.debug(`${name}: update`, { key: abbrevIK(key), item });
    setIsUpdating(true);
    const result = await updateItem(key, item) as V;
    setIsUpdating(false);
    return result;
  }, [updateItem, parentLocations]);

  const remove = useCallback(async (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => {
    // TODO: Probably need exception handling here
    logger.debug(`${name}: remove`, { key: abbrevIK(key) });
    setIsRemoving(true);
    const result = await removeItem(key);
    setIsRemoving(false);
    return result;
  }, [removeItem, parentLocations]);

  const all = useCallback(async () => {
    // TODO: Probably need exception handling here
    if (parentLocations) {
      logger.debug(`${name}: all`, { query: {}, parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      const result = await allItems({}, parentLocations) as V[] | null;
      setIsLoading(false);
      return result;
    } else {
      logger.error(`${name}: No parent locations present to query for all containeditems`);
      throw new Error(`No parent locations present to query for all containeditems in ${name}`);
    }
  }, [allItems, parentLocations]);

  const one = useCallback(async () => {
    // TODO: Probably need exception handling here
    if (parentLocations) {
      logger.trace('one', { query: {}, parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      const result = await oneItem({}, parentLocations) as V | null;
      setIsLoading(false);
      return result;
    } else {
      logger.error(`${name}: No parent locations present to query for one containeditem`);
      throw new Error(`No parent locations present to query for one containeditem in ${name}`);
    }
  }, [oneItem, parentLocations]);

  const allAction = useCallback(async (action: string, body: any = {}) => {
    // TODO: Probably need exception handling here
    if (parentLocations) {
      logger.info('allAction', { action, body, parentLocations: abbrevLKA(parentLocations as any) });
      setIsUpdating(true);
      const result = await allActionItem(action, body, parentLocations) as V[] | null;
      setIsUpdating(false);
      return result;
    } else {
      logger.error(`${name}: No parent locations present to query for allAction containeditems`,
        { action, body });
      throw new Error(`No parent locations present to query for allAction containeditems in ${name}`);
    }
  }, [allActionItem, parentLocations]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => {
    if (parentLocations) {
      return adapterContext.find(finder, finderParams, parentLocations);
    } else {
      logger.error(`${name}: No parent locations present to query for find containeditems`, { finder, finderParams });
      throw new Error(`No parent locations present to query for find containeditems in ${name}`);
    }
  }, [adapterContext, parentLocations]);

  const contextValue: CItemsContextType<V, S, L1, L2, L3, L4, L5> = {
    name,
    items: items || [],
    parentItem: parentItem as Item<L1, L2, L3, L4, L5> | null,
    isLoading,
    isCreating,
    isUpdating,
    isRemoving,
    pkType,
    locations: parentLocations,
    create,
    update,
    remove,
    all: overrides?.all || all,
    one: overrides?.one || one,
    allAction,
    find,
  };

  contextValue.actions = useMemo(
    () => {
      logger.debug('Adding Actions', { parentLocations: abbrevLKA(parentLocations as any), parentItem });
      if(parentLocations && parentItem) {
        logger.debug('Adding Actions for Locations and Item', {
          parentLocations: abbrevLKA(parentLocations as any), parentItem });
        return addActions(adapterContext, parentLocations, parentItem);
      }
      return {};
    },
    [adapterContext, parentLocations, parentItem]);
  contextValue.queries = useMemo(
    () => {
      logger.debug('Adding Queries', { parentLocations: abbrevLKA(parentLocations as any), parentItem });
      if(parentLocations && parentItem) {
        logger.debug('Adding Queries for Locations and Item', {
          parentLocations: abbrevLKA(parentLocations as any), parentItem });
        return addQueries(adapterContext, parentLocations, parentItem);
      }
      return {};
    },
    [adapterContext, parentLocations, parentItem]);

  return createElement(
    context.Provider,
    {
      value: contextValue as CItemsContextType<V, S, L1, L2, L3, L4, L5>,
    },
    (
      <>
        {renderEach && items && items.map((item) => renderEach(item))}
        {children}
      </>
    )
  );
}
