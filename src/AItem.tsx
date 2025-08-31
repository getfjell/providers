import { AllItemTypeArrays, ComKey, Item, LocKeyArray, PriKey } from "@fjell/core";
import * as Faceted from "./Faceted";
import * as React from "react";

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
  body?: any,
  locations?: LocKeyArray<L1, L2, L3, L4, L5>
) => Promise<[V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>;

export type AddedActionMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (body?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>) => Promise<V>;

export type UpdateMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (
  item: Partial<Item<S, L1, L2, L3, L4, L5>>,
) => Promise<V>;

export type SetMethod<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (
  item: V,
) => Promise<V>;

export type RemoveMethod = () => Promise<void>;

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

  item: V | null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;

  actions?: Record<string, AddedActionMethod<V, S, L1, L2, L3, L4, L5>>;

  remove: RemoveMethod;
  update: UpdateMethod<V, S, L1, L2, L3, L4, L5>;
  set: SetMethod<V, S, L1, L2, L3, L4, L5>;

  action: ActionMethod<V, S, L1, L2, L3, L4, L5>;
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
