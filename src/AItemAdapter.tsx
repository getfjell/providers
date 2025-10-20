import {
  AllItemTypeArrays,
  ComKey,
  ActionOperationMethod as CoreActionMethod,
  AllActionOperationMethod as CoreAllActionMethod,
  AllFacetOperationMethod as CoreAllFacetMethod,
  AllMethod as CoreAllMethod,
  CreateMethod as CoreCreateMethod,
  FacetOperationMethod as CoreFacetMethod,
  FindMethod as CoreFindMethod,
  FindOneMethod as CoreFindOneMethod,
  GetMethod as CoreGetMethod,
  OneMethod as CoreOneMethod,
  RemoveMethod as CoreRemoveMethod,
  UpdateMethod as CoreUpdateMethod,
  Item,
  PriKey,
} from "@fjell/core";
import React from "react";
import * as AItem from "./AItem";
import * as AItems from "./AItems";
import * as Faceted from "./Faceted";

/**
 * Provider-specific cache methods (not in core Operations interface).
 * These are the ONLY types defined here - everything else uses core types directly.
 */
export type RetrieveMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<V | null>;

export type SetMethod<
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never> = (
    key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: V,
  ) => Promise<V>;

/**
 * AItemAdapter ContextType - provides full Operations interface for React providers.
 * This combines both collection and instance operations.
 *
 * Note: This is the "adapter" that bridges React context with core Operations.
 */
export interface ContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> {
  name: string;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;

  // Core Operations methods - using types directly from @fjell/core
  all: CoreAllMethod<V, S, L1, L2, L3, L4, L5>;
  one: CoreOneMethod<V, S, L1, L2, L3, L4, L5>;
  create: CoreCreateMethod<V, S, L1, L2, L3, L4, L5>;
  get: CoreGetMethod<V, S, L1, L2, L3, L4, L5>;
  remove: CoreRemoveMethod<never, S, L1, L2, L3, L4, L5>;
  update: CoreUpdateMethod<V, S, L1, L2, L3, L4, L5>;
  allAction: CoreAllActionMethod<V, S, L1, L2, L3, L4, L5>;
  allFacet: CoreAllFacetMethod<L1, L2, L3, L4, L5>;
  action: CoreActionMethod<V, S, L1, L2, L3, L4, L5>;
  facet: CoreFacetMethod<S, L1, L2, L3, L4, L5>;
  find: CoreFindMethod<V, S, L1, L2, L3, L4, L5>;
  findOne: CoreFindOneMethod<V, S, L1, L2, L3, L4, L5>;

  // Cache-specific methods
  retrieve: RetrieveMethod<V, S, L1, L2, L3, L4, L5>;
  set: SetMethod<V, S, L1, L2, L3, L4, L5>;

  // Helper methods for dynamic action/facet registration
  addActions?: (action: AItem.ActionMethod<V, S, L1, L2, L3, L4, L5>) => Record<string, AItem.AddedActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addFacets?: (facet: Faceted.FacetMethod<L1, L2, L3, L4, L5>) => Record<string, Faceted.AddedFacetMethod<L1, L2, L3, L4, L5>>;
  addAllActions?: (allAction: AItems.AllActionMethod<V, S, L1, L2, L3, L4, L5>) => Record<string, AItems.AddedAllActionMethod<V, S, L1, L2, L3, L4, L5>>;
  addAllFacets?: (allFacet: Faceted.AllFacetMethod<L1, L2, L3, L4, L5>) => Record<string, Faceted.AddedFacetMethod<L1, L2, L3, L4, L5>>;
}

export type Context<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> = React.Context<ContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useAItemAdapter = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  // eslint-disable-next-line indent
  context: Context<V, S, L1, L2, L3, L4, L5>,
  // eslint-disable-next-line indent
  contextName: string
  // eslint-disable-next-line indent
): ContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  // eslint-disable-next-line no-undefined
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
