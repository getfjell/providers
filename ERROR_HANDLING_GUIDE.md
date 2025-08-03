# Error Handling Patterns Guide

This guide documents the standardized error handling patterns implemented across the @fjell/providers package to ensure consistency and proper integration with React Error Boundaries.

## Overview

The package implements three distinct error handling patterns based on the context and timing of errors:

1. **Immediate Validation Errors** - Thrown synchronously during render
2. **Async Runtime Errors** - Converted to sync errors using `useAsyncError` hook
3. **Function-level Errors** - Proper try-catch-finally patterns in async functions

## Pattern 1: Immediate Validation Errors

**When to use**: Parameter validation, context validation, and other immediate checks during component initialization.

**Pattern**: Throw immediately - these are caught by React Error Boundaries.

```tsx
// ✅ Good - Hook context validation
if (contextInstance === undefined) {
  throw new Error(`This hook must be used within a ${contextName}`);
}

// ✅ Good - Parameter validation
if (ik !== undefined && providedItem !== undefined) {
  const errorMessage = `${name}: Cannot provide both 'ik' and 'item' parameters.`;
  logger.error(errorMessage);
  throw new Error(errorMessage);
}
```

**Characteristics**:
- Thrown during render phase
- Automatically caught by React Error Boundaries
- Used for invalid component usage or configuration

## Pattern 2: Async Runtime Errors

**When to use**: Errors that occur in async operations within `useEffect`, event handlers, or other async contexts.

**Pattern**: Use the `useAsyncError` hook to convert async errors to sync errors.

```tsx
import { useAsyncError } from '../useAsyncError';

const MyComponent = () => {
  const { throwAsyncError } = useAsyncError();

  useEffect(() => {
    (async () => {
      try {
        await someAsyncOperation();
      } catch (error) {
        logger.error(`${name}: Error in async operation`, error);
        throwAsyncError(error as Error);
      }
    })();
  }, []);

  // Component renders...
};
```

**Characteristics**:
- Errors set to state, thrown during next render
- Properly caught by React Error Boundaries
- Maintains React's error handling lifecycle

## Pattern 3: Function-level Error Handling

**When to use**: Async functions that are called by user actions or other components.

**Pattern**: Proper try-catch-finally with state cleanup and error propagation.

```tsx
const asyncFunction = useCallback(async (params) => {
  setIsLoading(true);
  try {
    const result = await someOperation(params);
    return result;
  } catch (error) {
    logger.error(`${name}: Error in operation`, error);
    throw error; // Re-throw for caller to handle
  } finally {
    setIsLoading(false);
  }
}, [dependencies]);
```

**Characteristics**:
- Ensures proper cleanup with `finally` blocks
- Logs errors for debugging
- Re-throws errors for caller to decide handling strategy

## The `useAsyncError` Hook

### Purpose
Converts async errors to sync errors that React Error Boundaries can catch.

### API
```tsx
const { throwAsyncError, clearError } = useAsyncError();

// Throw an async error (will be thrown during next render)
throwAsyncError(new Error('Something went wrong'));

// Clear any pending error
clearError();
```

### Helper Function
```tsx
import { withAsyncErrorHandling } from '../useAsyncError';

// Wrap async functions for automatic error handling
const safeAsyncOperation = withAsyncErrorHandling(
  myAsyncFunction,
  throwAsyncError,
  optional // true = return null on error, false = throw error
);
```

## Migration Examples

### Before (Inconsistent)
```tsx
// ❌ Bad - Mixed patterns
const [error, setError] = useState(null);
if (error) throw error; // Some components

// ❌ Bad - Lost async errors
useEffect(() => {
  someAsyncOp().catch(err => {
    console.error(err); // Error is lost
  });
}, []);

// ❌ Bad - No cleanup
const myFunction = async () => {
  setLoading(true);
  await operation(); // If this fails, loading stays true
  setLoading(false);
};
```

### After (Standardized)
```tsx
// ✅ Good - Consistent async error handling
const { throwAsyncError } = useAsyncError();

// ✅ Good - Proper async error handling
useEffect(() => {
  (async () => {
    try {
      await someAsyncOp();
    } catch (error) {
      logger.error('Operation failed', error);
      throwAsyncError(error as Error);
    }
  })();
}, []);

// ✅ Good - Proper cleanup and error propagation
const myFunction = useCallback(async () => {
  setLoading(true);
  try {
    const result = await operation();
    return result;
  } catch (error) {
    logger.error('Operation failed', error);
    throw error;
  } finally {
    setLoading(false);
  }
}, []);
```

## Error Boundary Integration

All error patterns are designed to work seamlessly with React Error Boundaries:

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
        // Send to error reporting service
      }}
    >
      <YourFjellComponents />
    </ErrorBoundary>
  );
}
```

## Component-Specific Patterns

### Query Components (PItemQuery, CItemQuery, etc.)
- Use `useAsyncError` for async query operations
- Immediate validation for parameters
- Optional items don't throw errors

### Load Components (PItemLoad, CItemLoad, etc.)
- Use `useAsyncError` for invalid keys in async context
- Immediate throwing for parameter validation
- Proper cleanup in async retrieval operations

### Provider Components (CItemsProvider, etc.)
- Function-level error handling with try-catch-finally
- Immediate throwing for missing required context (parent locations)
- Proper state cleanup in all async operations

### Adapter Components
- Immediate throwing for missing context or invalid configuration
- Proper error propagation from cache operations

## Testing Error Handling

The package includes comprehensive tests for error handling:

```tsx
// Test immediate errors
expect(() => {
  render(<ComponentWithInvalidProps />);
}).toThrow('Expected error message');

// Test async errors with Error Boundaries
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ComponentThatThrowsAsyncError />
  </ErrorBoundary>
);

await waitFor(() => {
  expect(screen.getByTestId('error-boundary')).toBeTruthy();
});
```

## Benefits

1. **Consistency**: All components follow the same patterns
2. **Reliability**: No lost errors in async contexts
3. **Debuggability**: Proper logging and error propagation
4. **Developer Experience**: Clear patterns that are easy to follow
5. **React Integration**: Full compatibility with React Error Boundaries
6. **Performance**: Proper cleanup prevents memory leaks and stuck loading states

## Best Practices

1. **Always log errors** before throwing or re-throwing
2. **Use descriptive error messages** with component context
3. **Clean up state** in finally blocks
4. **Don't catch and ignore** errors unless intentional
5. **Test error scenarios** to ensure proper handling
6. **Use the provided patterns** - don't create custom error handling

This standardized approach ensures that all errors in the fjell-providers ecosystem are handled consistently and reliably.
