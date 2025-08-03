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
 * Hook to create a stable memoized value based on object content rather than reference.
 * Use this instead of JSON.stringify in useMemo dependencies.
 *
 * @param obj The object to create a stable representation for
 * @returns A stable string that changes only when the object content changes
 */
export function useStableMemo<T>(obj: T): string {
  // Using a simple implementation here since we can't use React hooks in a utility function
  // This will be called from within useMemo in the components
  return createStableHash(obj);
}

/**
 * Creates a deep comparison function that can be used with useMemo
 * for more complex scenarios where you need custom comparison logic.
 *
 * @param a First object to compare
 * @param b Second object to compare
 * @returns True if objects are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}
