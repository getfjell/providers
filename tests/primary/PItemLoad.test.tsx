
import { Item, PriKey } from "@fjell/types";
import { Cache } from "@fjell/cache";
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as PItem from '../../src/primary/PItem';
import * as PItemAdapter from '../../src/primary/PItemAdapter';
import { PItemLoad } from '../../src/primary/PItemLoad';

// Test data
const fixedDate = new Date('2023-01-01T00:00:00.000Z');
const testItem: Item<'test'> = {
  key: { kt: 'test', pk: 'test-key' } as PriKey<'test'>,
  id: 'test-id',
  name: 'Test Item',
  createdAt: fixedDate,
  updatedAt: fixedDate,
  events: {
    created: { at: fixedDate },
    updated: { at: fixedDate },
    deleted: { at: null }
  }
};
const priKey = testItem.key;

const createMockCache = () => {
  return {
    coordinate: { kta: ['test'] },
    registry: {},
    api: {},
    operations: {
      retrieve: vi.fn().mockImplementation(async () => {
        return { ...testItem };
      }),
      get: vi.fn().mockImplementation(async () => {
        return { ...testItem };
      }),

      remove: vi.fn().mockImplementation(async () => {
        return null;
      }),

      update: vi.fn().mockImplementation(async () => {
        return { ...testItem };
      }),

      set: vi.fn().mockImplementation(async () => {
      }),

      create: vi.fn().mockImplementation(async () => {
      }),
    }
  } as unknown as Cache<Item<'test'>, 'test'>;
};

let testItemCache: Cache<Item<'test'>, 'test'>;

// Create contexts for testing
const TestItemAdapterContext = React.createContext<PItemAdapter.ContextType<Item<'test'>, 'test'> | undefined>(void 0);
const TestItemProviderContext = React.createContext<PItem.ContextType<Item<'test'>, 'test'> | undefined>(void 0);

// Test adapter component
const TestItemAdapter = ({ children }: { children: React.ReactNode }) => (
  <PItemAdapter.Adapter
    name="test"
    cache={testItemCache}
    context={TestItemAdapterContext}
  >
    {children}
  </PItemAdapter.Adapter>
);

// Test provider component
const TestItemProvider = ({ children, ik, item }: { children: React.ReactNode; ik?: PriKey<'test'> | null; item?: Item<'test'> | null }) => (
  <PItemLoad
    name='TestItemProvider'
    adapter={TestItemAdapterContext}
    context={TestItemProviderContext}
    contextName='TestItemProvider'
    ik={ik}
    item={item}
  >
    {children}
  </PItemLoad>
);

describe('PItemLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the shared cache map before each test
    testItemCache = createMockCache();
  });

  it('should retrieve an item with an itemKey', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    expect(result.current?.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isLoading).toBe(false);
    expect(testItemCache.operations.retrieve).toHaveBeenCalledWith(priKey);
  });

  it('should remove an item', async () => {

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    await act(async () => {
      await result.current?.remove();
    });

    expect(testItemCache.operations.remove).toHaveBeenCalledWith(priKey);
  });

  it('should update an item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    await waitFor(() => expect(result.current?.item).toEqual(testItem));
    const updatedItem = { ...testItem, name: 'Updated Item' };
    await act(async () => {
      await result.current?.update(updatedItem);
    });
    expect(testItemCache.operations.update).toHaveBeenCalledWith(priKey, updatedItem);
  });

  it('should handle loading states', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>{children}</TestItemProvider>
      </TestItemAdapter>
    );
    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isLoading).toBe(false);
    expect(testItemCache.operations.retrieve).toHaveBeenCalled();
  });

  it('should handle provided item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider item={testItem}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );
    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    expect(result.current?.item).toEqual(testItem);
    expect(result.current?.isLoading).toBe(false);
  });

  it('should handle null item key', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={null}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();
  });

  it('should handle invalid item key', async () => {
    const invalidKey = { kt: 'test', pk: '' } as PriKey<'test'>;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={invalidKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );
    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();
  });

  it('should handle changing ik prop', async () => {
    const newPriKey = { kt: 'test', pk: 'new-key' } as PriKey<'test'>;
    const newTestItem: Item<'test'> = {
      ...testItem,
      key: newPriKey,
      id: 'new-id',
      name: 'New Test Item'
    };

    // Mock retrieve to return different items based on key
    testItemCache.operations.retrieve = vi.fn().mockImplementation(async (key: PriKey<'test'>) => {
      return key.pk === 'test-key' ? testItem : newTestItem;
    });

    // Test with first wrapper and first key
    const wrapper1 = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result: result1, unmount } = renderHook(() => React.useContext(TestItemProviderContext), {
      wrapper: wrapper1,
    });

    await waitFor(() => {
      expect(result1.current?.item).toEqual(testItem);
    });

    expect(testItemCache.operations.retrieve).toHaveBeenCalledWith(priKey);
    unmount();

    // Clear cache and test with second wrapper and second key

    const wrapper2 = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={newPriKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result: result2 } = renderHook(() => React.useContext(TestItemProviderContext), {
      wrapper: wrapper2,
    });

    await waitFor(() => {
      expect(result2.current?.item).toEqual(newTestItem);
    });

    expect(testItemCache.operations.retrieve).toHaveBeenCalledWith(newPriKey);
  });

  it('should throw error when both ik and item are provided', () => {
    expect(() => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestItemAdapter>
          <TestItemProvider ik={priKey} item={testItem}>
            {children}
          </TestItemProvider>
        </TestItemAdapter>
      );
      renderHook(() => React.useContext(TestItemProviderContext), { wrapper });
    }).toThrow("TestItemProvider: Cannot provide both 'ik' and 'item' parameters. Please provide only one.");
  });

  it('should handle set operation', async () => {

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    const newItem = { ...testItem, name: 'Set Item' };

    await act(async () => {
      await result.current?.set(newItem);
    });

    expect(testItemCache.operations.set).toHaveBeenCalledWith(priKey, newItem);
  });

  it('should handle action operation', async () => {

    // Mock the action operation
    testItemCache.operations.action = vi.fn().mockImplementation(async () => {
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    const actionBody = { param: 'value' };

    await act(async () => {
      await result.current?.action('testAction', actionBody);
    });

    expect(testItemCache.operations.action).toHaveBeenCalledWith(priKey, 'testAction', actionBody);
  });

  it('should handle facet operation', async () => {

    // Mock the facet operation to return proper cache format
    testItemCache.operations.facet = vi.fn().mockImplementation(async () => {
      return { facetData: 'test' };
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    const facetParams = { param1: 'value1', param2: 42 };

    let facetResult;
    await act(async () => {
      facetResult = await result.current?.facet('testFacet', facetParams);
    });

    expect(testItemCache.operations.facet).toHaveBeenCalledWith(priKey, 'testFacet', facetParams);
    expect(facetResult).toEqual({ facetData: 'test' });
  });

  it('should track isUpdating state during update operation', async () => {
    // Set up cache with item already present to avoid retrieval

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isUpdating).toBe(false);

    const updateData = { name: 'Updating Item' };
    await act(async () => {
      await result.current?.update(updateData);
    });

    expect(result.current?.isUpdating).toBe(false);
    expect(testItemCache.operations.update).toHaveBeenCalledWith(priKey, updateData);
  });

  it('should track isRemoving state during remove operation', async () => {
    // Set up cache with item already present to avoid retrieval

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isRemoving).toBe(false);

    await act(async () => {
      await result.current?.remove();
    });

    expect(result.current?.isRemoving).toBe(false);
    expect(testItemCache.operations.remove).toHaveBeenCalledWith(priKey);
  });

  it('should track isUpdating state during set operation', async () => {
    // Set up cache with item already present to avoid retrieval

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isUpdating).toBe(false);

    const newItem = { ...testItem, name: 'Set Item' };
    await act(async () => {
      await result.current?.set(newItem);
    });

    expect(result.current?.isUpdating).toBe(false);
    expect(testItemCache.operations.set).toHaveBeenCalledWith(priKey, newItem);
  });

  it('should track isUpdating state during action operation', async () => {
    // Set up cache with item already present to avoid retrieval

    // Mock the action operation
    testItemCache.operations.action = vi.fn().mockImplementation(async () => {
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isUpdating).toBe(false);

    await act(async () => {
      await result.current?.action('testAction', { param: 'value' });
    });

    expect(result.current?.isUpdating).toBe(false);
    expect(testItemCache.operations.action).toHaveBeenCalledWith(priKey, 'testAction', { param: 'value' });
  });

  it('should throw error when removing without valid itemKey', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={null}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();

    await expect(act(async () => {
      await result.current?.remove();
    })).rejects.toThrow('Item key is required to remove an item in TestItemProvider');
  });

  it('should throw error when updating without valid itemKey', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={null}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();

    await expect(act(async () => {
      await result.current?.update({ name: 'Updated' });
    })).rejects.toThrow('Item key is required to update an item in TestItemProvider');
  });

  it('should throw error when performing action without valid itemKey', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={null}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();

    await expect(act(async () => {
      await result.current?.action('testAction');
    })).rejects.toThrow('Item key is required to perform an action in TestItemProvider');
  });

  it('should throw error when retrieving facet without valid itemKey', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={null}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.isLoading).toBe(false);
    expect(result.current?.item).toBeNull();

    await expect(act(async () => {
      await result.current?.facet('testFacet');
    })).rejects.toThrow('Item key is required to retrieve a facet in TestItemProvider');
  });

  it('should throw error when setting item without valid key', async () => {
    // Set up cache with item already present

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    const invalidItem = { ...testItem, key: null as any };

    await expect(act(async () => {
      await result.current?.set(invalidItem);
    })).rejects.toThrow('Item key is required to set an item in TestItemProvider');
  });

  it('should handle update operation errors', async () => {
    // Set up cache with item already present
    const updateError = new Error('Update failed');
    testItemCache.operations.update = vi.fn().mockRejectedValue(updateError);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    await expect(act(async () => {
      await result.current?.update({ name: 'Updated' });
    })).rejects.toThrow('Update failed');

    expect(result.current?.isUpdating).toBe(false);
  });

  it('should handle remove operation errors', async () => {
    // Set up cache with item already present
    const removeError = new Error('Remove failed');
    testItemCache.operations.remove = vi.fn().mockRejectedValue(removeError);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    await expect(act(async () => {
      await result.current?.remove();
    })).rejects.toThrow('Remove failed');

    expect(result.current?.isRemoving).toBe(false);
  });

  it('should handle facet operation errors', async () => {
    // Set up cache with item already present
    const facetError = new Error('Facet failed');
    testItemCache.operations.facet = vi.fn().mockRejectedValue(facetError);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    await expect(act(async () => {
      await result.current?.facet('testFacet');
    })).rejects.toThrow('Facet failed');
  });

  it('should compute locations from item key', async () => {
    // Set up cache with item already present

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.locations).toEqual([{ kt: 'test', lk: 'test-key' }]);
  });

  it('should return null locations when no item', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={null}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current?.locations).toBeNull();
  });

  it('should load item from cache when available', async () => {
    // Pre-populate cache

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current?.isLoading).toBe(false);
    // Test that the item was loaded successfully
    expect(result.current?.item?.name).toBe('Test Item');
  });

  it('should handle context value structure correctly', async () => {
    // Set up cache with item already present

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestItemAdapter>
        <TestItemProvider ik={priKey}>
          {children}
        </TestItemProvider>
      </TestItemAdapter>
    );

    const { result } = renderHook(() => React.useContext(TestItemProviderContext), { wrapper });

    await waitFor(() => {
      expect(result.current?.item).toEqual(testItem);
    });

    expect(result.current).toHaveProperty('name', 'TestItemProvider');
    expect(result.current).toHaveProperty('key', priKey);
    expect(result.current).toHaveProperty('item', testItem);
    expect(result.current).toHaveProperty('isLoading', false);
    expect(result.current).toHaveProperty('isUpdating', false);
    expect(result.current).toHaveProperty('isRemoving', false);
    expect(result.current).toHaveProperty('pkTypes');
    expect(result.current).toHaveProperty('remove');
    expect(result.current).toHaveProperty('update');
    expect(result.current).toHaveProperty('action');
    expect(result.current).toHaveProperty('facet');
    expect(result.current).toHaveProperty('set');
    expect(result.current).toHaveProperty('locations');
    expect(result.current).toHaveProperty('facetResults', {});
  });
});
