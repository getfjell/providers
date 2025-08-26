# Finder Cache Reactivity

This document explains how the `PItemsFind` and `CItemsFind` components now properly react to cache invalidations, ensuring that search results stay up-to-date when underlying data changes.

## The Problem

Previously, when using finder components like `PItemsFind` with `finder="search"` and search parameters:

1. **Initial Execution**: The finder would execute once and cache the results
2. **Cache Events**: When items were created, updated, or removed, the cache would emit `query_invalidated` events
3. **No Reaction**: The finder components weren't listening for these events, so they never refetched data
4. **Stale Results**: Users would see outdated search results until manually refreshing

## The Solution

Both `PItemsFind` and `CItemsFind` now subscribe to cache events and automatically refetch data when relevant changes occur.

### How It Works

1. **Cache Event Subscription**: Components subscribe to cache events that indicate data changes
2. **Automatic Refetching**: When cache invalidation events occur, the finder automatically re-executes
3. **Debounced Updates**: Events are debounced by 50ms to batch rapid updates and avoid excessive API calls

### Events That Trigger Refetching

- `query_invalidated` - When cached query results are cleared
- `item_created` - When new items are created
- `item_updated` - When existing items are modified
- `item_removed` - When items are deleted
- `cache_cleared` - When the entire cache is cleared

### Implementation Details

#### PItemsFind Changes

```typescript
// Subscribe to cache events to react to cache invalidations
useEffect(() => {
  if (!adapterContext?.cache) {
    return;
  }

  const handleCacheInvalidation = async () => {
    // Refetch data when cache is invalidated
    await executeFinder();
  };

  // Subscribe to cache events that should trigger a refetch
  const subscription = adapterContext.cache.subscribe(handleCacheInvalidation, {
    eventTypes: [
      'query_invalidated',  // When query results are invalidated
      'item_created',       // When new items are created
      'item_updated',       // When existing items are updated
      'item_removed',       // When items are removed
      'cache_cleared'       // When entire cache is cleared
    ],
    debounceMs: 50  // Small debounce to batch rapid updates
  });

  return () => {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    }
  };
}, [adapterContext?.cache, executeFinder]);
```

#### CItemsFind Changes

The same pattern is implemented in `CItemsFind` for contained items, ensuring consistency across both primary and contained item finders.

## Benefits

1. **Real-time Updates**: Search results automatically update when data changes
2. **Better User Experience**: Users see current data without manual refresh
3. **Consistent Behavior**: Finder components now behave like query components
4. **Performance Optimized**: Debouncing prevents excessive API calls during rapid updates

## Example Usage

```tsx
<PItemsFind
  name="userSearch"
  adapter={userAdapter}
  context={userContext}
  contextName="users"
  finder="search"
  finderParams={{ query: "john", status: "active" }}
>
  {({ items, isLoading }) => (
    <div>
      {isLoading ? (
        <p>Searching...</p>
      ) : (
        <ul>
          {items.map(user => (
            <li key={user.key}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  )}
</PItemsFind>
```

Now when users are created, updated, or removed, the search results will automatically refresh to show the current state of the data.

## Cache Event Flow

1. **User Action**: Create/update/remove an item
2. **Cache Operation**: Cache executes the operation and emits events
3. **Query Invalidation**: Cache clears query results and emits `query_invalidated`
4. **Component Reaction**: Finder components receive the event and refetch data
5. **UI Update**: Component re-renders with fresh data

This creates a fully reactive system where the UI automatically stays in sync with the underlying data.
