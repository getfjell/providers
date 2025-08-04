
import { CacheMap } from '@fjell/cache';
import { Item, ItemQuery, PriKey } from '@fjell/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PItemsQuery } from '../../src/primary/PItemsQuery';

// Simple test interface
interface TestItem extends Item<'test'> {
  key: PriKey<'test'>;
  name: string;
}

const testItem: TestItem = {
  key: { kt: 'test', pk: '1-1-1-1-1' },
  name: 'test item',
  events: {
    created: { at: new Date(), by: { kt: 'test', pk: '1-1-1-1-1' } },
    updated: { at: new Date(), by: { kt: 'test', pk: '1-1-1-1-1' } },
    deleted: { at: null, by: null }
  }
} as any;

// Create mock contexts with any typing to bypass strict checks
// eslint-disable-next-line no-undefined
const TestItemsProviderContext = React.createContext<any>(undefined);
TestItemsProviderContext.displayName = 'TestItemsProviderContext';

// eslint-disable-next-line no-undefined
const TestItemAdapterContext = React.createContext<any>(undefined);
TestItemAdapterContext.displayName = 'TestItemAdapterContext';

describe('PItemsQuery', () => {
  let mockAdapter: any;
  let mockAll: any;
  let mockOne: any;
  let cacheMap: any;

  beforeEach(() => {
    vi.resetAllMocks();

    cacheMap = new CacheMap(['test']);
    cacheMap.set(testItem.key, testItem);
    cacheMap.queryIn = vi.fn().mockReturnValue([testItem]);

    mockAll = vi.fn().mockResolvedValue([testItem]);
    mockOne = vi.fn().mockResolvedValue(testItem);

    mockAdapter = {
      name: 'test',
      cacheMap,
      pkTypes: ['test'],
      all: mockAll,
      one: mockOne,
      create: vi.fn().mockResolvedValue(testItem),
      get: vi.fn().mockResolvedValue(testItem),
      remove: vi.fn().mockResolvedValue(true),
      retrieve: vi.fn().mockResolvedValue(testItem),
      update: vi.fn().mockResolvedValue(testItem),
      action: vi.fn().mockResolvedValue(testItem),
      allAction: vi.fn().mockResolvedValue([testItem]),
      set: vi.fn().mockResolvedValue(testItem),
      find: vi.fn().mockResolvedValue([testItem]),
      addFacets: vi.fn().mockReturnValue({}),
      facet: vi.fn().mockResolvedValue([testItem]),
      allFacet: vi.fn().mockResolvedValue([testItem]),
      findOne: vi.fn().mockResolvedValue(testItem),
      addAllFacets: vi.fn().mockReturnValue({})
    };
  });

  describe('Component Rendering', () => {
    it('should render children correctly', () => {
      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
          >
            <div data-testid="test-content">Test Content</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      expect(screen.getByTestId('test-content')).toBeDefined();
    });

    it('should render with custom renderEach function', () => {
      const renderEach = vi.fn((item: any) => (
        <div key={item.key.pk} data-testid={`item-${item.key.pk}`}>
          {item.name}
        </div>
      ));

      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
            renderEach={renderEach}
          >
            <div data-testid="test-content">Test Content</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      expect(screen.getByTestId('test-content')).toBeDefined();
    });
  });

  describe('Query Parameter Handling', () => {
    it('should call adapter.all with default empty query', async () => {
      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
          >
            <div>Test</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      await waitFor(() => {
        expect(mockAll).toHaveBeenCalledWith({});
      });
    });

    it('should call adapter.all with custom query', async () => {
      const customQuery: ItemQuery = { limit: 10, offset: 0 };

      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
            query={customQuery}
          >
            <div>Test</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      await waitFor(() => {
        expect(mockAll).toHaveBeenCalledWith(customQuery);
      });
    });

    it('should reload when query changes', async () => {
      const TestQueryComponent = ({ query }: { query: ItemQuery }) => (
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
            query={query}
          >
            <div>Content</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      const { rerender } = render(<TestQueryComponent query={{}} />);

      await waitFor(() => {
        expect(mockAll).toHaveBeenCalledWith({});
      });

      // Change query
      const newQuery = { limit: 5 };
      rerender(<TestQueryComponent query={newQuery} />);

      await waitFor(() => {
        expect(mockAll).toHaveBeenCalledWith(newQuery);
      });

      expect(mockAll).toHaveBeenCalledTimes(2);
    });

    it('should memoize query string to prevent unnecessary re-renders', async () => {
      const TestComponent = ({ query }: { query: ItemQuery }) => (
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
            query={query}
          >
            <div>Test</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      const query = { limit: 10 };
      const { rerender } = render(<TestComponent query={query} />);

      await waitFor(() => {
        expect(mockAll).toHaveBeenCalledTimes(1);
      });

      // Re-render with same query object should not trigger reload
      rerender(<TestComponent query={query} />);

      // Should still only be called once
      await waitFor(() => {
        expect(mockAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State and Items', () => {
    it('should use cacheMap.queryIn for items computation', async () => {
      const queryInSpy = vi.spyOn(mockAdapter.cacheMap, 'queryIn');
      const query = { limit: 5 };

      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
            query={query}
          >
            <div>Test</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      await waitFor(() => {
        expect(queryInSpy).toHaveBeenCalledWith(query);
      });
    });
  });

  describe('Callback Functions', () => {
    it('should provide working all callback', async () => {
      let allCallback: any;

      const TestComponent = () => {
        const context = React.useContext(TestItemsProviderContext);
        allCallback = context?.all;
        return <div>Test</div>;
      };

      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
          >
            <TestComponent />
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      expect(allCallback).toBeDefined();

      if (allCallback) {
        await act(async () => {
          const result = await allCallback();
          expect(result).toEqual([testItem]);
        });

        expect(mockAll).toHaveBeenCalledTimes(2); // Once on mount, once from callback
      }
    });

    it('should provide working one callback', async () => {
      let oneCallback: any;

      const TestComponent = () => {
        const context = React.useContext(TestItemsProviderContext);
        oneCallback = context?.one;
        return <div>Test</div>;
      };

      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
          >
            <TestComponent />
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      expect(oneCallback).toBeDefined();

      if (oneCallback) {
        await act(async () => {
          const result = await oneCallback();
          expect(result).toEqual(testItem);
        });

        expect(mockOne).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle adapter context errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
          >
            <div>Test</div>
          </PItemsQuery>
        );
      }).toThrow(
        'usePItemAdapter hook must be used within a TestItemAdapterContext provider. ' +
        'Make sure to wrap your component with <TestItemAdapterContext.Provider value={...}> ' +
        'or use the corresponding Provider component.'
      );

      consoleSpy.mockRestore();
    });

    it('should handle async loading errors gracefully', async () => {
      const failingAdapter = {
        ...mockAdapter,
        all: vi.fn().mockRejectedValue(new Error('Failed to load items')),
      };

      render(
        <TestItemAdapterContext.Provider value={failingAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
          >
            <div>Test</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      await waitFor(() => {
        expect(failingAdapter.all).toHaveBeenCalled();
      });

      // Wait a bit longer for the error handling to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test passes if no unhandled rejection occurs
      expect(failingAdapter.all).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('should pass correct props to PItemsProvider', () => {
      const TestComponent = () => {
        const context = React.useContext(TestItemsProviderContext);

        // Check that basic provider functionality is available
        expect(context?.name).toBe('test');
        expect(context?.items).toBeDefined();
        expect(context?.all).toBeDefined();
        expect(context?.one).toBeDefined();

        return <div>Provider Working</div>;
      };

      render(
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
          >
            <TestComponent />
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      expect(screen.getByText('Provider Working')).toBeDefined();
    });

    it('should handle multiple query updates correctly', async () => {
      const TestComponent = ({ query }: { query: ItemQuery }) => (
        <TestItemAdapterContext.Provider value={mockAdapter}>
          <PItemsQuery
            name="test"
            adapter={TestItemAdapterContext as any}
            context={TestItemsProviderContext as any}
            contextName="TestItemAdapterContext"
            query={query}
          >
            <div>Query Test</div>
          </PItemsQuery>
        </TestItemAdapterContext.Provider>
      );

      const { rerender } = render(<TestComponent query={{}} />);

      await waitFor(() => {
        expect(mockAll).toHaveBeenNthCalledWith(1, {});
      });

      rerender(<TestComponent query={{ limit: 5 }} />);
      await waitFor(() => {
        expect(mockAll).toHaveBeenNthCalledWith(2, { limit: 5 });
      });

      rerender(<TestComponent query={{ limit: 10, offset: 5 }} />);
      await waitFor(() => {
        expect(mockAll).toHaveBeenNthCalledWith(3, { limit: 10, offset: 5 });
      });

      expect(mockAll).toHaveBeenCalledTimes(3);
    });
  });
});
