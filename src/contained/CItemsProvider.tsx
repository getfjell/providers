import * as AItem from "../AItem";
import { abbrevIK, abbrevLKA, ComKey, Item, LocKeyArray, PriKey } from "@fjell/core";
import React, { createElement, useCallback, useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";

import LibLogger from "../logger";
import * as CItemAdapter from "./CItemAdapter";
import * as CItems from "./CItems";

const logger = LibLogger.get('CItemsProvider');

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
      children = (<></>),
      context,
      contextName,
      parent,
      parentContextName,
      renderEach,
      items = [],
      facetResults = {},
      isLoadingParam = false,
      overrides,
    }: {
    name: string;
    adapter: CItemAdapter.Context<V, S, L1, L2, L3, L4, L5>;
    // TODO: Ok, let's add a function called "Add Queries" that will allow us to run a query that returns
    // counts, booleans, or data
    addQueries?: (
      adapter: CItemAdapter.ContextType<V, S, L1, L2, L3, L4, L5>,
      locations: LocKeyArray<L1, L2, L3, L4, L5>,
      parentItem: Item<L1, L2, L3, L4, L5, never>
    ) =>
      Record<string, (...params: any) => Promise<string | boolean | number | null>>;
    children?: React.ReactNode;
    context: CItems.Context<V, S, L1, L2, L3, L4, L5>;
    contextName: string;
    parent: AItem.Context<Item<L1, L2, L3, L4, L5, never>, L1, L2, L3, L4, L5>;
    parentContextName: string;
    renderEach?: (item: V) => React.ReactNode;
    items?: V[] | null;
    facetResults?: Record<string, any>;
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
  const adapterContext = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    pkTypes,
    all: allItems,
    one: oneItem,
    create: createItem,
    update: updateItem,
    remove: removeItem,
    allAction: allActionItem,
    allFacet: allFacetItem,
    action: actionItem,
    facet: facetItem,
    set: setItem,
    find: findItem,
    findOne: findOneItem,
    addAllActions,
    addAllFacets,
  } = adapterContext;

  const parentContext = AItem.useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const parentLocations = parentContext.locations;
  const parentItem = parentContext.item;

  useEffect(() => {
    setIsLoading(isLoadingParam);
  }, [isLoadingParam]);

  const create = useCallback(async (item: Partial<Item<S, L1, L2, L3, L4, L5>>) => {
    if (parentLocations) {
      logger.debug(`${name}: create`, { item, parentLocations: abbrevLKA(parentLocations as any) });
      setIsCreating(true);
      try {
        const result = await createItem(item, { locations: parentLocations }) as V;
        return result;
      } catch (error) {
        logger.error(`${name}: Error creating item with data:`, { item, error });
        throw error;
      } finally {
        setIsCreating(false);
      }
    } else {
      logger.error(`${name}: No parent locations present to create containeditem`, { item });
      throw new Error(`No parent locations present to create containeditem in ${name}`);
    }
  }, [createItem, parentLocations]);

  const update = useCallback(async (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: Partial<Item<S, L1, L2, L3, L4, L5>>) => {
    logger.debug(`${name}: update`, { key: abbrevIK(key), item });
    setIsUpdating(true);
    try {
      const result = await updateItem(key, item) as V;
      return result;
    } catch (error) {
      logger.error(`${name}: Error updating item with key:`, { key: abbrevIK(key), item, error });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [updateItem, parentLocations]);

  const remove = useCallback(async (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>) => {
    logger.debug(`${name}: remove`, { key: abbrevIK(key) });
    setIsRemoving(true);
    try {
      const result = await removeItem(key);
      return result;
    } catch (error) {
      logger.error(`${name}: Error removing item with key:`, { key: abbrevIK(key), error });
      throw error;
    } finally {
      setIsRemoving(false);
    }
  }, [removeItem, parentLocations]);

  const all = useCallback(async () => {
    if (parentLocations) {
      logger.debug(`${name}: all`, { query: {}, parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      try {
        const result = await allItems({}, parentLocations) as V[] | null;
        return result;
      } catch (error) {
        logger.error(`${name}: Error getting all items`, error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      logger.error(`${name}: No parent locations present to query for all containeditems`);
      throw new Error(`No parent locations present to query for all containeditems in ${name}`);
    }
  }, [allItems, parentLocations]);

  const one = useCallback(async () => {
    if (parentLocations) {
      logger.trace('one', { query: {}, parentLocations: abbrevLKA(parentLocations as any) });
      setIsLoading(true);
      try {
        const result = await oneItem({}, parentLocations) as V | null;
        return result;
      } catch (error) {
        logger.error(`${name}: Error getting one item with query:`, { query: {}, parentLocations: abbrevLKA(parentLocations as any), error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      logger.error(`${name}: No parent locations present to query for one containeditem`);
      throw new Error(`No parent locations present to query for one containeditem in ${name}`);
    }
  }, [oneItem, parentLocations]);

  const allAction = useCallback(async (action: string, body: any = {}): Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> => {
    if (parentLocations) {
      logger.info('allAction', { action, body, parentLocations: abbrevLKA(parentLocations as any) });
      setIsUpdating(true);
      try {
        const result = await allActionItem(action, body, parentLocations);
        return result;
      } catch (error: any) {
        // Simple string-based logging to avoid serialization issues
        const errorMsg = error?.message || String(error);
        const errorCode = error?.fjellError?.code || error?.errorInfo?.code || error?.code;
        const validOpts = error?.fjellError?.details?.validOptions || error?.errorInfo?.details?.validOptions;

        console.error(
          `${name}: Error in allAction "${action}":`,
          `Message: ${errorMsg}`,
          errorCode ? `Code: ${errorCode}` : '',
          validOpts ? `Valid options: ${validOpts.join(', ')}` : ''
        );
        throw error;
      } finally {
        setIsUpdating(false);
      }
    } else {
      logger.error(`${name}: No parent locations present to query for allAction containeditems`,
        { action, body });
      throw new Error(`No parent locations present to query for allAction containeditems in ${name}`);
    }
  }, [allActionItem, parentLocations]);

  const allFacet = useCallback(async (facet: string, params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {}) => {
    if (parentLocations) {
      logger.info('allFacet', { facet, params, parentLocations: abbrevLKA(parentLocations as any) });
      setIsUpdating(true);
      try {
        const result = await allFacetItem(facet, params, parentLocations as LocKeyArray<L1, L2, L3, L4, L5>) as any;
        return result;
      } finally {
        setIsUpdating(false);
      }
    }
    const errorMessage = `${name}: No parent locations present to query for allFacet containeditems`;
    logger.error(errorMessage, { facet, params });
    throw new Error(errorMessage);
  }, [allFacetItem, parentLocations]);

  const action = useCallback(
    async (
      key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
      action: string,
      body: any = {},
    ): Promise<[V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> => {
      if (parentLocations) {
        logger.info('action', { key, action, body, parentLocations: abbrevLKA(parentLocations as any) });
        setIsUpdating(true);
        try {
          const result = await actionItem(key, action, body);
          return result;
        } catch (error: any) {
          // Simple string-based logging to avoid serialization issues
          const errorMsg = error?.message || String(error);
          const errorCode = error?.fjellError?.code || error?.errorInfo?.code || error?.code;
          const validOpts = error?.fjellError?.details?.validOptions || error?.errorInfo?.details?.validOptions;

          console.error(
            `${name}: Error in action "${action}":`,
            `Message: ${errorMsg}`,
            errorCode ? `Code: ${errorCode}` : '',
            validOpts ? `Valid options: ${validOpts.join(', ')}` : ''
          );
          throw error;
        } finally {
          setIsUpdating(false);
        }
      } else {
        throw new Error(`No parent locations present to query for action ${action} in ${name}`);
      }
    }, [actionItem, parentLocations]);

  const facet = useCallback(
    async (
      key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
      facet: string,
      params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
    ): Promise<any> => {
      if (parentLocations) {
        logger.info('facet', { key, facet, params, parentLocations: abbrevLKA(parentLocations as any) });
        setIsUpdating(true);
        try {
          const result = await facetItem(key, facet, params) as any;
          return result;
        } catch (error: any) {
          // Simple string-based logging to avoid serialization issues
          const errorMsg = error?.message || String(error);
          const errorCode = error?.fjellError?.code || error?.errorInfo?.code || error?.code;
          const validOpts = error?.fjellError?.details?.validOptions || error?.errorInfo?.details?.validOptions;

          console.error(
            `${name}: Error in facet "${facet}":`,
            `Message: ${errorMsg}`,
            errorCode ? `Code: ${errorCode}` : '',
            validOpts ? `Valid options: ${validOpts.join(', ')}` : ''
          );
          throw error;
        } finally {
          setIsUpdating(false);
        }
      } else {
        const errorMessage = `${name}: No parent locations present to query for facet ${facet}`;
        logger.error(errorMessage, { key, facet, params });
        throw new Error(errorMessage);
      }
    }, [facetItem, parentLocations]);

  const findOne = useCallback(
    async (
      finder: string,
      finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    ): Promise<V | null> => {
      if (parentLocations) {
        return findOneItem(finder, finderParams, parentLocations);
      } else {
        throw new Error(`No parent locations present to query for findOne containeditem in ${name}`);
      }
    }, [findOneItem, parentLocations]);

  const find = useCallback(async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => {
    if (parentLocations) {
      return findItem(finder, finderParams, parentLocations);
    } else {
      logger.error(`${name}: No parent locations present to query for find containeditems`, { finder, finderParams });
      throw new Error(`No parent locations present to query for find containeditems in ${name}`);
    }
  }, [findItem, parentLocations]);

  const set = useCallback(async (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: V,
  ) => {
    return setItem(key, item);
  }, [setItem, parentLocations]);

  const contextValue: CItems.ContextType<V, S, L1, L2, L3, L4, L5> = {
    name,
    items: items || [],
    facetResults: facetResults || {},
    parentItem: parentItem as Item<L1, L2, L3, L4, L5> | null,
    isLoading,
    isCreating,
    isUpdating,
    isRemoving,
    pkTypes,
    locations: parentLocations as any,
    create,
    update,
    remove,
    all: overrides?.all || all,
    one: overrides?.one || one,
    allAction,
    allFacet,
    action,
    facet,
    find,
    findOne,
    set,
  };

  contextValue.allActions = useMemo(() => addAllActions && addAllActions(contextValue.allAction), [addAllActions, contextValue.allAction]);
  contextValue.allFacets = useMemo(() => addAllFacets && addAllFacets(contextValue.allFacet), [addAllFacets, contextValue.allFacet]);

  return createElement(
    context.Provider,
    {
      value: contextValue as CItems.ContextType<V, S, L1, L2, L3, L4, L5>,
    },
    (
      <>
        {renderEach && items && items.map((item) => renderEach(item))}
        {children}
      </>
    )
  );
}
