/* eslint-disable no-undefined */
import { AItemContext } from "@/AItemContext";
import { useAItem } from "@/AItemProvider";
import LibLogger from "@/logger";
import {
  abbrevLKA,
  abbrevQuery,
  ComKey,
  Item,
  ItemQuery,
  PriKey,
  TypesProperties
} from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";
import { CItemAdapterContext } from "./CItemAdapterContext";
import { CItemContext, CItemContextType } from "./CItemContext";
import { CItemLoad } from "./CItemLoad";

// TODO: ALign the null iks and debugging statement changes made on 9/12 in PItemProvider with this.

export const CItemQuery = <
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
      children,
      context,
      create,
      loading,
      notFound,
      optional = false,
      parent,
      query,
    }: {
      name: string;
      adapter: CItemAdapterContext<V, S, L1, L2, L3, L4, L5>;
      addActions?: (contextValues: CItemContextType<V, S, L1, L2, L3, L4, L5>) =>
      Record<string, (...params: any[]) => Promise<V | null>>;
    children: React.ReactNode;
    context: CItemContext<V, S, L1, L2, L3, L4, L5>;
    create?: TypesProperties<V, S, L1, L2, L3, L4, L5>;
    loading?: React.ReactNode;
    notFound?: React.ReactNode;
    optional?: boolean;
    parent: AItemContext<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>;
    query?: ItemQuery;
  }
  ) => {

  const [itemKey, setItemKey] = React.useState<ComKey<S, L1, L2, L3, L4, L5> | PriKey<S> | undefined>(undefined);
  const [queryRunning, setQueryRunning] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  if (error) {
    throw error;
  }

  // Since we pass this to the actions constructor, don't destructure it yet
  const cItemAdapter = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter);

  // Destructure the values we need to define functions.
  const {
    pkTypes,
    one: oneItem,
    create: createItem,
  } = useMemo(() => cItemAdapter, [cItemAdapter]);

  const logger = LibLogger.get('CItemQueryProvider', ...pkTypes);

  const parentItemContext = useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent);

  const {
    locations: parentLocations,
  } = parentItemContext;

  // TODO: Same in CItemsProvider, this is a way to avoid needles rerender on a change to the instance of query
  const queryString = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    if (!query) {
      setQueryRunning(false);
      return;
    } else {
      (async () => {
        logger.default(`${name}: Running CItemProvder Query`, {
          query: abbrevQuery(query),
          parentLocations: abbrevLKA(parentLocations as any),
        });
        if (parentLocations) {
          try {
            const item: V | null = await oneItem(query, parentLocations);
            if (item) {
              logger.default(`${name}: Setting Item Key After oneItem`, { itemKey: item.key });
              setItemKey(item.key);
              setQueryRunning(false);
            } else if (create) {
              logger.default('Creating new item', { create, parentLocations: abbrevLKA(parentLocations as any) });
              const newItem = await createItem(create, parentLocations);
              logger.default(`${name}: Setting Item Key After createItem`, { itemKey: newItem.key });
              setItemKey(newItem.key);
              setQueryRunning(false);
            } else {
              if (!optional) {
                setQueryRunning(false);
                logger.error(`${name}: Required Item not found, and no create provided`, { query, optional });
                setError(new Error(`Required Item not found, and no create provided in ${name}`));
              } else {
                setQueryRunning(false);
                logger.default('Optional item not found, item will be null', { query, optional });
              }
            }
          } catch (err) {
            if (create && parentLocations) {
              logger.default('Creating new item after exception throw for NotFound',
                { err, create, parentLocations: abbrevLKA(parentLocations as any) });
              const newItem = await createItem(create, parentLocations);
              logger.default(`${name}: Setting Item Key After createItem during Exception`, { itemKey: newItem.key });
              setItemKey(newItem.key);
              setQueryRunning(false);
            } else {
              if (!optional) {
                setQueryRunning(false);
                setError(err as Error);
              } else {
                setQueryRunning(false);
                logger.default('Optional item not found, item will be null');
              }
            }
          }
        } else {
          // istanbul ignore next
          logger.warning(`${name}: No parent locations provided`, { query, optional });
          // throw new Error(`No parent locations provided in ${name}`);
        }
      })();
    }
  }, [queryString, parentLocations]);

  const returnContext = CItemLoad<V, S, L1, L2, L3, L4, L5>({
    name,
    ik: itemKey as ComKey<S, L1, L2, L3, L4, L5> | null,
    parent,
    adapter,
    context,
    addActions,
    children,
  });

  if (queryRunning) {
    return loading;
  } else if (itemKey || optional ) {
    return returnContext;
  } else {
    return notFound;
  }
}
