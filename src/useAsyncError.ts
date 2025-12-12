import { useCallback, useState } from 'react';
import { defaultErrorTransformer, UserError } from './utils/errorTransform';

/**
 * Custom hook for handling async errors in React components.
 * This ensures that async errors are properly caught by React Error Boundaries
 * by setting them to state and throwing during render.
 *
 * Now enhanced to work with FjellHttpError and provide UserError information.
 */
export const useAsyncError = () => {
  const [error, setError] = useState<Error | null>(null);
  const [userError, setUserError] = useState<UserError | null>(null);

  // Throw error during render so React Error Boundaries can catch it
  if (error) {
    throw error;
  }

  const throwAsyncError = useCallback((error: Error) => {
    // Log structured error information for agentic debugging
    const errorInfo = {
      component: 'useAsyncError',
      operation: 'throwAsyncError',
      errorType: error.constructor?.name || typeof error,
      errorMessage: error.message,
      errorCode: (error as any).code || (error as any).errorInfo?.code || (error as any).fjellError?.code,
      suggestion: 'This error will be caught by React Error Boundary. Check component error boundaries and error fallback UI.',
      stack: error.stack
    };
    
    console.error('Async error being converted to sync error for Error Boundary:', JSON.stringify(errorInfo, null, 2));
    
    setError(error);

    // Transform to UserError for display
    const transformed = defaultErrorTransformer.transform(error);
    setUserError(transformed);
    
    console.error('User-friendly error message:', transformed.message);
    if (transformed.suggestedAction) {
      console.error('Suggested action:', transformed.suggestedAction);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setUserError(null);
  }, []);

  return { throwAsyncError, clearError, userError };
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
        // Log structured error information for agentic debugging
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        const errorInfo = {
          component: 'withAsyncErrorHandling',
          operation: 'async-wrapper',
          optional,
          errorType: errorInstance.constructor?.name || typeof errorInstance,
          errorMessage: errorInstance.message,
          errorCode: error && typeof error === 'object'
            ? ((error as any).code || (error as any).errorInfo?.code || (error as any).fjellError?.code)
            : void 0,
          suggestion: 'Error caught in async operation wrapper. Will be propagated to Error Boundary.',
          stack: errorInstance.stack
        };
        console.error('Async operation error:', JSON.stringify(errorInfo, null, 2));
        
        throwAsyncError(errorInstance);
      } else {
        // For optional operations, log but don't throw
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        console.warn('Optional async operation failed (suppressed):', {
          component: 'withAsyncErrorHandling',
          optional: true,
          errorType: errorInstance.constructor?.name || typeof errorInstance,
          errorMessage: errorInstance.message,
          note: 'This error was suppressed because the operation is optional'
        });
      }
      return null;
    }
  };
};
