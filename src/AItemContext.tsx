import { ComKey, Item, LocKeyArray, PriKey, TypesProperties } from "@fjell/core";

export interface AItemContextType<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  name: string;
  key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>;
  item: V | null;
  isLoading: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  pkType: string;
  remove: () => Promise<void>;
  update: (item: TypesProperties<V, S, L1, L2, L3, L4, L5>) => Promise<V | null>;
  action: (
    action: string,
    body?: any,
  ) => Promise<V | null>;
  actions?: Record<string, (body?: any) => Promise<V | null>>;
  locations: LocKeyArray<S, L1, L2, L3, L4> | null;
}

export type AItemContext<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = React.Context<AItemContextType<V, S, L1, L2, L3, L4, L5> | undefined>;
