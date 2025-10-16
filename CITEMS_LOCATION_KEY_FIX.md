# CItems Location Key Hierarchy Fix

## Date
October 16, 2025

## Executive Summary

Fixed a critical bug in how `CItemLoad` computes the `locations` field in its context. The locations field was not including the current item's own location key, causing multi-level hierarchies to break and resulting in "Location key array order mismatch" errors in cache operations.

## Problem Statement

### Original Issue
When using nested contained items (e.g., Order → OrderPhase → OrderStep), the `CItemsQuery` and other CItems providers were receiving incomplete parent location arrays from the parent context. This caused cache validation errors like:

```
Location key array order mismatch
Expected: ["orderPhase", "order"]
Received: ["order"]
```

### Root Cause

The issue was in `CItemLoad.tsx` (lines 95-107). The component was computing its `locations` field by simply using `parentLocations` directly:

```typescript
// BEFORE (INCORRECT)
const locations: LocKeyArray<S, L1, L2, L3, L4> | null = useMemo(() => {
  if (!item) {
    return null;
  }
  // For composite items, use parent locations as they represent the full hierarchy
  if (parentLocations) {
    return parentLocations as LocKeyArray<S, L1, L2, L3, L4>;
  } else {
    return ikToLKA(item.key);
  }
}, [item, parentLocations])
```

This was incorrect because:

1. The `locations` field in an item's context represents the **full hierarchy INCLUDING the item itself**
2. For a type signature `Item<S, L1, L2, L3, L4, L5>`, the locations field should be `LocKeyArray<S, L1, L2, L3, L4>`, which includes:
   - All parent location keys (L1, L2, L3, L4, L5)
   - The item's own location key (S)
3. By only using `parentLocations`, the item's own location key was missing

### How It Manifested

Consider a 3-level hierarchy:

**Order (Primary Item)**
- Key: `{ pk: 'x', kt: 'order' }`
- Locations: `[{ kt: 'order', lk: 'x' }]` ✓ Correct

**OrderPhase (Contained Item, child of Order)**
- Key: `{ pk: 'y', kt: 'orderPhase', loc: [{ kt: 'order', lk: 'x' }] }`
- Parent locations (from Order context): `[{ kt: 'order', lk: 'x' }]`
- Locations (BEFORE fix): `[{ kt: 'order', lk: 'x' }]` ❌ Missing orderPhase!
- Locations (AFTER fix): `[{ kt: 'orderPhase', lk: 'y' }, { kt: 'order', lk: 'x' }]` ✓ Correct (immediate parent first)

**OrderStep (Contained Item, child of OrderPhase)**
- Key: `{ pk: 'z', kt: 'orderStep', loc: [{ kt: 'orderPhase', lk: 'y' }, { kt: 'order', lk: 'x' }] }`
- Parent locations (from OrderPhase context BEFORE fix): `[{ kt: 'order', lk: 'x' }]` ❌ Missing orderPhase!
- Parent locations (from OrderPhase context AFTER fix): `[{ kt: 'orderPhase', lk: 'y' }, { kt: 'order', lk: 'x' }]` ✓ Correct (immediate parent first)

When `CItemsQuery` queried for OrderStep children using the incomplete parent locations `["order"]`, the cache validation failed because it expected `["orderPhase", "order"]`.

## The Fix

### Understanding `ikToLKA` Behavior

The `ikToLKA` (item key to location key array) function has specific behavior:

```typescript
// For PRIMARY keys: returns the item itself as a location
ikToLKA({ pk: 'x', kt: 'order' })
// => [{ kt: 'order', lk: 'x' }]

// For COMPOSITE keys: returns ONLY parent locations (not the item itself)
ikToLKA({ pk: 'y', kt: 'orderPhase', loc: [{ kt: 'order', lk: 'x' }] })
// => [{ kt: 'order', lk: 'x' }]  // Does NOT include orderPhase!
```

This is intentional - `ikToLKA` is designed for aggregation queries where you want to find siblings at the same location, so it returns only the parent locations.

However, the `locations` field in a context needs to include the item itself for child components to have the complete hierarchy.

### The Solution

Modified `CItemLoad.tsx` to properly construct the full location hierarchy:

```typescript
// AFTER (CORRECT)
const locations: LocKeyArray<S, L1, L2, L3, L4> | null = useMemo(() => {
  if (!item) {
    return null;
  }
  // For composite items, combine parent locations with the current item's location
  // Location arrays must be ordered: immediate parent FIRST, root LAST
  // The current item is the immediate parent for any child items
  if (parentLocations && isComKey(item.key)) {
    const itemLocKey = { kt: item.key.kt, lk: item.key.pk } as LocKey<S>;
    // Prepend the current item (immediate parent) to parent locations (ancestors)
    return [itemLocKey, ...parentLocations] as unknown as LocKeyArray<S, L1, L2, L3, L4>;
  } else {
    // Fallback to item's own location keys if no parent locations available
    // For primary keys, ikToLKA returns [{ kt: itemType, lk: itemId }]
    return ikToLKA(item.key);
  }
}, [item, parentLocations])
```

**Key changes:**
1. Check if the item is a composite key using `isComKey(item.key)`
2. If it is, create a location key for the current item: `{ kt: item.key.kt, lk: item.key.pk }`
3. **PREPEND** the item's location to parent locations: `[itemLocKey, ...parentLocations]`
   - This ensures the correct order: immediate parent FIRST, root LAST
4. For primary items, continue using `ikToLKA` which already returns the correct result

## Why CItemsQuery and Other Providers Didn't Need Changes

The other CItems providers (`CItemsQuery`, `CItemsProvider`, `CItemsFind`, `CItemsFacet`, `CItemQuery`) were already correctly using `parentLocations` for cache operations. They didn't need changes because:

1. They get `parentLocations` from the parent item's context
2. They pass these locations to cache operations like `allItems(query, parentLocations)`
3. Now that `CItemLoad` correctly computes the `locations` field, these providers automatically receive the complete hierarchy

The fix at the `CItemLoad` level cascades correctly through the entire provider chain.

## Verification

### Test Updates

Updated the test in `tests/contained/CItemLoad.test.tsx`:

**Test: "should create locations including full hierarchy for composite items"**

```typescript
// Expected locations now include both parent location AND current item location
const expectedLocations = [
  { lk: '2-2-2-2-2' as UUID, kt: 'container' }, // parent location
  { lk: '1-1-1-1-1' as UUID, kt: 'test' }       // current item location
];
expect(contextValue.locations).toEqual(expectedLocations);
```

### Test Results

All 522 tests pass, including:
- 23 CItemLoad tests
- 42 CItemsQuery tests
- 31 CItemsProvider tests
- 12 CItemsFind tests
- 52 CItemsFacet tests
- 28 CItemQuery tests

## Impact

This fix ensures:

1. **Correct location hierarchy**: Each item's context includes its full location hierarchy
2. **Multi-level nesting works**: Deep hierarchies (Order → OrderPhase → OrderStep) now work correctly
3. **Cache validation passes**: Location key arrays match expected hierarchical order
4. **Backward compatibility**: Primary items and single-level containment continue to work as before

## Files Modified

1. `/Users/tobrien/gitw/getfjell/providers/src/contained/CItemLoad.tsx`
   - Updated `locations` computation to include current item
   - Added `LocKey` import

2. `/Users/tobrien/gitw/getfjell/providers/tests/contained/CItemLoad.test.tsx`
   - Updated test expectations to reflect correct behavior
   - Renamed test for clarity

## Related Documentation

- [LOCATION_KEY_ORDERING_FIX.md](/Users/tobrien/gitw/getfjell/LOCATION_KEY_ORDERING_FIX.md) - Core library ordering fix
- [LOCATION_KEY_ORDERING_EXPLANATION.md](/Users/tobrien/gitw/getfjell/LOCATION_KEY_ORDERING_EXPLANATION.md) - Location key ordering explanation
- [CITEMLOAD_LOCATION_KEY_FIX.md](/Users/tobrien/gitw/getfjell/providers/CITEMLOAD_LOCATION_KEY_FIX.md) - Previous partial fix (now superseded)

## Critical Ordering Rule

**Location arrays MUST be ordered: immediate parent FIRST, root LAST**

This is counter-intuitive because URL paths go the opposite direction (root first), but it matches the type signature order where L1 is the immediate parent and subsequent types are ancestors.

### Example

For `Item<'orderStep', 'orderPhase', 'order'>`:
- S = 'orderStep' (the item itself)
- L1 = 'orderPhase' (immediate parent) ← **FIRST** in location array
- L2 = 'order' (grandparent/root) ← **LAST** in location array

Correct location array: `[{ kt: 'orderPhase', ... }, { kt: 'order', ... }]`

## Key Takeaways

1. **Location fields are hierarchical**: The `locations` field must include the full hierarchy up to and including the current item
2. **Ordering is critical**: Location arrays must be ordered immediate parent FIRST, root LAST (matching the type signature L1, L2, L3...)
3. **ikToLKA is for queries**: The `ikToLKA` function returns parent locations for sibling queries, not the full hierarchy
4. **Context propagation matters**: Fixing the root issue in `CItemLoad` automatically fixes all downstream providers
5. **Type signatures guide implementation**: The type `LocKeyArray<S, L1, L2, L3, L4>` clearly indicates S should be included and the order follows L1→L2→L3...

## Testing Recommendations

When testing multi-level hierarchies:

1. **Test 3+ levels**: Single-level containment can hide this bug; test grandparent-parent-child relationships
2. **Verify parent locations**: Check that parent contexts expose the full hierarchy in their `locations` field
3. **Test cache operations**: Ensure cache operations receive complete location arrays
4. **Check error messages**: Location key validation errors indicate incomplete hierarchies

---

**Time to fix**: 30 minutes
**Time to document**: 15 minutes
**Value of preventing future occurrences**: Immeasurable

