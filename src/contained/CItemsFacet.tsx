import { Item, ItemQuery } from "@fjell/core";
import React, { useEffect, useMemo } from "react";
import * as AItem from "../AItem";
import { useCItemAdapter } from "./CItemAdapter";

import * as CItemAdapter from "./CItemAdapter";
import * as CItems from "./CItems";
import { CItemsProvider } from "./CItemsProvider";

export const CItemsFacet = <
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
      context: itemsContext,
      contextName,
      adapterContext,
      parent,
      parentContextName,
      renderEach,
      facet,
      facetParams = {},
    }: {
    name: string;
    adapter: CItemAdapter.Context<V, S, L1, L2, L3, L4, L5>;
    children?: React.ReactNode;
    context: CItems.Context<V, S, L1, L2, L3, L4, L5>;
    contextName: string;
    adapterContext?: string;
    query?: ItemQuery;
    parent: AItem.Context<Item<L1, L2, L3, L4, L5, never>, L1, L2, L3, L4, L5>;
    parentContextName: string;
    renderEach?: (item: V) => React.ReactNode;
    facet: string,
    facetParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  }
  ) => {

  const [result, setResult] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Default adapterContext to contextName + "Adapter" if not provided
  const adapterContextName = adapterContext || `${contextName}Adapter`;

  // Try to get existing context first
  let existingContext: CItems.ContextType<V, S, L1, L2, L3, L4, L5> | undefined;
  try {
    existingContext = CItems.useCItems(itemsContext, contextName);
  } catch {
    // No existing context, we'll create a new provider
  }

  // Since we pass this to the actions constructor, don't destructure it yet
  const adapterContextInstance = useCItemAdapter<V, S, L1, L2, L3, L4, L5>(adapter, adapterContextName);

  const parentContext = AItem.useAItem<Item<L1, L2, L3, L4, L5>, L1, L2, L3, L4, L5>(parent, parentContextName);

  const {
    locations: parentLocations,
  } = useMemo(() => parentContext, [parentContext]);

  // TODO: Ok, I sort of hate this, but we're making sure that we're not requerying unless the params have changed.
  const facetParamsString = useMemo(() => JSON.stringify(facetParams), [facetParams]);

  useEffect(() => {
    if (facet && facetParams && parentLocations && adapterContextInstance) {
      (async () => {
        const result = await adapterContextInstance.allFacet(facet, facetParams, parentLocations);
        setResult(result as any);
        setIsLoading(false);
      })();
    }
  }, [facet, facetParamsString, parentLocations]);

  // If we have an existing context, enhance it by adding our facet results
  if (existingContext) {
    const enhancedFacetResults = {
      ...existingContext.facetResults,
      ...(result ? { [facet]: result } : {}),
    };

    // Create enhanced context value
    const enhancedContextValue: CItems.ContextType<V, S, L1, L2, L3, L4, L5> = {
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
  return CItemsProvider<V, S, L1, L2, L3, L4, L5>({
    name,
    adapter,
    children,
    context: itemsContext,
    contextName: contextName,
    renderEach,
    facetResults: result ? { [facet]: result } : {},
    isLoadingParam: isLoading,
    parent,
    parentContextName,
  });
}
