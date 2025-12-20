import {
  AffectedKeys,
  AllItemTypeArrays,
  ComKey,
  Item,
  LocKeyArray,
  OperationParams,
  PriKey
} from "@fjell/types";
import * as Faceted from "./Faceted";
import * as React from "react";

// Re-export core types
export type { OperationParams, AffectedKeys };

/**
 * Exported action types for dynamic action registration (used by addActions helper).
 * These are context-bound - the item key is already known from context.
 */

/**
 * Action method for item context - key omitted since it's bound to context.
 * Uses OperationParams from core for type safety.
 */
export type ActionMethod<
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
) => Promise<[V, AffectedKeys]>;

/**
 * Added action method (for dynamic action registration) - bound to both action name and item key
 */
export type AddedActionMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (params?: OperationParams, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V>;

/**
 * AItem ContextType - extends core InstanceOperations.
 * Optimized for working with a single specific item.
 *
 * Adds React-specific state (item, isUpdating, etc.) to core operations.
 */
export interface ContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends Faceted.ContextType {
  name: string;
  key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>;
  locations?: LocKeyArray<S, L1, L2, L3, L4> | null;
  pkTypes: AllItemTypeArrays<S, L1, L2, L3, L4, L5>;
  parentItem: Item<L1, L2, L3, L4, L5> | null;

  // React-specific state
  item: V | null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;

  // Instance operations - context-bound (key is already known from context)
  remove: () => Promise<void>;
  update: (item: Partial<Item<S, L1, L2, L3, L4, L5>>) => Promise<V>;
  set: (item: V) => Promise<V>;
  action: ActionMethod<V, S, L1, L2, L3, L4, L5>;

  // Additional actions/facets
  actions?: Record<string, AddedActionMethod<V, S, L1, L2, L3, L4, L5>>;
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

export const useAItem = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(context: Context<V, S, L1, L2, L3, L4, L5>, contextName: string): ContextType<V, S, L1, L2, L3, L4, L5> => {
  const contextInstance = React.useContext(context);
  // eslint-disable-next-line no-undefined
  if (contextInstance === undefined) {
    throw new Error(
      `This hook must be used within a ${contextName}`,
    );
  }
  return contextInstance;
};
