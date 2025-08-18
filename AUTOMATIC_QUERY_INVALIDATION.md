# Automatic Query Cache Invalidation

This document describes how the automatic query cache invalidation system works in @fjell/providers.

## Overview

The framework now automatically invalidates query caches when items are created, updated, or removed. This ensures that React components always display the most up-to-date data without requiring manual cache invalidation.

## How It Works

### 1. Cache Event System

When items are modified through cache operations, the @fjell/cache package emits events:

- **`item_created`**: When a new item is created
- **`item_updated`**: When an existing item is updated
- **`item_removed`**: When an item is removed
- **`query_invalidated`**: When query results are cleared (emitted alongside item change events)

### 2. Query Cache Clearing

The cache operations (`create`, `update`, `remove`) now automatically clear query results:

```typescript
// In update.ts
await cacheMap.clearQueryResults();

// Emit query invalidated event
const queryInvalidatedEvent = CacheEventFactory.createQueryInvalidatedEvent(
  [], // Specific queries affected (not tracked currently)
  'item_changed',
  { source: 'operation', context: { operation: 'update' } }
);
context.eventEmitter.emit(queryInvalidatedEvent);
```

### 3. React Hook Integration

The `useCacheQuery` hook listens for cache events and automatically refetches data:

```typescript
// Listen for cache events that might affect our query
const subscriptionOptions = useMemo(() => ({
  eventTypes: [
    'items_queried',
    'item_created',
    'item_updated',
    'item_removed',
    'item_retrieved',
    'item_set',
    'cache_cleared',
    'query_invalidated'
  ] as CacheEventType[],
  debounceMs: 50 // Small debounce to batch rapid updates
}), []);
```

When a `query_invalidated` event is received, the hook automatically refetches the data:

```typescript
case 'query_invalidated':
  // When queries are invalidated, we need to refetch
  if (allMethod || cache) {
    const loadItems = async () => {
      try {
        let results: V[] | null;
        if (allMethod) {
          results = await allMethod(query, locations);
        } else if (cache) {
          results = await cache.operations.all(query, locations);
        }
        setItems(results || []);
      } catch (error) {
        logger.error('Error reloading after query invalidation', error);
      }
    };
    loadItems();
  }
  break;
```

### 4. Cache Behavior

The cache maintains two levels of caching:

1. **Item Cache**: Individual items are cached by their keys
2. **Query Cache**: Query results are cached as lists of item keys

When an item is updated:
- The query cache is cleared (forcing API calls for new queries)
- The item cache is updated with the new item data
- Subsequent queries can reconstruct results from the item cache using `queryIn`

This provides optimal performance:
- Updated items are immediately available
- Query results are reconstructed from cached items when possible
- Only truly new queries hit the API

## Usage Example

```typescript
// No manual cache invalidation needed!
function MyComponent() {
  return (
    <PItemsQuery query={{ status: 'active' }}>
      {({ items }) => (
        <div>
          {items.map(item => (
            <div key={item.key.pk}>
              {item.name}
              <button onClick={() => updateItem(item.key, { status: 'inactive' })}>
                Deactivate
              </button>
            </div>
          ))}
        </div>
      )}
    </PItemsQuery>
  );
}

// When updateItem is called, the query will automatically refresh
async function updateItem(key, updates) {
  await cache.operations.update(key, updates);
  // No need to manually invalidate - the component will re-render with updated data!
}
```

## Benefits

1. **Zero Manual Cache Management**: Developers don't need to think about cache invalidation
2. **Always Fresh Data**: UI components automatically show the latest data
3. **Optimal Performance**: Uses cached items when possible, only hits API when necessary
4. **Framework-Level Solution**: Works consistently across all @fjell/providers components

## Technical Details

### Event Flow

1. User updates an item via `cache.operations.update()`
2. Cache clears query results with `clearQueryResults()`
3. Cache emits `item_updated` and `query_invalidated` events
4. `useCacheQuery` hook receives events and triggers refetch
5. Query uses cached items via `queryIn` or hits API if needed
6. React component re-renders with updated data

### Performance Considerations

- Events are debounced (50ms) to batch rapid updates
- Query results are reconstructed from item cache when possible
- Only affected queries are refetched (based on event inspection)
- No unnecessary API calls when data is available in cache

## Summary

The automatic query cache invalidation system ensures that @fjell/providers components always display up-to-date data without requiring manual cache management. This is achieved through a combination of cache events, automatic query result clearing, and React hooks that listen for changes and refetch data as needed.
