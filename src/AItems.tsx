import {
  AffectedKeys,
  AllItemTypeArrays,
  ActionOperationMethod as CoreActionMethod,
  FacetOperationMethod as CoreFacetMethod,
  FindMethod as CoreFindMethod,
  FindOneMethod as CoreFindOneMethod,
  RemoveMethod as CoreRemoveMethod,
  UpdateMethod as CoreUpdateMethod,
  Item,
  LocKeyArray,
  OperationParams,
  PaginationMetadata
} from "@fjell/types";
import * as React from "react";
import * as AItemAdapter from "./AItemAdapter";
import * as Faceted from "./Faceted";

// Re-export core types
export type { OperationParams, AffectedKeys };

/**
 * Exported action types for dynamic action registration (used by addAllActions helper).
 */

/**
 * AllAction method - uses OperationParams from core, aligned with CoreAllActionOperationMethod
 */
export type AllActionMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    action: string,
    params?: OperationParams,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<[V[], AffectedKeys]>;

/**
 * Added all-action method (for dynamic action registration) - bound to action name
 */
export type AddedAllActionMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = (
    params?: OperationParams,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>
  ) => Promise<V[]>;

/**
 * AItems ContextType - extends core CollectionOperations.
 * Optimized for working with groups of items.
 *
 * Adds React-specific state (items, isLoading, etc.) to core operations.
 */
export interface ContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > extends Omit<Faceted.ContextType<L1, L2, L3, L4, L5>, 'facet'> {
    name: string;

    // React-specific state
    items: V[];
    locations?: LocKeyArray<S, L1, L2, L3, L4> | null;
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isRemoving: boolean;
    pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;
    // Pagination metadata from AllOperationResult
    metadata?: PaginationMetadata;

    // Collection operations - context-bound (no query/locations parameters)
    create: (item: Partial<Item<S, L1, L2, L3, L4, L5>>) => Promise<V>;
    all: () => Promise<V[] | null>;
    one: () => Promise<V | null>;
    allAction: AllActionMethod<V, S, L1, L2, L3, L4, L5>;

    // Additional methods
    allActions?: Record<string, AddedAllActionMethod<V, S, L1, L2, L3, L4, L5>>;
    allFacets?: Record<string, Faceted.AddedFacetMethod<L1, L2, L3, L4, L5>>;
    finders?: Record<string, (...params: any[]) => Promise<V[] | V | null>>;

    // Instance operations (for working with individual items from collection)
    allFacet: Faceted.AllFacetMethod<L1, L2, L3, L4, L5>;
    facet: CoreFacetMethod<S, L1, L2, L3, L4, L5>;
    set: AItemAdapter.SetMethod<V, S, L1, L2, L3, L4, L5>;
    find: CoreFindMethod<V, S, L1, L2, L3, L4, L5>;
    findOne: CoreFindOneMethod<V, S, L1, L2, L3, L4, L5>;
    update: CoreUpdateMethod<V, S, L1, L2, L3, L4, L5>;
    remove: CoreRemoveMethod<never, S, L1, L2, L3, L4, L5>;
    action: CoreActionMethod<V, S, L1, L2, L3, L4, L5>;
  }

export type Context<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
  > = React.Context<ContextType<V, S, L1, L2, L3, L4, L5> | undefined>;

export const useAItems = <
V extends Item<S, L1, L2, L3, L4, L5>,
S extends string,
L1 extends string = never,
L2 extends string = never,
L3 extends string = never,
L4 extends string = never,
L5 extends string = never
>(context: Context<V, S, L1, L2, L3, L4, L5>, contextName: string):
ContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  // eslint-disable-next-line no-undefined
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
