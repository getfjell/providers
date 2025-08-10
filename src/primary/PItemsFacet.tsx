
import { Item } from "@fjell/core";
import React, { useContext, useEffect, useMemo } from "react";
import { usePItemAdapter } from "./PItemAdapter";
import { createStableHash } from '../utils';
import * as PItemAdapter from "./PItemAdapter";
import * as PItems from "./PItems";
import { PItemsProvider } from "./PItemsProvider";

export const PItemsFacet = <V extends Item<S>, S extends string>(
  {
    name,
    adapter,
    children,
    context: itemsContext,
    contextName,
    adapterContext,
    facet,
    facetParams = {},
    renderEach,
  }: {
    name: string;
    adapter: PItemAdapter.Context<V, S>;
    children: React.ReactNode;
    context: PItems.Context<V, S>;
    contextName: string;
    adapterContext?: string;
    facet: string,
    facetParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    renderEach?: (item: V) => React.ReactNode;
  }
) => {

  const [result, setResult] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Default adapterContext to contextName + "Adapter" if not provided
  const adapterContextName = adapterContext || `${contextName}Adapter`;

  // Try to get existing context first
  const existingContext = useContext(itemsContext);

  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContextInstance = usePItemAdapter<V, S>(adapter, adapterContextName);

  const facetParamsString = useMemo(() => createStableHash(facetParams), [facetParams]);

  useEffect(() => {
    if (facet && facetParams && adapterContextInstance) {
      (async () => {
        if( adapterContextInstance.allFacet ) {
          const result = await adapterContextInstance.allFacet(facet, facetParams);
          setResult(result);
          setIsLoading(false);
        } else {
          setResult(null);
          setIsLoading(false);
        }
      })();
    }
  }, [facet, facetParamsString]);

  // If we have an existing context, enhance it by adding our facet results
  if (existingContext) {
    const enhancedFacetResults = { ...existingContext.facetResults };
    if (result) {
      if (!enhancedFacetResults[facet]) {
        enhancedFacetResults[facet] = {};
      }
      enhancedFacetResults[facet] = {
        ...enhancedFacetResults[facet],
        [facetParamsString]: result
      };
    }

    // Create enhanced context value
    const enhancedContextValue: PItems.ContextType<V, S> = {
      ...existingContext,
      facetResults: enhancedFacetResults,
    };

    return React.createElement(
      itemsContext.Provider,
      {
        value: enhancedContextValue,
      },
      children
    );
  }

  // No existing context, create a new provider
  const initialFacetResults: Record<string, Record<string, any>> = {};
  if (result) {
    initialFacetResults[facet] = { [facetParamsString]: result };
  }

  return (
    <PItemsProvider<V, S>
      name={name}
      adapter={adapter}
      context={itemsContext}
      contextName={contextName}
      renderEach={renderEach}
      facetResults={initialFacetResults}
      isLoadingParam={isLoading}
    >
      {children}
    </PItemsProvider>
  );
}
