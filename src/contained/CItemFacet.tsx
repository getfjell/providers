import { Item } from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import { useCItemAdapter } from "./CItemAdapter";
import * as CItemAdapter from "./CItemAdapter";
import * as CItem from "./CItem";

export const CItemFacet = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    {
      adapter,
      children,
      context: itemContext,
      contextName,
      adapterContext,
      facet,
      facetParams = {},
    }: {
    adapter: CItemAdapter.Context<V, S, L1, L2, L3, L4, L5>;
    children: React.ReactNode;
    context: CItem.Context<V, S, L1, L2, L3, L4, L5>;
    contextName: string;
    adapterContext?: string;
    facet: string,
    facetParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  }
  ) => {

  const [result, setResult] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Default adapterContext to contextName + "Adapter" if not provided
  const adapterContextName = adapterContext || `${contextName}Adapter`;

  // Get the adapter context
  const adapterContextInstance = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, adapterContextName);

  // Get the item context
  const itemContextValue = CItem.useCItem<V, S, L1, L2, L3, L4, L5>(itemContext, contextName);

  // TODO: Ok, I sort of hate this, but we're making sure that we're not requerying unless the params have changed.
  const facetParamsString = useMemo(() => JSON.stringify(facetParams), [facetParams]);

  useEffect(() => {
    if (facet && facetParams && itemContextValue && itemContextValue.key && adapterContextInstance) {
      (async () => {
        try {
          const result = await adapterContextInstance.facet(itemContextValue.key, facet, facetParams);
          setResult(result);
          setIsLoading(false);
        } catch {
          setResult(null);
          setIsLoading(false);
        }
      })();
    }
  }, [facet, facetParamsString, itemContextValue?.key, itemContextValue?.locations]);

  // Create a new context value with the facet result
  const contextValue = useMemo(() => {
    if (!itemContextValue) return itemContextValue;

    return {
      ...itemContextValue,
      facetResults: result ? { ...itemContextValue.facetResults, [facet]: result } : itemContextValue.facetResults,
      isLoading: isLoading || itemContextValue.isLoading,
    };
  }, [itemContextValue, result, isLoading, facet]);

  return (
    <itemContext.Provider value={contextValue}>
      {children}
    </itemContext.Provider>
  );
}
