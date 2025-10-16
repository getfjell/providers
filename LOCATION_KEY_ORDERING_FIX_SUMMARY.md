# Location Key Ordering Fix - Summary

## Date
October 16, 2025

## Issue
Location keys in CItemLoad were being constructed in the wrong order, causing "Location key array order mismatch" errors in cache operations.

## Root Cause
The initial fix to CItemLoad was **appending** the current item's location key to the end of parent locations:
```typescript
// WRONG - was appending
return [...parentLocations, itemLocKey]
```

This produced: `[root, parent, child]` ❌

## Correct Fix
Location keys must be **prepended** to maintain the correct order:
```typescript
// CORRECT - now prepending
return [itemLocKey, ...parentLocations]
```

This produces: `[child, parent, root]` ✓ (immediate parent FIRST, root LAST)

## The Ordering Rule

**Location arrays MUST be ordered: immediate parent FIRST, root LAST**

This matches the type signature `Item<S, L1, L2, L3>` where:
- L1 = immediate parent (FIRST in array)
- L2 = grandparent (SECOND in array)
- L3 = root (LAST in array)

## Example

For a 3-level hierarchy: Order → OrderPhase → OrderStep

**OrderPhase context locations:**
```typescript
// Type: Item<'orderPhase', 'order'>
[
  { kt: 'orderPhase', lk: 'y' },  // L1 (immediate parent) - FIRST
  { kt: 'order', lk: 'x' }         // L2 (root) - LAST
]
```

**OrderStep using OrderPhase as parent:**
```typescript
// Type: Item<'orderStep', 'orderPhase', 'order'>
// Gets parentLocations: [{ kt: 'orderPhase', lk: 'y' }, { kt: 'order', lk: 'x' }]
// Cache operations receive complete hierarchy in correct order
```

## Files Fixed
1. `/Users/tobrien/gitw/getfjell/providers/src/contained/CItemLoad.tsx` - Changed from append to prepend
2. `/Users/tobrien/gitw/getfjell/providers/tests/contained/CItemLoad.test.tsx` - Updated test expectations

## Test Results
✅ All 522 tests passing

## Why This Matters
- **Multi-level hierarchies work**: Deep nesting (3+ levels) now functions correctly
- **Cache validation passes**: Location arrays match expected hierarchical order
- **CItemsQuery works**: No changes needed - it correctly uses parentLocations from fixed CItemLoad
- **All CItems providers work**: CItemsQuery, CItemsProvider, CItemsFind, CItemsFacet, CItemQuery all benefit

## Quick Reference

| Component | Responsibility |
|-----------|---------------|
| CItemLoad | **Constructs** locations field with correct ordering |
| CItemsQuery | **Uses** parentLocations from CItemLoad (no changes needed) |
| Cache validation | **Validates** that locations match expected order |

The fix cascades correctly: fix CItemLoad → all consumers work automatically.

