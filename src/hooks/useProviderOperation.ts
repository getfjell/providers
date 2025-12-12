import { useCallback, useState } from 'react';
import { defaultErrorTransformer, ErrorTransformer, UserError } from '../utils/errorTransform';

export interface UseProviderOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: UserError, originalError: any) => void;
  throwOnError?: boolean;
  errorTransformer?: ErrorTransformer;
}

export interface ProviderOperationState<T> {
  execute: T;
  loading: boolean;
  error: UserError | null;
  result: any;
  reset: () => void;
  retry: () => Promise<any>;
}

/**
 * Hook for executing provider operations with comprehensive error handling
 *
 * @example
 * ```tsx
 * const { execute, loading, error, retry } = useProviderOperation(
 *   () => orderProvider.createOrder(data),
 *   {
 *     onSuccess: (order) => navigate(`/orders/${order.id}`),
 *     onError: (userError) => showToast(userError.message)
 *   }
 * );
 * ```
 */
export function useProviderOperation<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  options?: UseProviderOperationOptions
): ProviderOperationState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UserError | null>(null);
  const [result, setResult] = useState<any>(null);
  const [lastArgs, setLastArgs] = useState<Parameters<T> | null>(null);

  const transformer = options?.errorTransformer || defaultErrorTransformer;

  const execute = useCallback(async (...args: Parameters<T>) => {
    setLoading(true);
    setError(null);
    setLastArgs(args);

    try {
      const res = await operation(...args);
      setResult(res);
      options?.onSuccess?.(res);
      return res;
    } catch (err: any) {
      // Log structured error for debugging
      console.error('Provider operation failed:', {
        component: 'providers',
        hook: 'useProviderOperation',
        operation: operation.name || 'unknown',
        errorType: err?.constructor?.name,
        errorMessage: err?.message,
        errorCode: err?.code || err?.errorInfo?.code || err?.fjellError?.code,
        throwOnError: options?.throwOnError,
        suggestion: 'Check operation implementation, network connectivity, and error handling'
      });
      
      // Transform error to UserError
      const userError = transformer.transform(err, {
        operation: operation.name || 'unknown'
      });

      setError(userError);
      options?.onError?.(userError, err);

      if (options?.throwOnError) {
        throw err;
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [operation, options, transformer]) as T;

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setLoading(false);
    setLastArgs(null);
  }, []);

  const retry = useCallback(async () => {
    if (!lastArgs) {
      throw new Error('Cannot retry: no previous operation');
    }
    return execute(...lastArgs);
  }, [lastArgs, execute]);

  return { execute, loading, error, result, reset, retry };
}

