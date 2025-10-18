import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProviderOperation } from '../../src/hooks/useProviderOperation';
import { type ErrorInfo, FjellHttpError } from '../../src';

describe('useProviderOperation', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'VALIDATION_ERROR',
    message: 'Invalid email format',
    operation: {
      type: 'create',
      name: 'create',
      params: { email: 'invalid' }
    },
    context: {
      itemType: 'user'
    },
    details: {
      suggestedAction: 'Use a valid email format',
      retryable: true
    },
    technical: {
      timestamp: '2025-10-18T14:00:00.000Z'
    }
  };

  describe('Successful operations', () => {
    it('should handle successful operation', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: 123, name: 'John' });

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.result).toEqual({ id: 123, name: 'John' });
      });
    });

    it('should call onSuccess callback', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: 123 });
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useProviderOperation(mockOperation, { onSuccess })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({ id: 123 });
      });
    });
  });

  describe('Error handling', () => {
    it('should transform FjellHttpError to UserError', async () => {
      const fjellError = new FjellHttpError('Validation failed', mockErrorInfo, 400);
      const mockOperation = vi.fn().mockRejectedValue(fjellError);

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toContain('Invalid email format');
        expect(result.current.error?.title).toBe('Validation Error');
        expect(result.current.error?.severity).toBe('error');
        expect(result.current.error?.details?.retryable).toBe(true);
      });
    });

    it('should call onError callback with UserError', async () => {
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);
      const mockOperation = vi.fn().mockRejectedValue(fjellError);
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useProviderOperation(mockOperation, { onError })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        const userError = onError.mock.calls[0][0];
        expect(userError.message).toContain('Invalid email format');
      });
    });

    it('should not throw by default', async () => {
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);
      const mockOperation = vi.fn().mockRejectedValue(fjellError);

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      await act(async () => {
        const res = await result.current.execute();
        expect(res).toBeNull();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });

    it('should throw when throwOnError is true', async () => {
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);
      const mockOperation = vi.fn().mockRejectedValue(fjellError);

      const { result } = renderHook(() =>
        useProviderOperation(mockOperation, { throwOnError: true })
      );

      await expect(act(async () => {
        await result.current.execute();
      })).rejects.toThrow();
    });

    it('should handle regular errors', async () => {
      const regularError = new Error('Network error');
      const mockOperation = vi.fn().mockRejectedValue(regularError);

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toBe('Network error');
        expect(result.current.error?.details?.code).toBe('UNKNOWN_ERROR');
      });
    });
  });

  describe('State management', () => {
    it('should set loading state during operation', async () => {
      let resolveOperation: any;
      const mockOperation = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveOperation = resolve;
        });
      });

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        resolveOperation({ id: 123 });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should reset state', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({ id: 123 });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Retry functionality', () => {
    it('should retry with same arguments', async () => {
      let callCount = 0;
      const mockOperation = vi.fn().mockImplementation((arg1, arg2) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary error');
        }
        return Promise.resolve({ id: 123, arg1, arg2 });
      });

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      // First call fails
      await act(async () => {
        await result.current.execute('param1', 'param2');
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Retry succeeds
      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.result).toEqual({
          id: 123,
          arg1: 'param1',
          arg2: 'param2'
        });
        expect(result.current.error).toBeNull();
        expect(mockOperation).toHaveBeenCalledTimes(2);
      });
    });

    it('should throw when retry called without previous operation', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: 123 });

      const { result } = renderHook(() => useProviderOperation(mockOperation));

      await expect(act(async () => {
        await result.current.retry();
      })).rejects.toThrow('Cannot retry: no previous operation');
    });
  });

  describe('Custom error transformer', () => {
    it('should use custom transformer', async () => {
      const fjellError = new FjellHttpError('Test', mockErrorInfo, 400);
      const mockOperation = vi.fn().mockRejectedValue(fjellError);

      const customTransformer = {
        transform: vi.fn().mockReturnValue({
          message: 'Custom transformed message',
          severity: 'warning' as const,
          details: { code: 'CUSTOM', retryable: false }
        })
      };

      const { result } = renderHook(() =>
        useProviderOperation(mockOperation, {
          errorTransformer: customTransformer as any
        })
      );

      await act(async () => {
        await result.current.execute();
      });

      await waitFor(() => {
        expect(customTransformer.transform).toHaveBeenCalled();
        expect(result.current.error?.message).toBe('Custom transformed message');
      });
    });
  });
});

