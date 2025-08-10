# Cache Events Integration in Fjell Providers

## Overview

This document summarizes the integration of cache event subscriptions from `@fjell/cache` into `@fjell/providers`, enabling real-time reactive UI updates based on cache changes.

## What Was Implemented

### 1. Adapter Components Enhanced with Cache Events

**Primary Adapter (`PItemAdapter.tsx`)**:
- Added cache event subscription in the adapter to listen for all cache event types
- Introduced `cacheVersion` state to trigger re-renders when cache events occur
- Updated context value with `useMemo` to include `cacheVersion` in dependencies
- Automatic subscription/unsubscription on mount/unmount

**Contained Adapter (`CItemAdapter.tsx`)**:
- Same enhancements as primary adapter but for contained items
- Handles cache events for items within specific location hierarchies

### 2. Cache Event Types Supported

The adapters subscribe to all available cache event types:
- `item_created` - When items are created via API
- `item_updated` - When items are updated via API
- `item_removed` - When items are deleted via API
- `item_retrieved` - When items are fetched from API
- `item_set` - When items are set directly in cache
- `items_queried` - When multiple items are queried
- `cache_cleared` - When entire cache is cleared
- `location_invalidated` - When specific locations are invalidated
- `query_invalidated` - When cached query results are invalidated

### 3. Hooks Enhanced

**`useCacheItem` Hook**:
- Already had cache event subscription for individual item changes
- Fixed linting issues with undefined usage

**`useCacheQuery` Hook**:
- Already had cache event subscription for query result changes
- Uses debouncing for performance

**`useCacheSubscription` Hook**:
- Core hook for subscribing to cache events
- Fixed linting issues with undefined usage

### 4. Performance Optimizations

- **Debouncing**: Events are debounced by 50ms to batch rapid updates
- **Selective Subscriptions**: Hooks can filter by specific event types, keys, or locations
- **Automatic Cleanup**: All subscriptions are properly cleaned up on component unmount

## Benefits

### Real-time Updates
- UI components automatically re-render when cache data changes
- No manual refresh or polling required
- Changes propagate instantly across all components using the same cache

### Performance
- Efficient subscription system with debouncing
- Only relevant components re-render based on their specific subscriptions
- Memory leaks prevented through proper cleanup

### Developer Experience
- Transparent to existing component code
- Works with existing provider patterns
- Easy to configure subscription options

## Usage Examples

### Basic Usage with Adapters

```tsx
// Adapters automatically subscribe to cache events
<PItemAdapter.Adapter
  name="UserAdapter"
  cache={userCache}
  context={UserAdapterContext}
>
  {/* All child components will automatically re-render on cache events */}
  <UserProfile userId="123" />
</PItemAdapter.Adapter>
```

### Custom Event Subscriptions

```tsx
// Subscribe to specific events in components
const MyComponent = () => {
  useCacheSubscription(cache, (event) => {
    console.log('Cache event:', event.type, event);
  }, {
    eventTypes: ['item_updated', 'item_created'],
    debounceMs: 100
  });

  return <div>Component content</div>;
};
```

### Item-Specific Subscriptions

```tsx
// Hook automatically subscribes to events for specific items
const { item, isLoading } = useCacheItem(cache, { pk: 'user-123' });
// Re-renders automatically when user-123 is updated
```

## Files Modified

1. **`src/primary/PItemAdapter.tsx`** - Added cache event subscription to primary adapter
2. **`src/contained/CItemAdapter.tsx`** - Added cache event subscription to contained adapter
3. **`src/hooks/useCacheItem.ts`** - Fixed linting issues
4. **`src/hooks/useCacheSubscription.ts`** - Fixed linting issues
5. **`src/primary/PItemsProvider.tsx`** - Commented out unused variables
6. **`src/contained/CItemsProvider.tsx`** - Commented out unused variables

## Test Files Created

1. **`tests/cache-events-integration.test.tsx`** - Integration tests for cache events
2. **`examples/cache-events-example.tsx`** - Comprehensive example showing real-time updates

## Architecture

```
Cache Events Flow:
Cache Operations → Cache Event Emitter → Adapter Subscriptions → State Changes → Re-renders

1. Cache operations (create, update, delete) emit events
2. Adapters subscribe to all relevant events
3. Events trigger cacheVersion state updates
4. Context value memo dependencies cause re-renders
5. All descendant components receive fresh data
```

## Best Practices

1. **Use Adapters**: Let adapters handle event subscriptions automatically
2. **Debounce Events**: Use appropriate debounce timing for your use case
3. **Filter Events**: Subscribe only to relevant event types when using hooks directly
4. **Memory Management**: Subscriptions are automatically cleaned up, but be mindful in custom implementations

## Next Steps

- Monitor performance in production applications
- Consider adding more granular subscription options if needed
- Potentially add event filtering by item properties or complex queries
- Add metrics/debugging tools for subscription management

## Conclusion

The integration successfully makes Fjell Providers reactive to cache changes, providing a seamless real-time user experience without requiring manual state management or polling. The implementation is performant, memory-safe, and maintains backward compatibility with existing code.
