/* eslint-disable no-undefined */
/**
 * Utility functions for stable object comparison and memoization
 */

/**
 * Creates a stable hash for an object that can be used in useMemo dependencies.
 * This is more stable and performant than JSON.stringify for memoization purposes.
 *
 * Features:
 * - Handles consistent key ordering
 * - More performant than JSON.stringify for large objects
 * - Handles circular references gracefully
 * - Stable across re-renders
 *
 * @param obj The object to create a stable hash for
 * @returns A stable string representation suitable for memoization
 */
export function createStableHash(obj: any): string {
  // Handle null, undefined, and primitive values
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj !== 'object') return String(obj);

  // Handle circular references
  const seen = new WeakSet();

  function serialize(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (typeof value !== 'object') {
      return typeof value === 'string' ? `"${value}"` : String(value);
    }

    // Handle circular references
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);

    if (Array.isArray(value)) {
      const result = '[' + value.map(serialize).join(',') + ']';
      seen.delete(value);
      return result;
    }

    // Handle Date objects
    if (value instanceof Date) {
      const result = `Date(${value.getTime()})`;
      seen.delete(value);
      return result;
    }

    // Handle regular objects
    const keys = Object.keys(value).sort(); // Sort keys for consistent ordering
    const result = '{' + keys.map(key => `"${key}":${serialize(value[key])}`).join(',') + '}';
    seen.delete(value);
    return result;
  }

  return serialize(obj);
}

/**
 * Creates a stable memoized value based on object content rather than reference.
 * Use this instead of JSON.stringify in useMemo dependencies.
 * Note: This is NOT a React hook despite the similar naming pattern.
 *
 * @param obj The object to create a stable representation for
 * @returns A stable string that changes only when the object content changes
 */
export function createStableMemo<T>(obj: T): string {
  // This should be called from within useMemo in the components
  return createStableHash(obj);
}

/**
 * Type guard to safely check if a value is a Promise
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'then' in value &&
    typeof (value as any).then === 'function' &&
    'catch' in value &&
    typeof (value as any).catch === 'function'
  );
}

/**
 * Creates a deep comparison function that can be used with useMemo
 * for more complex scenarios where you need custom comparison logic.
 *
 * @param a First object to compare
 * @param b Second object to compare
 * @returns True if objects are deeply equal
 */
export function deepEqual(a: any, b: any, visitedPairs = new WeakMap()): boolean {
  if (a === b) return true;

  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  // Handle circular references by tracking pairs of objects
  if (visitedPairs.has(a)) {
    const visitedB = visitedPairs.get(a);
    if (visitedB === b) return true; // We've seen this exact pair before
    if (visitedB !== undefined) return false; // a is already paired with a different object
  }

  visitedPairs.set(a, b);

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], visitedPairs)) return false;
    }
    return true;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  // Convert keysB to Set for O(1) lookup instead of O(n) includes()
  const keysBSet = new Set(keysB);

  for (const key of keysA) {
    if (!keysBSet.has(key)) return false;
    if (!deepEqual(a[key], b[key], visitedPairs)) return false;
  }

  return true;
}
