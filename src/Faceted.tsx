/* eslint-disable no-undefined */
import { useContext, useEffect, useMemo, useState } from "react";
import { FacetParams } from "./types";
import { createStableHash } from "./utils";
import { LocKeyArray } from "@fjell/core";

export type FacetMethod<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (
  facet: string,
  params?: FacetParams,
  locations?: LocKeyArray<L1, L2, L3, L4, L5>
) => Promise<any | null>;

export type AddedFacetMethod<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (params?: FacetParams, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<any | null>;

export type AllFacetMethod<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    facet: string,
    params?: FacetParams,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<any | null>;

export interface ContextType<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  facets?: Record<string, AddedFacetMethod<L1, L2, L3, L4, L5>>;
  facet: FacetMethod<L1, L2, L3, L4, L5> | AllFacetMethod<L1, L2, L3, L4, L5>;
  facetResults: Record<string, Record<string, any>>;
}

export type Context = React.Context<ContextType | undefined>;

export const useFacetResult = (
  context: Context,
  contextName: string,
  facet: string,
  params: FacetParams = {}
): any => {
  const contextInstance: ContextType | undefined = useContext(context);

  if (contextInstance === undefined) {
    throw new Error(`This hook must be used within a ${contextName}`);
  }

  const facetParamsString = useMemo(() => createStableHash(params), [params]);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (facet && contextInstance) {
      // Remove unnecessary async wrapper
      const facetResult = contextInstance.facetResults?.[facet]?.[facetParamsString];
      setResult(facetResult ?? null);
    }
  }, [facet, facetParamsString, contextInstance]); // Add missing dependency

  return result;
};
