/**
 * Common type aliases to reduce repetition and improve maintainability
 */

import { Item, LocKeyArray } from "@fjell/types";

/**
 * Commonly used parameter type for facet operations
 */
export type FacetParams = Record<
  string,
  string | number | boolean | Date | Array<string | number | boolean | Date>
>;

/**
 * Nested facet results structure - first key is facet name, second key is parameter hash
 */
export type NestedFacetResults = Record<string, Record<string, any>>;

/**
 * Standard generic parameters for items with up to 5 location levels
 */
export type StandardGenericParams<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = {
  V: V;
  S: S;
  L1: L1;
  L2: L2;
  L3: L3;
  L4: L4;
  L5: L5;
};

/**
 * Common location array type
 */
export type LocationArray<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = LocKeyArray<L1, L2, L3, L4, L5>;

/**
 * Promise-like object type guard interface
 */
export interface PromiseLike<T> {
  then: (onfulfilled?: (value: T) => any, onrejected?: (reason: any) => any) => any;
  catch: (onrejected?: (reason: any) => any) => any;
}
