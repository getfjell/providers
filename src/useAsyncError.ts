import { useCallback, useState } from 'react';

/**
 * Custom hook for handling async errors in React components.
 * This ensures that async errors are properly caught by React Error Boundaries
 * by setting them to state and throwing during render.
 */
export const useAsyncError = () => {
  const [error, setError] = useState<Error | null>(null);

  // Throw error during render so React Error Boundaries can catch it
  if (error) {
    throw error;
  }

  const throwAsyncError = useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { throwAsyncError, clearError };
};

/**
 * Wrapper function that catches errors in async operations and
 * converts them to sync errors via state management
 */
export const withAsyncErrorHandling = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  throwAsyncError: (error: Error) => void,
  optional: boolean = false
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (!optional) {
        // Safely convert unknown error to Error instance
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        throwAsyncError(errorInstance);
      }
      return null;
    }
  };
};
