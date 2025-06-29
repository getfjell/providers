
import LibLogger from "@/logger";
import {
  abbrevQuery,
  Item,
  ItemQuery,
  PriKey,
} from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import { PItemLoad } from "./PItemLoad";
import * as PItemAdapter from "./PItemAdapter";
import * as PItem from "./PItem";

const logger = LibLogger.get('PItemQuery');

export const PItemQuery = <V extends Item<S>, S extends string>({
  name,
  adapter,
  children,
  context,
  contextName,
  create,
  loading,
  notFound,
  optional = false,
  query,
}: {
    // TODO: I want this to be two separate properties.
    name: string;
    adapter: PItemAdapter.Context<V, S>;
    children: React.ReactNode;
    context: PItem.Context<V, S>;
    contextName: string,
    create?: Partial<Item<S>> | null;
    loading?: React.ReactNode;
    notFound?: React.ReactNode;
    optional?: boolean;
    query?: ItemQuery;
  }
) => {
  const [itemKey, setItemKey] = React.useState<PriKey<S> | null>(null);
  const [queryRunning, setQueryRunning] = React.useState<boolean>(true);

  // Since we pass this to the actions constructor, don't destructure it yet
  const PItemAdapter = usePItemAdapter<V, S>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    one: oneItem,
    create: createItem,
  } = useMemo(() => PItemAdapter, [PItemAdapter]);
  // TODO: Same in CItemsProvider, this is a way to avoid needles rerender on a change to the instance of query
  const queryString = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    logger.default(`${name}: useEffect[query]`, { query });
    if (!query) {
      setQueryRunning(false);
      return;
    } else {
      (async () => {
        logger.default(`${name}: Running PItemProvder Query`, { query: abbrevQuery(query) });
        try {
          const item = await oneItem(query);
          if (item) {
            logger.default(`${name}: Setting Item Key After oneItem`, { itemKey: item.key });
            setItemKey(item.key);
            setQueryRunning(false);
          } else if (create) {
            logger.default(`${name}: Creating new item`, { create });
            const newItem = await createItem(create);
            logger.default(`${name}: Setting Item Key After createItem`, { itemKey: newItem.key });
            setItemKey(newItem.key);
            setQueryRunning(false);
          } else {
            if (!optional) {
              setQueryRunning(false);
              throw new Error('Required Item not found, and no create provided');
            } else {
              setQueryRunning(false);
              logger.default(`${name}: Optional item not found, item will be null`, { query, optional });
            }
          }
        } catch (err) {
          if (create) {
            logger.default(`${name}: Creating new item after exception throw for NotFound`, { err, create });
            const newItem = await createItem(create);
            logger.default(`${name}: Setting Item Key After createItem during Exception`, { itemKey: newItem.key });
            setItemKey(newItem.key);
            setQueryRunning(false);
          } else {
            if (!optional) {
              setQueryRunning(false);
              throw err;
            } else {
              setQueryRunning(false);
              logger.default(`${name}: Optional item not found, item will be null`);
              setItemKey(null);
            }
          }
        }
      })();
    }
  }, [queryString]);

  const returnContext = PItemLoad<V, S>({
    name,
    ik: itemKey,
    adapter,
    context,
    contextName,
    children,
  });

  if (queryRunning) {
    return loading;
  } else if (itemKey || optional) {
    return returnContext;
  } else {
    return notFound;
  }
}
