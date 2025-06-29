
import { Item } from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import * as PItemAdapter from "./PItemAdapter";
import * as PItems from "./PItems";
import { PItemsProvider } from "./PItemsProvider";

export const PItemsFind = <V extends Item<S>, S extends string>(
  {
    name,
    adapter,
    children,
    context,
    contextName,
    finder,
    finderParams = {},
    renderEach,
  }: {
    name: string;
    adapter: PItemAdapter.Context<V, S>;
    children: React.ReactNode;
    context: PItems.Context<V, S>;
    contextName: string;
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    renderEach?: (item: V) => React.ReactNode;
  }
) => {

  const [items, setItems] = React.useState<V[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContext = usePItemAdapter<V, S>(adapter, contextName);

  // TODO: Ok, I sort of hate this, but we're making sure that we're not requerying unless the params have changed.
  const finderParamsString = useMemo(() => JSON.stringify(finderParams), [finderParams]);

  useEffect(() => {
    if (finder && finderParams && adapterContext) {
      (async () => {
        if( adapterContext.find ) {
          const result = await adapterContext.find(finder, finderParams);
          setItems(result as V[] | null);
          setIsLoading(false);
        } else {
          setItems(null);
          setIsLoading(false);
        }
      })();
    }
  }, [finder, finderParamsString]);

  return PItemsProvider<V, S>({
    name,
    adapter,
    children,
    context,
    contextName,
    renderEach,
    items: items || [],
    isLoadingParam: isLoading,
  });
}
