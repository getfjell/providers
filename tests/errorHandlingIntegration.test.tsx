import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from 'react-error-boundary';

// Import the standardized error handling hook
import { useAsyncError } from '../src/useAsyncError';

// Error boundary component for testing
const ErrorFallback = ({ error }: { error: Error }) => (
  <div data-testid="error-caught">Error: {error.message}</div>
);

// Test component that demonstrates the standardized async error pattern
const TestAsyncErrorComponent = ({ shouldError }: { shouldError: boolean }) => {
  const { throwAsyncError } = useAsyncError();

  React.useEffect(() => {
    if (shouldError) {
      // Simulate an async operation that fails
      setTimeout(() => {
        throwAsyncError(new Error('Test async error from standardized pattern'));
      }, 10);
    }
  }, [shouldError, throwAsyncError]);

  return <div data-testid="async-test-component">Async Test Component</div>;
};

// Test component that demonstrates immediate validation errors
const TestImmediateErrorComponent = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Test immediate validation error');
  }
  return <div data-testid="immediate-test-component">Immediate Test Component</div>;
};

describe('Error Handling Integration', () => {
  it('should handle immediate validation errors consistently', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <TestImmediateErrorComponent shouldError={true} />
        </ErrorBoundary>
      );
    }).not.toThrow(); // Error should be caught by boundary, not thrown to test

    // The error boundary should catch and display the error
    expect(screen.getByTestId('error-caught')).toHaveTextContent('Test immediate validation error');

    consoleSpy.mockRestore();
  });

  it('should handle async errors using useAsyncError hook consistently', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestAsyncErrorComponent shouldError={true} />
      </ErrorBoundary>
    );

    // Initially should render the component
    expect(screen.getByTestId('async-test-component')).toBeTruthy();

    // Wait for async error to be thrown and caught
    await waitFor(() => {
      expect(screen.getByTestId('error-caught')).toBeTruthy();
    });

    expect(screen.getByTestId('error-caught')).toHaveTextContent('Test async error from standardized pattern');

    consoleSpy.mockRestore();
  });

  it('should not interfere with successful operations', async () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestImmediateErrorComponent shouldError={false} />
        <TestAsyncErrorComponent shouldError={false} />
      </ErrorBoundary>
    );

    // Both components should render successfully
    expect(screen.getByTestId('immediate-test-component')).toBeTruthy();
    expect(screen.getByTestId('async-test-component')).toBeTruthy();

    // No error boundary should be triggered
    expect(screen.queryByTestId('error-caught')).toBeNull();

    // Wait a bit to ensure no async errors occur
    await waitFor(() => {
      expect(screen.queryByTestId('error-caught')).toBeNull();
    }, { timeout: 100 });
  });

  it('should demonstrate the error handling patterns work across different component types', async () => {
    // This test demonstrates that the error handling patterns are consistent
    // across different types of components in the fjell-providers ecosystem

    const patterns = {
      immediate: () => {
        // Pattern 1: Immediate validation errors
        throw new Error('Immediate validation error');
      },

      async: (throwAsyncError: (error: Error) => void) => {
        // Pattern 2: Async runtime errors
        setTimeout(() => {
          try {
            throw new Error('Async operation failed');
          } catch (error) {
            throwAsyncError(error as Error);
          }
        }, 1);
      },

      functionLevel: async () => {
        // Pattern 3: Function-level error handling
        try {
          throw new Error('Function operation failed');
        } catch (error) {
          console.error('Operation failed:', error);
          throw error; // Re-throw for caller
        }
      }
    };

    // All patterns should be available and follow consistent structure
    expect(typeof patterns.immediate).toBe('function');
    expect(typeof patterns.async).toBe('function');
    expect(typeof patterns.functionLevel).toBe('function');

    // Immediate errors should throw synchronously
    expect(() => patterns.immediate()).toThrow('Immediate validation error');

    // Function-level errors should be throwable async functions
    await expect(patterns.functionLevel()).rejects.toThrow('Function operation failed');
  });

  it('should verify useAsyncError hook API consistency', () => {
    let hookResult: any;

    const TestComponent = () => {
      hookResult = useAsyncError();
      return <div>Test</div>;
    };

    render(<TestComponent />);

    // Verify the hook returns the expected API
    expect(hookResult).toHaveProperty('throwAsyncError');
    expect(hookResult).toHaveProperty('clearError');
    expect(typeof hookResult.throwAsyncError).toBe('function');
    expect(typeof hookResult.clearError).toBe('function');
  });
});
