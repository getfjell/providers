
import { useAItem } from "@/AItemProvider";
import { Item, ItemQuery, LocKeyArray } from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";

import { AItemContext } from "@/AItemContext";
import { CItemAdapterContext, CItemAdapterContextType } from "./CItemAdapterContext";
import { CItemsContext } from "./CItemsContext";
import { CItemsProvider } from "./CItemsProvider";

export const CItemsFind = <
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
      contextName,
      parent,
      parentContextName,
      renderEach,
      finder,
      finderParams = {},
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
    addQueries?: (
      adapter: CItemAdapterContextType<V, S, L1, L2, L3, L4, L5>,
      locations: LocKeyArray<L1, L2, L3, L4, L5>,
      parentItem: Item<L1, L2, L3, L4, L5, never>
    ) =>
      Record<string, (params: any) => Promise<string | boolean | number | null>>;
    children?: React.ReactNode;
    context: CItemsContext<V, S, L1, L2, L3, L4, L5>;
    contextName: string;
    query?: ItemQuery;
    parent: AItemContext<Item<L1, L2, L3, L4, L5, never>, L1, L2, L3, L4, L5>;
    parentContextName: string;
    renderEach?: (item: V) => React.ReactNode;
    finder: string,
    finderParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  }
  ) => {

  const [items, setItems] = React.useState<V[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, contextName);

  const parentContext = useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    locations: parentLocations,
  } = useMemo(() => parentContext, [parentContext]);

  // TODO: Ok, I sort of hate this, but we're making sure that we're not requerying unless the params have changed.
  const finderParamsString = useMemo(() => JSON.stringify(finderParams), [finderParams]);

  useEffect(() => {
    if (finder && finderParams && parentLocations) {
      (async () => {
        const result = await adapterContext.find(finder, finderParams, parentLocations);
        setItems(result as V[] | null);
        setIsLoading(false);
      })();
    }
  }, [finder, finderParamsString, parentLocations]);

  return CItemsProvider<V, S, L1, L2, L3, L4, L5>({
    name,
    adapter,
    addActions,
    addQueries,
    children,
    context,
    contextName,
    renderEach,
    items,
    isLoadingParam: isLoading,
    parent,
    parentContextName,
  });
}
