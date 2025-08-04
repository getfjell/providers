
import LibLogger from "../logger";
import {
  abbrevQuery,
  Item,
  ItemQuery,
  PriKey,
} from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import { createStableHash } from '../utils';
import { PItemLoad } from "./PItemLoad";
import * as PItemAdapter from "./PItemAdapter";
import * as PItem from "./PItem";
import { useAsyncError } from "../useAsyncError";

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
  const { throwAsyncError } = useAsyncError();

  // Since we pass this to the actions constructor, don't destructure it yet
  const PItemAdapter = usePItemAdapter<V, S>(adapter, contextName);

  // Destructure the values we need to define functions.
  const {
    one: oneItem,
    create: createItem,
  } = useMemo(() => PItemAdapter, [PItemAdapter]);

  const queryString = useMemo(() => createStableHash(query), [query]);

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
              logger.error(`${name}: Required Item not found, and no create provided`, { query, optional });
              throwAsyncError(new Error(`Required Item not found, and no create provided in ${name}`));
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
              throwAsyncError(err as Error);
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
