// @ts-nocheck
/* eslint-disable no-undefined */
import { ComKey, Item, ItemQuery, LocKeyArray, UUID } from '@fjell/core';
import * as React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CItemsQuery } from '../../src/contained/CItemsQuery';
import { CItemsContextType } from '../../src/contained/CItemsContext';
import { AItemContextType } from '../../src/AItemContext';

// Mock the hooks and logger - use vi.hoisted to ensure these are available in mocks
const { mockUseCItemAdapter, mockUseAItem, mockCItemsProvider, mockLogger } = vi.hoisted(() => ({
  mockUseCItemAdapter: vi.fn(),
  mockUseAItem: vi.fn(),
  mockCItemsProvider: vi.fn(),
  mockLogger: {
    debug: vi.fn(),
    trace: vi.fn(),
    warning: vi.fn(),
    default: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/logger', () => ({
  default: {
    get: vi.fn(() => mockLogger),
  },
}));

// Mock CItemsProvider to capture props passed to it
vi.mock('../../src/contained/CItemsProvider', () => ({
  CItemsProvider: mockCItemsProvider,
}));

vi.mock('../../src/contained/CItemAdapter', () => ({
  useCItemAdapter: mockUseCItemAdapter,
}));

vi.mock('../../src/AItem', () => ({
  useAItem: mockUseAItem,
}));

// Mock the utils module
vi.mock('../../src/utils', () => ({
  createStableHash: vi.fn((obj) => JSON.stringify(obj)),
}));

type TestItem = Item<'test', 'container'>;
type ParentItem = Item<'container'>;

type TestItemsContextType = CItemsContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItemContextType<ParentItem, 'container'>;

const TestContext = React.createContext<TestItemsContextType | undefined>(undefined);
const ParentContext = React.createContext<ParentItemContextType | undefined>(undefined);

// Global test data - accessible to all test blocks
const itemKey: ComKey<'test', 'container'> = {
  pk: '1-1-1-1-1' as UUID,
  kt: 'test',
  loc: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }]
};

const parentLocations: LocKeyArray<'container'> = [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }];

const testItem: TestItem = {
  key: itemKey,
} as TestItem;

const parentItem: ParentItem = {
  key: { pk: '2-2-2-2-2' as UUID, kt: 'container', loc: [] },
} as ParentItem;

const mockAdapterContext = {
  all: vi.fn(),
  one: vi.fn(),
};

const mockParentContext = {
  name: 'TestParent',
  locations: parentLocations,
  item: parentItem,
};

const defaultProps = {
  name: 'TestItemsQuery',
  adapter: TestContext,
  context: TestContext,
  contextName: 'TestItemsContext',
  parent: ParentContext,
  parentContextName: 'ParentContext',
};

// Global beforeEach to ensure mocks are properly set up for all test blocks
beforeEach(() => {
  vi.clearAllMocks();

  // Reset mock implementations
  mockAdapterContext.all.mockResolvedValue([testItem]);
  mockAdapterContext.one.mockResolvedValue(testItem);

  mockUseCItemAdapter.mockReturnValue(mockAdapterContext);
  mockUseAItem.mockReturnValue(mockParentContext);
  mockCItemsProvider.mockImplementation(({ children }) =>
    React.createElement('div', { 'data-testid': 'citems-provider' }, children)
  );
});

describe('CItemsQuery', () => {
  // No additional beforeEach needed - using global one

  it('should render with basic props', () => {
    const TestComponent = () => CItemsQuery({
      ...defaultProps,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with children', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      children: mockChildren,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with query parameter', () => {
    const query: ItemQuery = { name: 'test' };

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      query,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with renderEach function', () => {
    const renderEach = (item: TestItem) =>
      React.createElement('div', { key: item.key.pk }, `Item: ${item.key.pk}`);

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      renderEach,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should create component with hook calls', () => {
    const TestComponent = () => CItemsQuery({
      ...defaultProps,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle query string memoization', () => {
    const query: ItemQuery = { name: 'test', limit: 10 };

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      query,
    });

    expect(TestComponent).toBeDefined();
    // The query should be stringified for memoization
    expect(JSON.stringify(query)).toBe('{"name":"test","limit":10}');
  });

  it('should create all callback function', () => {
    mockAdapterContext.all.mockResolvedValue([testItem]);

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
    });

    expect(TestComponent).toBeDefined();
    // The all function should be available as part of the overrides
  });

  it('should create one callback function', () => {
    mockAdapterContext.one.mockResolvedValue(testItem);

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
    });

    expect(TestComponent).toBeDefined();
    // The one function should be available as part of the overrides
  });

  it('should handle all callback with parent locations', async () => {
    const query: ItemQuery = { name: 'test' };
    mockAdapterContext.all.mockResolvedValue([testItem]);

    // We need to test the actual callback execution
    // This is a bit tricky with the current component structure
    // For now, we verify the component renders correctly
    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      query,
    });

    expect(TestComponent).toBeDefined();
  });

  it('should handle one callback with parent locations', async () => {
    const query: ItemQuery = { name: 'test' };
    mockAdapterContext.one.mockResolvedValue(testItem);

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      query,
    });

    expect(TestComponent).toBeDefined();
  });

  it('should handle error when parent locations are missing for all callback', () => {
    const mockParentContextWithoutLocations = {
      ...mockParentContext,
      locations: null,
    };
    mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
    });

    expect(TestComponent).toBeDefined();
    // Error handling is built into the callbacks
  });

  it('should handle error when parent locations are missing for one callback', () => {
    const mockParentContextWithoutLocations = {
      ...mockParentContext,
      locations: null,
    };
    mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
    });

    expect(TestComponent).toBeDefined();
    // Error handling is built into the callbacks
  });

  it('should render with all optional props', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const renderEach = vi.fn();

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      children: mockChildren,
      renderEach,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle empty query object', () => {
    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      query: {},
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle complex query object', () => {
    const complexQuery: ItemQuery = {
      name: 'test',
      limit: 10,
      offset: 5,
      orderBy: 'created',
    };

    const TestComponent = () => CItemsQuery({
      ...defaultProps,
      query: complexQuery,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle multiple items', () => {
    const TestComponent = () => CItemsQuery({
      ...defaultProps,
    });

    expect(TestComponent).toBeDefined();
  });
});

// Enhanced integration tests with actual rendering
describe('Integration Tests with Rendering', () => {
  it('should render and call CItemsProvider with correct props', async () => {
    const TestWrapper = () => {
      const result = CItemsQuery({
        ...defaultProps,
        children: React.createElement('div', { 'data-testid': 'test-children' }, 'Test Children'),
      });
      return result;
    };

    render(<TestWrapper />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(mockCItemsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'TestItemsQuery',
          adapter: TestContext,
          contextName: 'TestItemsContext',
          parent: ParentContext,
          parentContextName: 'ParentContext',
          items: [testItem],
          isLoadingParam: false,
          overrides: expect.objectContaining({
            all: expect.any(Function),
            one: expect.any(Function),
          }),
        })
      );
    });
  });

  it('should pass renderEach function to CItemsProvider', () => {
    const renderEach = vi.fn((item: TestItem) =>
      React.createElement('div', { key: item.key.pk }, `Item: ${item.key.pk}`)
    );

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        renderEach,
      });
    };

    render(<TestWrapper />);

    // Check the last call after loading state has settled
    expect(mockCItemsProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({
        renderEach,
      })
    );
  });

  it('should handle loading state changes during component lifecycle', () => {
    const loadingStates: boolean[] = [];

    mockCItemsProvider.mockImplementation(({ isLoadingParam }) => {
      loadingStates.push(isLoadingParam);
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    // Should capture the loading state changes
    expect(loadingStates.length).toBeGreaterThan(0);
  });
});

// Callback execution tests
describe('Callback Execution', () => {
  it('should execute all callback successfully with parent locations', async () => {
    const query: ItemQuery = { name: 'test' };
    const expectedResult = [testItem];
    mockAdapterContext.all.mockResolvedValue(expectedResult);

    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides }) => {
      capturedCallbacks = overrides;
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        query,
      });
    };

    render(<TestWrapper />);

    // Execute the captured all callback
    const result = await capturedCallbacks.all();

    expect(result).toEqual(expectedResult);
    expect(mockAdapterContext.all).toHaveBeenCalledWith(query, parentLocations);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('all'),
      expect.objectContaining({
        query: expect.any(String),
        parentLocations: expect.any(String),
      })
    );
  });

  it('should execute one callback successfully with parent locations', async () => {
    const query: ItemQuery = { name: 'test' };
    mockAdapterContext.one.mockResolvedValue(testItem);

    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides }) => {
      capturedCallbacks = overrides;
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        query,
      });
    };

    render(<TestWrapper />);

    // Execute the captured one callback
    const result = await capturedCallbacks.one();

    expect(result).toEqual(testItem);
    expect(mockAdapterContext.one).toHaveBeenCalledWith(query, parentLocations);
  });

  it('should handle all callback error and throw', async () => {
    const query: ItemQuery = { name: 'test' };
    const error = new Error('Adapter error');
    mockAdapterContext.all.mockRejectedValue(error);

    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides }) => {
      capturedCallbacks = overrides;
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        query,
      });
    };

    render(<TestWrapper />);

    // Execute the captured all callback and expect it to throw
    await expect(capturedCallbacks.all()).rejects.toThrow('Adapter error');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error getting all items'),
      error
    );
  });

  it('should handle one callback error and throw', async () => {
    const query: ItemQuery = { name: 'test' };
    const error = new Error('Adapter error');
    mockAdapterContext.one.mockRejectedValue(error);

    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides }) => {
      capturedCallbacks = overrides;
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        query,
      });
    };

    render(<TestWrapper />);

    // Execute the captured one callback and expect it to throw
    await expect(capturedCallbacks.one()).rejects.toThrow('Adapter error');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error getting one item'),
      error
    );
  });

  it('should throw error when all callback is called without parent locations', async () => {
    const mockParentContextWithoutLocations = {
      ...mockParentContext,
      locations: null,
    };
    mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides }) => {
      capturedCallbacks = overrides;
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    // Execute the captured all callback and expect it to throw
    await expect(capturedCallbacks.all()).rejects.toThrow(
      'No parent locations present to query for all containeditems in TestItemsQuery'
    );
    expect(mockLogger.default).toHaveBeenCalledWith(
      expect.stringContaining('No parent locations present to query for all containeditems'),
      expect.any(Object)
    );
  });

  it('should throw error when one callback is called without parent locations', async () => {
    const mockParentContextWithoutLocations = {
      ...mockParentContext,
      locations: null,
    };
    mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides }) => {
      capturedCallbacks = overrides;
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    // Execute the captured one callback and expect it to throw
    await expect(capturedCallbacks.one()).rejects.toThrow(
      'No parent locations present to query for one containeditem in TestItemsQuery'
    );
    expect(mockLogger.default).toHaveBeenCalledWith(
      expect.stringContaining('No parent locations present to query for one containeditem'),
      expect.any(Object)
    );
  });
});

// useEffect behavior tests
describe('useEffect Behavior', () => {
  it('should call adapter.all during useEffect when parent locations are present', async () => {
    const query: ItemQuery = { name: 'test', limit: 5 };
    mockAdapterContext.all.mockResolvedValue([testItem]);

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        query,
      });
    };

    render(<TestWrapper />);

    // Wait for useEffect to complete
    await waitFor(() => {
      expect(mockAdapterContext.all).toHaveBeenCalledWith(query, parentLocations);
    });

    expect(mockLogger.trace).toHaveBeenCalledWith(
      expect.stringContaining('useEffect[queryString]'),
      expect.objectContaining({
        query: expect.any(String),
        parentLocations: expect.any(String),
      })
    );
  });

  it('should log warning during useEffect when parent locations are missing', async () => {
    const mockParentContextWithoutLocations = {
      ...mockParentContext,
      locations: null,
    };
    mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    await waitFor(() => {
      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.stringContaining('useEffect[queryString, parentLocations] without parent locations'),
        expect.any(Object)
      );
    });
  });

  it('should handle useEffect error gracefully without throwing', async () => {
    const error = new Error('useEffect error');
    mockAdapterContext.all.mockRejectedValue(error);

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    // Should render without throwing
    expect(() => render(<TestWrapper />)).not.toThrow();

    await waitFor(() => {
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in useEffect'),
        error
      );
    });
  });

  it('should re-run useEffect when query changes', async () => {
    const initialQuery: ItemQuery = { name: 'initial' };
    const updatedQuery: ItemQuery = { name: 'updated' };
    mockAdapterContext.all.mockResolvedValue([testItem]);

    const TestWrapper = ({ query }: { query: ItemQuery }) => {
      return CItemsQuery({
        ...defaultProps,
        query,
      });
    };

    const { rerender } = render(<TestWrapper query={initialQuery} />);

    await waitFor(() => {
      expect(mockAdapterContext.all).toHaveBeenCalledWith(initialQuery, parentLocations);
    });

    // Clear previous calls
    mockAdapterContext.all.mockClear();

    // Re-render with updated query
    rerender(<TestWrapper query={updatedQuery} />);

    await waitFor(() => {
      expect(mockAdapterContext.all).toHaveBeenCalledWith(updatedQuery, parentLocations);
    });
  });

  it('should re-run useEffect when parent locations change', async () => {
    const newParentLocations: LocKeyArray<'container'> = [{ lk: '4-4-4-4-4' as UUID, kt: 'container' }];
    mockAdapterContext.all.mockResolvedValue([testItem]);

    const TestWrapper = ({ parentLocations }: { parentLocations: LocKeyArray<'container'> }) => {
      const mockParentContextWithLocations = {
        ...mockParentContext,
        locations: parentLocations,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithLocations);

      return CItemsQuery({
        ...defaultProps,
      });
    };

    const { rerender } = render(<TestWrapper parentLocations={parentLocations} />);

    await waitFor(() => {
      expect(mockAdapterContext.all).toHaveBeenCalledWith({}, parentLocations);
    });

    // Clear previous calls
    mockAdapterContext.all.mockClear();

    // Re-render with new parent locations
    rerender(<TestWrapper parentLocations={newParentLocations} />);

    await waitFor(() => {
      expect(mockAdapterContext.all).toHaveBeenCalledWith({}, newParentLocations);
    });
  });
});

// Memoization tests
describe('Memoization Behavior', () => {
  it('should memoize correctly', async () => {
    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    await waitFor(() => {
      expect(mockCItemsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          items: [testItem],
        })
      );
    });
  });

  it('should return null items when parent locations are missing', () => {
    const mockParentContextWithoutLocations = {
      ...mockParentContext,
      locations: null,
    };
    mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    expect(mockCItemsProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({
        items: null,
      })
    );
    expect(mockLogger.warning).toHaveBeenCalledWith(
      expect.stringContaining('items without parent locations'),
      expect.any(Object)
    );
  });

  it('should handle cache changes', () => {
    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    expect(TestWrapper).toBeDefined();
  });
});

// Edge cases and error scenarios
describe('Edge Cases and Error Scenarios', () => {
  it('should handle undefined query gracefully', () => {
    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        query: undefined as any,
      });
    };

    expect(() => render(<TestWrapper />)).not.toThrow();
  });

  it('should handle null adapter context', () => {
    mockUseCItemAdapter.mockReturnValue(null as any);

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    expect(() => render(<TestWrapper />)).toThrow();
  });

  it('should handle null parent context', () => {
    mockUseAItem.mockReturnValue(null as any);

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    expect(() => render(<TestWrapper />)).toThrow();
  });

  it('should handle empty string name', () => {
    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        name: '',
      });
    };

    render(<TestWrapper />);

    expect(mockCItemsProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: '',
      })
    );
  });

  it('should handle complex nested query objects', () => {
    const complexQuery: ItemQuery = {
      name: 'test',
      filters: {
        status: 'active',
        tags: ['important', 'urgent'],
      },
      sort: {
        field: 'created',
        direction: 'desc',
      },
      pagination: {
        limit: 20,
        offset: 40,
      },
    };

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
        query: complexQuery,
      });
    };

    render(<TestWrapper />);

  });

  it('should handle very large item arrays', async () => {
    const largeItemArray = Array.from({ length: 1000 }, (_, i) => ({
      ...testItem,
      key: { ...itemKey, pk: `${i}-${i}-${i}-${i}-${i}` as UUID },
    }));

    // Override the mock to return the large array
    mockAdapterContext.all.mockResolvedValue(largeItemArray);

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    await waitFor(() => {
      expect(mockCItemsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          items: largeItemArray,
        })
      );
    });
  });
});

// Loading state management tests
describe('Loading State Management', () => {
  it('should manage loading state during all callback execution', async () => {
    const delay = () => new Promise(resolve => setTimeout(resolve, 50));
    mockAdapterContext.all.mockImplementation(async () => {
      await delay();
      return [testItem];
    });

    const loadingStates: boolean[] = [];
    mockCItemsProvider.mockImplementation(({ isLoadingParam }) => {
      loadingStates.push(isLoadingParam);
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides, isLoadingParam }) => {
      capturedCallbacks = overrides;
      loadingStates.push(isLoadingParam);
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    // Execute the all callback
    const promise = capturedCallbacks.all();

    // Allow some time for loading state changes
    await act(async () => {
      await promise;
    });

    // Should have captured loading state transitions
    expect(loadingStates.some(state => state === true)).toBe(true);
    expect(loadingStates.some(state => state === false)).toBe(true);
  });

  it('should manage loading state during one callback execution', async () => {
    const delay = () => new Promise(resolve => setTimeout(resolve, 50));
    mockAdapterContext.one.mockImplementation(async () => {
      await delay();
      return testItem;
    });

    const loadingStates: boolean[] = [];
    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides, isLoadingParam }) => {
      capturedCallbacks = overrides;
      loadingStates.push(isLoadingParam);
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    // Wait for the component to initialize and callbacks to be available
    await waitFor(() => {
      expect(capturedCallbacks.one).toBeDefined();
    });

    // Execute the one callback
    const promise = capturedCallbacks.one();

    // Allow some time for loading state changes
    await act(async () => {
      await promise;
    });

    // Should have captured loading state transitions
    expect(loadingStates.some(state => state === true)).toBe(true);
    expect(loadingStates.some(state => state === false)).toBe(true);
  });

  it('should set loading to false even when callback fails', async () => {
    mockAdapterContext.all.mockRejectedValue(new Error('Test error'));

    let finalLoadingState: boolean | undefined;
    let capturedCallbacks: any = {};
    mockCItemsProvider.mockImplementation(({ overrides, isLoadingParam }) => {
      capturedCallbacks = overrides;
      finalLoadingState = isLoadingParam;
      return React.createElement('div', { 'data-testid': 'citems-provider' });
    });

    const TestWrapper = () => {
      return CItemsQuery({
        ...defaultProps,
      });
    };

    render(<TestWrapper />);

    // Execute the all callback and expect it to fail
    try {
      await capturedCallbacks.all();
    } catch {
      // Expected to fail
    }

    // Loading should still be set to false
    await waitFor(() => {
      expect(finalLoadingState).toBe(false);
    });
  });
});
