// @ts-nocheck
/* eslint-disable no-undefined */
import { ComKey, Item, LocKeyArray, PriKey, UUID } from '@fjell/core';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { CItemsFind } from '../../src/contained/CItemsFind';
import * as CItemAdapter from '../../src/contained/CItemAdapter';
import * as AItem from '../../src/AItem';
import * as CItems from '../../src/contained/CItems';

// Add missing DOM matchers
expect.extend({
  toHaveAttribute(received, attribute, value) {
    const hasAttribute = received.hasAttribute(attribute);
    const actualValue = received.getAttribute(attribute);

    if (value === undefined) {
      return {
        pass: hasAttribute,
        message: () => `Expected element ${hasAttribute ? 'not ' : ''}to have attribute "${attribute}"`
      };
    }

    return {
      pass: hasAttribute && actualValue === value,
      message: () => `Expected element to have attribute "${attribute}" with value "${value}", but got "${actualValue}"`
    };
  }
});

// Mock the CItemsProvider since we're testing CItemsFind's behavior
vi.mock('../../src/contained/CItemsProvider', () => ({
  CItemsProvider: vi.fn(({ name, items, isLoadingParam, children }) =>
    React.createElement('div', {
      'data-testid': `items-provider-${name}`,
      'data-loading': isLoadingParam,
      'data-items-count': items?.length || 0
    }, children)
  )
}));

interface TestItem extends Item<'test', 'container'> {
  name: string;
  key: ComKey<'test', 'container'>;
}

interface ParentItem extends Item<'container'> {
  name: string;
  key: ComKey<never, 'container'>;
}

type TestItemsContextType = CItems.ContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItem.ContextType<ParentItem, 'container'>;
type TestAdapterContextType = CItemAdapter.ContextType<TestItem, 'test', 'container'>;

const TestContext = React.createContext<TestItemsContextType | undefined>(undefined);
const ParentContext = React.createContext<ParentItemContextType | undefined>(undefined);
const AdapterContext = React.createContext<TestAdapterContextType | undefined>(undefined);

describe('CItemsFind', () => {
  let mockAdapter: TestAdapterContextType;
  let mockParent: ParentItemContextType;
  let mockFind: ReturnType<typeof vi.fn>;
  let testItems: TestItem[];
  let parentLocations: LocKeyArray<'container'>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create test data
    const priKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
    const parentPriKey: PriKey<never> = { pk: '2-2-2-2-2' as UUID, kt: '' as never };
    parentLocations = [{ lk: '3-3-3-3-3' as UUID, kt: 'container' }];

    testItems = [
      {
        name: 'Test Item 1',
        key: { kt: priKey.kt, pk: priKey.pk, loc: parentLocations },
      } as TestItem,
      {
        name: 'Test Item 2',
        key: { kt: priKey.kt, pk: '4-4-4-4-4' as UUID, loc: parentLocations },
      } as TestItem
    ];

    // Mock the find function
    mockFind = vi.fn().mockResolvedValue(testItems);

    // Create mock adapter context
    mockAdapter = {
      find: mockFind,
      load: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      query: vi.fn(),
    } as TestAdapterContextType;

    // Create mock parent context
    mockParent = {
      locations: parentLocations,
      item: {
        name: 'Parent Item',
        key: { kt: parentPriKey.kt, pk: parentPriKey.pk, loc: parentLocations },
      } as ParentItem,
      load: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as ParentItemContextType;

    // Mock the hooks
    vi.spyOn(CItemAdapter, 'useCItemAdapter').mockReturnValue(mockAdapter);
    vi.spyOn(AItem, 'useAItem').mockReturnValue(mockParent);
  });

  it('should render initially with loading state', async () => {
    const { getByTestId } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    const provider = getByTestId('items-provider-TestItems');
    expect(provider).toHaveAttribute('data-loading', 'true');
    expect(provider).toHaveAttribute('data-items-count', '0');
  });

  it('should call find with correct parameters and update state', async () => {
    const finderParams = { name: 'test', active: true };

    const { getByTestId } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams,
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledWith('byName', finderParams, parentLocations);
    });

    await waitFor(() => {
      const provider = getByTestId('items-provider-TestItems');
      expect(provider).toHaveAttribute('data-loading', 'false');
      expect(provider).toHaveAttribute('data-items-count', '2');
    });
  });

  it('should handle empty finder params', async () => {
    render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'all',
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledWith('all', {}, parentLocations);
    });
  });

  it('should re-run find when finder params change', async () => {
    const { rerender } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledTimes(1);
    });

    // Change finder params
    rerender(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'updated' },
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledTimes(2);
      expect(mockFind).toHaveBeenLastCalledWith('byName', { name: 'updated' }, parentLocations);
    });
  });

  it('should memoize finder params to prevent unnecessary re-renders', async () => {
    const finderParams = { name: 'test', count: 5 };

    const { rerender } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams,
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledTimes(1);
    });

    // Re-render with same params (but different object reference)
    rerender(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test', count: 5 }, // Same values, different object
      })
    );

    // Should not call find again due to memoization
    expect(mockFind).toHaveBeenCalledTimes(1);
  });

  it('should handle complex finder parameters with different data types', async () => {
    const complexParams = {
      name: 'test',
      count: 10,
      active: true,
      createdAt: new Date('2023-01-01'),
      tags: ['tag1', 'tag2'],
    };

    render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'complex',
        finderParams: complexParams,
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledWith('complex', complexParams, parentLocations);
    });
  });

  it('should handle find errors gracefully', async () => {
    const findError = new Error('Find failed');
    mockFind.mockRejectedValue(findError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create error handler to detect unhandled promise rejections
    const errorHandler = vi.fn();
    window.addEventListener('unhandledrejection', errorHandler);

    const { getByTestId } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockFind).toHaveBeenCalled();
    });

    // Wait a bit more for error handling
    await new Promise(resolve => setTimeout(resolve, 50));

    // Component should still render (error is caught internally)
    const provider = getByTestId('items-provider-TestItems');
    expect(provider).toBeDefined();

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Find operation failed:', findError);

    // Verify no unhandled promise rejection occurred
    expect(errorHandler).not.toHaveBeenCalled();

    // Provider should show no items and not be loading after error
    expect(provider).toHaveAttribute('data-loading', 'false');
    expect(provider).toHaveAttribute('data-items-count', '0');

    window.removeEventListener('unhandledrejection', errorHandler);
    consoleSpy.mockRestore();
  });

  it('should not call find when dependencies are missing', async () => {
    vi.spyOn(AItem, 'useAItem').mockReturnValue({
      ...mockParent,
      locations: null as any, // Missing parent locations
    });

    render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    // Should not call find when parent locations are missing
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('should handle null find results', async () => {
    mockFind.mockResolvedValue(null);

    const { getByTestId } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    await waitFor(() => {
      const provider = getByTestId('items-provider-TestItems');
      expect(provider).toHaveAttribute('data-loading', 'false');
      expect(provider).toHaveAttribute('data-items-count', '0');
    });
  });

  it('should pass correct props to CItemsProvider', async () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' });
    const renderEach = vi.fn();

    render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        children: mockChildren,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
        renderEach,
      })
    );

    // Wait for find to complete
    await waitFor(() => {
      expect(mockFind).toHaveBeenCalled();
    });

    // Verify CItemsProvider was called with the final state after loading
    const { CItemsProvider } = await import('../../src/contained/CItemsProvider');

    // Check that the final call has the expected props
    const calls = CItemsProvider.mock.calls;
    const finalCall = calls[calls.length - 1][0];

    expect(finalCall).toEqual(expect.objectContaining({
      name: 'TestItems',
      adapter: AdapterContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      renderEach,
      items: testItems,
      isLoadingParam: false,
    }));
  });

  it('should re-run find when finder name changes', async () => {
    const { rerender } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledWith('byName', { name: 'test' }, parentLocations);
    });

    // Change finder name
    rerender(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byStatus',
        finderParams: { name: 'test' },
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledTimes(2);
      expect(mockFind).toHaveBeenLastCalledWith('byStatus', { name: 'test' }, parentLocations);
    });
  });

  it('should handle parent location changes', async () => {
    const newParentLocations: LocKeyArray<'container'> = [
      { lk: '5-5-5-5-5' as UUID, kt: 'container' }
    ];

    const { rerender } = render(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledWith('byName', { name: 'test' }, parentLocations);
    });

    // Change parent locations
    vi.spyOn(AItem, 'useAItem').mockReturnValue({
      ...mockParent,
      locations: newParentLocations,
    });

    rerender(
      React.createElement(CItemsFind, {
        name: 'TestItems',
        adapter: AdapterContext,
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
        finderParams: { name: 'test' },
      })
    );

    await waitFor(() => {
      expect(mockFind).toHaveBeenCalledTimes(2);
      expect(mockFind).toHaveBeenLastCalledWith('byName', { name: 'test' }, newParentLocations);
    });
  });
});
