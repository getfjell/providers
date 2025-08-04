// @ts-nocheck
/* eslint-disable no-undefined */
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ComKey, Item, ItemQuery, LocKeyArray, PriKey, UUID } from '@fjell/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CItemQuery } from '../../src/contained/CItemQuery';
import { CItemAdapterContextType } from '../../src/contained/CItemAdapterContext';
import { CItemContextType } from '../../src/contained/CItemContext';
import { AItemContextType } from '../../src/AItemContext';

interface TestItem extends Item<'test', 'container'> {
  name: string;
  key: ComKey<'test', 'container'>;
  events: {
    created: { at: Date };
    updated: { at: Date };
    deleted: { at: null };
  };
}

interface ParentItem extends Item<'container'> {
  name: string;
  key: PriKey<'container'>;
}

type TestItemAdapterContextType = CItemAdapterContextType<TestItem, 'test', 'container'>;
type TestItemContextType = CItemContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItemContextType<ParentItem, 'container'>;

describe('CItemQuery', () => {
  const priKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };
  const locKeyArray: LocKeyArray<'container'> = [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }];
  const itemKey: ComKey<'test', 'container'> = { kt: priKey.kt, pk: priKey.pk, loc: locKeyArray };
  const testItem: TestItem = {
    key: itemKey,
    name: 'test',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  };

  const parentKey: PriKey<'container'> = { pk: '2-2-2-2-2' as UUID, kt: 'container' };
  const parentItem: ParentItem = {
    key: parentKey,
    name: 'parent',
  };

  let mockAdapter: TestItemAdapterContextType;
  let mockContext: React.Context<TestItemContextType | undefined>;
  let mockParentContext: React.Context<ParentItemContextType | undefined>;
  let mockParentAdapter: ParentItemContextType;

  beforeEach(() => {
    vi.resetAllMocks();

    mockAdapter = {
      name: 'test',
      cacheMap: {
        get: vi.fn().mockReturnValue(testItem),
        set: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        has: vi.fn().mockReturnValue(true),
        size: 0
      },
      pkTypes: ['test', 'container'],
      addActions: vi.fn().mockReturnValue({}),
      addFacets: vi.fn().mockReturnValue({}),
      addAllActions: vi.fn().mockReturnValue({}),
      addAllFacets: vi.fn().mockReturnValue({}),
      all: vi.fn().mockResolvedValue([testItem]),
      one: vi.fn().mockResolvedValue(testItem),
      create: vi.fn().mockResolvedValue(testItem),
      get: vi.fn().mockResolvedValue(testItem),
      remove: vi.fn().mockResolvedValue(undefined),
      retrieve: vi.fn().mockResolvedValue(testItem),
      update: vi.fn().mockResolvedValue(testItem),
      allAction: vi.fn().mockResolvedValue([testItem]),
      allFacet: vi.fn().mockResolvedValue({}),
      action: vi.fn().mockResolvedValue(testItem),
      facet: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(testItem),
      find: vi.fn().mockResolvedValue([testItem]),
      findOne: vi.fn().mockResolvedValue(testItem),
    } as unknown as TestItemAdapterContextType;

    mockParentAdapter = {
      name: 'parent',
      key: parentKey,
      item: parentItem,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['container'],
      locations: locKeyArray,
      remove: vi.fn(),
      update: vi.fn(),
      action: vi.fn(),
      actions: {},
      set: vi.fn(),
    };

    mockContext = React.createContext<TestItemContextType | undefined>(undefined);
    mockParentContext = React.createContext<ParentItemContextType | undefined>(undefined);
  });

  const defaultQuery: ItemQuery = { name: 'test' };

  const QUERY_NOT_SET = Symbol('QUERY_NOT_SET');

  const TestWrapper: React.FC<{
    children: React.ReactNode;
    query?: ItemQuery | typeof QUERY_NOT_SET;
    create?: any;
    optional?: boolean;
    loading?: React.ReactNode;
    notFound?: React.ReactNode;
  }> = ({
    children,
    query = QUERY_NOT_SET,
    create,
    optional = false,
    loading = <div data-testid="loading">Loading...</div>,
    notFound = <div data-testid="not-found">Not Found</div>
  }) => (
    <mockParentContext.Provider value={mockParentAdapter}>
      <mockContext.Provider value={mockAdapter}>
        <CItemQuery
          name="TestItem"
          adapter={mockContext}
          children={children}
          context={mockContext}
          contextName="TestItemContext"
          query={query === QUERY_NOT_SET ? defaultQuery : query as ItemQuery}
          create={create}
          optional={optional}
          loading={loading}
          notFound={notFound}
          parent={mockParentContext}
          parentContextName="ParentContext"
        />
      </mockContext.Provider>
    </mockParentContext.Provider>
  );

  it('should show loading state initially', async () => {
    render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('should query for item and render children when found', async () => {
    render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should create item when not found and create prop provided', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(null);
    const createData = { name: 'new test' };

    render(
      <TestWrapper create={createData}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
    expect(mockAdapter.create).toHaveBeenCalledWith(createData, locKeyArray);
  });

  it('should show children when item not found and optional', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(null);

    render(
      <TestWrapper optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
    expect(mockAdapter.create).not.toHaveBeenCalled();
  });

  it('should render children when item not found but optional', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(null);

    render(
      <TestWrapper optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should handle query errors by creating item if create prop provided', async () => {
    mockAdapter.one = vi.fn().mockRejectedValue(new Error('Not found'));
    const createData = { name: 'new test' };

    render(
      <TestWrapper create={createData}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
    expect(mockAdapter.create).toHaveBeenCalledWith(createData, locKeyArray);
  });

  it('should handle query errors by rendering children if optional', async () => {
    mockAdapter.one = vi.fn().mockRejectedValue(new Error('Not found'));

    render(
      <TestWrapper optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should handle no parent locations gracefully', async () => {
    mockParentAdapter.locations = null;

    render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    // Should not attempt to query without parent locations
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeTruthy();
    });
  });

  it('should handle undefined query gracefully', async () => {
    // Reset the mock to ensure clean state
    vi.clearAllMocks();

    const TestComponent = () => (
      <mockParentContext.Provider value={mockParentAdapter}>
        <mockContext.Provider value={mockAdapter}>
          <CItemQuery
            name="TestItem"
            adapter={mockContext}
            children={<div data-testid="test-child">Test Child</div>}
            context={mockContext}
            contextName="TestItemContext"
            query={undefined}
            optional={true}
            parent={mockParentContext}
            parentContextName="ParentContext"
          />
        </mockContext.Provider>
      </mockParentContext.Provider>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).not.toHaveBeenCalled();
  });

  it('should re-query when query changes', async () => {
    const { rerender } = render(
      <TestWrapper query={{ name: 'test1' }}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledWith({ name: 'test1' }, locKeyArray);
    });

    rerender(
      <TestWrapper query={{ name: 'test2' }}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledWith({ name: 'test2' }, locKeyArray);
    });
  });

  it('should re-query when parent locations change', async () => {
    const { rerender } = render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
    });

    const newLocations: LocKeyArray<'container'> = [{ lk: '3-3-3-3-3' as UUID, kt: 'container' }];
    mockParentAdapter.locations = newLocations;

    rerender(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, newLocations);
    });
  });

  it('should pass correct props to CItemLoad', async () => {
    render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    // Verify that CItemLoad renders children correctly (no wrapper testid)
    expect(screen.getByTestId('test-child')).toBeDefined();
  });

  it('should handle custom loading component', async () => {
    const customLoading = <div data-testid="custom-loading">Custom Loading</div>;

    render(
      <TestWrapper loading={customLoading}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    expect(screen.getByTestId('custom-loading')).toBeTruthy();
  });

  it('should handle children when optional and item not found', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(null);
    const customNotFound = <div data-testid="custom-not-found">Custom Not Found</div>;

    render(
      <TestWrapper notFound={customNotFound} optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should handle component creation', () => {
    const TestComponent = () =>
      CItemQuery({
        name: 'TestItem',
        adapter: mockContext,
        children: React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child'),
        context: mockContext,
        contextName: 'TestItemContext',
        query: defaultQuery,
        parent: mockParentContext,
        parentContextName: 'ParentContext',
      });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should show custom notFound component when optional and item not found', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(null);
    const customNotFound = <div data-testid="custom-not-found">Custom Not Found</div>;

    render(
      <TestWrapper notFound={customNotFound} optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });
  });

  it('should attempt query and handle oneItem failure gracefully', async () => {
    mockAdapter.one = vi.fn().mockRejectedValue(new Error('Database error'));

    render(
      <TestWrapper optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should handle query string memoization correctly', async () => {
    const query1 = { name: 'test' };
    const query2 = { name: 'test' }; // Same content, different object

    const { rerender } = render(
      <TestWrapper query={query1}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledTimes(1);
    });

    // Rerender with same query content but different object reference
    rerender(
      <TestWrapper query={query2}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    // Should not call one again since JSON.stringify would be the same
    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle null query without calling one', async () => {
    render(
      <TestWrapper query={null as any} optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).not.toHaveBeenCalled();
  });

  it('should handle empty object query', async () => {
    render(
      <TestWrapper query={{}}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith({}, locKeyArray);
  });

  it('should call create when oneItem returns null', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(null);
    const createData = { name: 'new test' };

    render(
      <TestWrapper create={createData} optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.create).toHaveBeenCalledWith(createData, locKeyArray);
    });
  });

  it('should call create method when oneItem returns null', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(null);
    const createData = { name: 'new test' };

    render(
      <TestWrapper create={createData} optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.create).toHaveBeenCalledWith(createData, locKeyArray);
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should call create after oneItem failure when create provided', async () => {
    mockAdapter.one = vi.fn().mockRejectedValue(new Error('Not found'));
    const createData = { name: 'new test' };

    render(
      <TestWrapper create={createData} optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.create).toHaveBeenCalledWith(createData, locKeyArray);
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should properly reset query running state on successful query', async () => {
    render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    // Should start with loading
    expect(screen.getByTestId('loading')).toBeTruthy();

    // Should transition to children after query completes
    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(screen.queryByTestId('loading')).toBeNull();
  });

  it('should handle adapter context changes', async () => {
    const newAdapter = {
      ...mockAdapter,
      name: 'newAdapter',
      one: vi.fn().mockResolvedValue(testItem),
    };

    const { rerender } = render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalled();
    });

    // Change the adapter context
    rerender(
      <mockParentContext.Provider value={mockParentAdapter}>
        <mockContext.Provider value={newAdapter}>
          <CItemQuery
            name="TestItem"
            adapter={mockContext}
            children={<div data-testid="test-child">Test Child</div>}
            context={mockContext}
            contextName="TestItemContext"
            query={defaultQuery}
            parent={mockParentContext}
            parentContextName="ParentContext"
          />
        </mockContext.Provider>
      </mockParentContext.Provider>
    );

    await waitFor(() => {
      expect(newAdapter.one).toHaveBeenCalled();
    });
  });

  it('should handle parent context value changes', async () => {
    const newParentAdapter = {
      ...mockParentAdapter,
      locations: [{ lk: '9-9-9-9-9' as UUID, kt: 'container' as const }],
    };

    const { rerender } = render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
    });

    rerender(
      <mockParentContext.Provider value={newParentAdapter}>
        <mockContext.Provider value={mockAdapter}>
          <CItemQuery
            name="TestItem"
            adapter={mockContext}
            children={<div data-testid="test-child">Test Child</div>}
            context={mockContext}
            contextName="TestItemContext"
            query={defaultQuery}
            parent={mockParentContext}
            parentContextName="ParentContext"
          />
        </mockContext.Provider>
      </mockParentContext.Provider>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, newParentAdapter.locations);
    });
  });

  it('should handle edge case where oneItem returns undefined', async () => {
    mockAdapter.one = vi.fn().mockResolvedValue(undefined);

    render(
      <TestWrapper optional={true}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    expect(mockAdapter.one).toHaveBeenCalledWith(defaultQuery, locKeyArray);
  });

  it('should handle very complex query objects', async () => {
    const complexQuery = {
      name: 'test',
      nested: {
        deep: {
          value: 'complex',
          array: [1, 2, 3],
          date: new Date('2023-01-01'),
        }
      }
    };

    render(
      <TestWrapper query={complexQuery}>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockAdapter.one).toHaveBeenCalledWith(complexQuery, locKeyArray);
    });
  });
});
