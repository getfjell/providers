import { Item, PriKey } from '@fjell/core';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as PItems from '../../src/primary/PItems';
import * as PItemAdapter from '../../src/primary/PItemAdapter';
import { PItemsProvider } from '../../src/primary/PItemsProvider';

interface TestItem extends Item<'test'> {
  key: PriKey<'test'>;
  events: {
    created: { at: Date };
    updated: { at: Date };
    deleted: { at: null };
  };
  name: string;
}

const testItem: TestItem = {
  key: { kt: 'test', pk: '1-1-1-1-1' },
  name: 'test item',
  events: {
    created: { at: new Date() },
    updated: { at: new Date() },
    deleted: { at: null }
  }
};
 
const TestItemsProviderContext = React.createContext<PItems.ContextType<TestItem, 'test'> | undefined>(undefined);
TestItemsProviderContext.displayName = 'TestItemsProviderContext';
 
const TestItemAdapterContext = React.createContext<PItemAdapter.ContextType<TestItem, 'test'> | undefined>(undefined);
TestItemAdapterContext.displayName = 'TestItemAdapterContext';

const TestItemsAdapter = ({ children }: { children: React.ReactNode }) => {
  const adapter = {
    name: 'test',
    pkTypes: ['test'] as const,
    all: vi.fn().mockResolvedValue([testItem]),
    one: vi.fn().mockResolvedValue(testItem),
    create: vi.fn().mockResolvedValue(testItem),
    get: vi.fn().mockResolvedValue(testItem),
    remove: vi.fn().mockResolvedValue(true),
    retrieve: vi.fn().mockResolvedValue(testItem),
    update: vi.fn().mockResolvedValue(testItem),
    action: vi.fn().mockResolvedValue(testItem),
    allAction: vi.fn().mockResolvedValue([testItem]),
    allFacet: vi.fn().mockResolvedValue({ count: 5, total: 100 }),
    facet: vi.fn().mockResolvedValue({ count: 1 }),
    find: vi.fn().mockResolvedValue([testItem]),
    findOne: vi.fn().mockResolvedValue(testItem),
    set: vi.fn().mockResolvedValue(testItem),
    addAllActions: vi.fn().mockReturnValue({ customAction: vi.fn().mockResolvedValue([testItem]) }),
    addAllFacets: vi.fn().mockReturnValue({ customFacet: vi.fn().mockResolvedValue({ custom: 'data' }) })
  };

  return (
    <TestItemAdapterContext.Provider value={adapter}>
      {children}
    </TestItemAdapterContext.Provider>
  );
};

const TestItemsProvider = ({ children }: { children: React.ReactNode }) => {
  return PItemsProvider<TestItem, 'test'>({
    name: 'test',
    items: [testItem],
    adapter: TestItemAdapterContext,
    context: TestItemsProviderContext,
    contextName: 'TestItemsProviderContext',
    children
  });
};

describe('PItemsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all items', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    // Wait for cache initialization
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const items = await result.current.all();
      expect(items).toEqual([testItem]);
    });
  });

  it('should create an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    // Wait for cache initialization
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const newItem: TestItem = {
        key: { kt: 'test', pk: '2-2-2-2-2' },
        name: 'new test',
        events: testItem.events
      };
      const created = await result.current.create(newItem);
      expect(created).toEqual(testItem);
    });
  });

  it('should set an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    // Wait for cache initialization
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const newItem: TestItem = {
      ...testItem,
      key: { kt: 'test', pk: '3-3-3-3-3' },
      name: 'new name'
    };

    await act(async () => {
      const retItem = await result.current.set(newItem.key, newItem);
      expect(retItem).toEqual(testItem);
    });
  });

  it('should fetch one item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const item = await result.current.one();
      expect(item).toEqual(testItem);
    });
  });

  it('should update an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const updateData = { name: 'updated item' };
    await act(async () => {
      const updated = await result.current.update(testItem.key, updateData);
      expect(updated).toEqual(testItem);
    });
  });

  it('should remove an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const removed = await result.current.remove(testItem.key);
      expect(removed).toBe(true);
    });
  });

  it('should execute all action', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const actionResult = await result.current.allAction('testAction', { param: 'value' });
      expect(actionResult).toEqual([testItem]);
    });
  });

  it('should execute all facet', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const facetResult = await result.current.allFacet('count', { filter: 'active' });
      expect(facetResult).toEqual({ count: 5, total: 100 });
    });
  });

  it('should execute item action', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const actionResult = await result.current.action(testItem.key, 'activate', { reason: 'test' });
      expect(actionResult).toEqual(testItem);
    });
  });

  it('should execute item facet', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const facetResult = await result.current.facet(testItem.key, 'details', { include: 'metadata' });
      expect(facetResult).toEqual({ count: 1 });
    });
  });

  it('should find items', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const found = await result.current.find('byName', { name: 'test' });
      expect(found).toEqual([testItem]);
    });
  });

  it('should find one item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const found = await result.current.findOne('byId', { id: '1-1-1-1-1' });
      expect(found).toEqual(testItem);
    });
  });

  it('should handle loading states during operations', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isRemoving).toBe(false);
    });
  });

  it('should provide context values correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.name).toBe('test');
      expect(result.current.pkTypes).toEqual(['test']);
      expect(result.current.items).toEqual([testItem]);
      expect(result.current.facetResults).toEqual({});
    });
  });

  it('should handle isLoadingParam prop', async () => {
    const TestItemsProviderWithLoading = ({ children }: { children: React.ReactNode }) => {
      return PItemsProvider<TestItem, 'test'>({
        name: 'test',
        items: [testItem],
        adapter: TestItemAdapterContext,
        context: TestItemsProviderContext,
        contextName: 'TestItemsProviderContext',
        isLoadingParam: true,
        children
      });
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProviderWithLoading>
          {children}
        </TestItemsProviderWithLoading>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.isLoading).toBe(true);
    });
  });

  it('should handle overrides for all method', async () => {
    const customAllOverride = vi.fn().mockResolvedValue([{ ...testItem, name: 'overridden' }]);

    const TestItemsProviderWithOverrides = ({ children }: { children: React.ReactNode }) => {
      return PItemsProvider<TestItem, 'test'>({
        name: 'test',
        items: [testItem],
        adapter: TestItemAdapterContext,
        context: TestItemsProviderContext,
        contextName: 'TestItemsProviderContext',
        overrides: {
          all: customAllOverride
        },
        children
      });
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProviderWithOverrides>
          {children}
        </TestItemsProviderWithOverrides>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const items = await result.current.all();
      expect(customAllOverride).toHaveBeenCalled();
      expect(items).toEqual([{ ...testItem, name: 'overridden' }]);
    });
  });

  it('should handle overrides for one method', async () => {
    const customOneOverride = vi.fn().mockResolvedValue({ ...testItem, name: 'overridden one' });

    const TestItemsProviderWithOverrides = ({ children }: { children: React.ReactNode }) => {
      return PItemsProvider<TestItem, 'test'>({
        name: 'test',
        items: [testItem],
        adapter: TestItemAdapterContext,
        context: TestItemsProviderContext,
        contextName: 'TestItemsProviderContext',
        overrides: {
          one: customOneOverride
        },
        children
      });
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProviderWithOverrides>
          {children}
        </TestItemsProviderWithOverrides>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const item = await result.current.one();
      expect(customOneOverride).toHaveBeenCalled();
      expect(item).toEqual({ ...testItem, name: 'overridden one' });
    });
  });

  it('should handle renderEach functionality', () => {
    const renderEachSpy = vi.fn((item: TestItem) => React.createElement('div', { key: item.key.pk }, item.name));

    const TestItemsProviderWithRenderEach = ({ children }: { children: React.ReactNode }) => {
      return PItemsProvider<TestItem, 'test'>({
        name: 'test',
        items: [testItem],
        adapter: TestItemAdapterContext,
        context: TestItemsProviderContext,
        contextName: 'TestItemsProviderContext',
        renderEach: renderEachSpy,
        children
      });
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProviderWithRenderEach>
          {children}
        </TestItemsProviderWithRenderEach>
      </TestItemsAdapter>
    );

    render(React.createElement(wrapper, { children: React.createElement('div', {}, 'test children') }));

    expect(renderEachSpy).toHaveBeenCalledWith(testItem);
  });

  it('should handle result prop', async () => {
    const customResult = { custom: 'result data', count: 42 };

    const TestItemsProviderWithResult = ({ children }: { children: React.ReactNode }) => {
      return PItemsProvider<TestItem, 'test'>({
        name: 'test',
        items: [testItem],
        facetResults: customResult,
        adapter: TestItemAdapterContext,
        context: TestItemsProviderContext,
        contextName: 'TestItemsProviderContext',
        children
      });
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProviderWithResult>
          {children}
        </TestItemsProviderWithResult>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.facetResults).toEqual(customResult);
    });
  });

  it('should handle allActions and allFacets from adapter', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapter>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapter>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
      expect(result.current.allActions).toBeDefined();
      expect(result.current.allFacets).toBeDefined();
    });
  });

  it('should handle findOne returning null', async () => {
    const TestItemsAdapterWithoutFindOne = ({ children }: { children: React.ReactNode }) => {
      const adapter = {
        name: 'test',
        pkTypes: ['test'] as const,
        all: vi.fn().mockResolvedValue([testItem]),
        one: vi.fn().mockResolvedValue(testItem),
        create: vi.fn().mockResolvedValue(testItem),
        get: vi.fn().mockResolvedValue(testItem),
        remove: vi.fn().mockResolvedValue(true),
        retrieve: vi.fn().mockResolvedValue(testItem),
        update: vi.fn().mockResolvedValue(testItem),
        action: vi.fn().mockResolvedValue(testItem),
        allAction: vi.fn().mockResolvedValue([testItem]),
        allFacet: vi.fn().mockResolvedValue({ count: 5, total: 100 }),
        facet: vi.fn().mockResolvedValue({ count: 1 }),
        find: vi.fn().mockResolvedValue([testItem]),
        findOne: vi.fn().mockResolvedValue(null), // Mock to return null to test conditional behavior
        set: vi.fn().mockResolvedValue(testItem),
        addAllActions: vi.fn().mockReturnValue({ customAction: vi.fn().mockResolvedValue([testItem]) }),
        addAllFacets: vi.fn().mockReturnValue({ customFacet: vi.fn().mockResolvedValue({ custom: 'data' }) })
      };

      return (
        <TestItemAdapterContext.Provider value={adapter}>
          {children}
        </TestItemAdapterContext.Provider>
      );
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemsAdapterWithoutFindOne>
        <TestItemsProvider>
          {children}
        </TestItemsProvider>
      </TestItemsAdapterWithoutFindOne>
    );

    const { result } = renderHook(() => PItems.usePItems(TestItemsProviderContext, 'TestItemsProviderContext'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      const found = await result.current.findOne('byId', { id: '1-1-1-1-1' });
      expect(found).toBe(null); // When findOne returns null
    });
  });
});
