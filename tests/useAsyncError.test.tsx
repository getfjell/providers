import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from 'react-error-boundary';
import { useAsyncError, withAsyncErrorHandling } from '../src/useAsyncError';

// Test component that uses the useAsyncError hook
const TestComponent = ({ shouldError = false }: { shouldError?: boolean }) => {
  const { throwAsyncError } = useAsyncError();

  React.useEffect(() => {
    if (shouldError) {
      // Simulate an async operation that throws an error
      setTimeout(() => {
        throwAsyncError(new Error('Test async error'));
      }, 10);
    }
  }, [shouldError, throwAsyncError]);

  return <div data-testid="test-component">Test Component</div>;
};

// Test component that uses withAsyncErrorHandling
const TestComponentWithWrapper = ({ shouldError = false }: { shouldError?: boolean }) => {
  const { throwAsyncError } = useAsyncError();
  const [result, setResult] = React.useState<string | null>(null);

  const asyncOperation = React.useCallback(async (): Promise<string> => {
    if (shouldError) {
      throw new Error('Test async operation error');
    }
    return 'success';
  }, [shouldError]);

  const wrappedAsyncOperation = React.useCallback(
    withAsyncErrorHandling(asyncOperation, throwAsyncError),
    [asyncOperation, throwAsyncError]
  );

  React.useEffect(() => {
    wrappedAsyncOperation().then(setResult);
  }, [wrappedAsyncOperation]);

  return (
    <div data-testid="test-wrapper-component">
      Result: {result || 'loading'}
    </div>
  );
};

// Error fallback component
const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div data-testid="error-boundary">
      Error caught: {error.message}
    </div>
  );
};

describe('useAsyncError', () => {
  it('should render successfully without errors', () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestComponent shouldError={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('test-component')).toBeTruthy();
    expect(screen.queryByTestId('error-boundary')).toBeNull();
  });

  it('should trigger error boundary when async error is thrown', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestComponent shouldError={true} />
      </ErrorBoundary>
    );

    // Initially should render the component
    expect(screen.getByTestId('test-component')).toBeTruthy();

    // Wait for the async error to be thrown and caught by error boundary
    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeTruthy();
    });

    expect(screen.getByTestId('error-boundary')).toHaveTextContent('Error caught: Test async error');
    expect(screen.queryByTestId('test-component')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should handle withAsyncErrorHandling correctly for successful operations', async () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestComponentWithWrapper shouldError={false} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-wrapper-component')).toHaveTextContent('Result: success');
    });

    expect(screen.queryByTestId('error-boundary')).toBeNull();
  });

  it('should handle withAsyncErrorHandling correctly for failed operations', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestComponentWithWrapper shouldError={true} />
      </ErrorBoundary>
    );

    // Wait for the error to be caught by error boundary
    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeTruthy();
    });

    expect(screen.getByTestId('error-boundary')).toHaveTextContent('Error caught: Test async operation error');
    expect(screen.queryByTestId('test-wrapper-component')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should handle withAsyncErrorHandling with optional flag', async () => {
    // Test the withAsyncErrorHandling function directly without hooks
    const mockThrowAsyncError = vi.fn();

    const asyncOperation = async (): Promise<string> => {
      throw new Error('Test error');
    };

    // With optional=true, should return null instead of throwing
    const wrappedOptional = withAsyncErrorHandling(asyncOperation, mockThrowAsyncError, true);
    const result = await wrappedOptional();

    expect(result).toBeNull();
    expect(mockThrowAsyncError).not.toHaveBeenCalled();
  });
});
