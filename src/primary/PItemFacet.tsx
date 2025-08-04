import { Item } from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import { createStableHash } from '../utils';
import * as PItemAdapter from "./PItemAdapter";
import * as PItem from "./PItem";

export const PItemFacet = <V extends Item<S>, S extends string>(
  {
    adapter,
    children,
    context: itemContext,
    contextName,
    adapterContext,
    facet,
    facetParams = {},
  }: {
    adapter: PItemAdapter.Context<V, S>;
    children: React.ReactNode;
    context: PItem.Context<V, S>;
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
  const adapterContextInstance = usePItemAdapter<V, S>(adapter, adapterContextName);

  // Get the item context
  const itemContextValue = PItem.usePItem<V, S>(itemContext, contextName);

  const facetParamsString = useMemo(() => createStableHash(facetParams), [facetParams]);

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

    const updatedFacetResults = { ...itemContextValue.facetResults };
    if (result) {
      if (!updatedFacetResults[facet]) {
        updatedFacetResults[facet] = {};
      }
      updatedFacetResults[facet] = {
        ...updatedFacetResults[facet],
        [facetParamsString]: result
      };
    }

    return {
      ...itemContextValue,
      facetResults: updatedFacetResults,
      isLoading: isLoading || itemContextValue.isLoading,
    };
  }, [itemContextValue, result, isLoading, facet, facetParamsString]);

  return (
    <itemContext.Provider value={contextValue}>
      {children}
    </itemContext.Provider>
  );
}
