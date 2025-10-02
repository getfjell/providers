 
import { ComKey, Item, LocKeyArray, UUID } from '@fjell/core';
import { render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CItemFacet } from '../../src/contained/CItemFacet';
import { ContextType as CItemContextType } from '../../src/contained/CItem';
import { ContextType as CItemAdapterContextType } from '../../src/contained/CItemAdapter';
import * as CItem from '../../src/contained/CItem';
import * as CItemAdapter from '../../src/contained/CItemAdapter';

type TestItem = Item<'test', 'container'>;
type TestItemContextType = CItemContextType<TestItem, 'test', 'container'>;
type TestItemAdapterContextType = CItemAdapterContextType<TestItem, 'test', 'container'>;

const TestContext = React.createContext<TestItemContextType | undefined>(undefined);
const AdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

describe('CItemFacet', () => {
  const locKeyArray: LocKeyArray<'container'> = [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }];
  const itemKey: ComKey<'test', 'container'> = {
    pk: '1-1-1-1-1' as UUID,
    kt: 'test',
    loc: locKeyArray
  };

  const testItem: TestItem = {
    key: itemKey,
    name: 'Test Item',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  } as TestItem;

  const mockFacetResult = { data: 'test facet result', count: 5 };

  let mockAdapterContext: TestItemAdapterContextType;
  let mockItemContext: TestItemContextType;
  let useCItemSpy: any;
  let useCItemAdapterSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdapterContext = {
      name: 'TestAdapter',
      pkTypes: ['test', 'container'] as any,
      all: vi.fn(),
      one: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      allAction: vi.fn(),
      allFacet: vi.fn(),
      action: vi.fn(),
      facet: vi.fn().mockResolvedValue(mockFacetResult),
      find: vi.fn(),
      findOne: vi.fn(),
      set: vi.fn(),
    };

    mockItemContext = {
      name: 'TestItem',
      key: itemKey,
      locations: locKeyArray as any,
      pkTypes: ['test', 'container'] as any,
      item: testItem,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      facetResults: {},
      parentItem: null,
      actions: {},
      facets: {},
      remove: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
    } as any;

    useCItemSpy = vi.spyOn(CItem, 'useCItem').mockReturnValue(mockItemContext as any);
    useCItemAdapterSpy = vi.spyOn(CItemAdapter, 'useCItemAdapter').mockReturnValue(mockAdapterContext as any);
  });

  it('should render children when provided with valid contexts', () => {
    const { getByText } = render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    expect(getByText('Test Child')).toBeDefined();
  });

  it('should use correct context names for hooks', () => {
    render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    expect(useCItemSpy).toHaveBeenCalledWith(TestContext, 'TestItem');
    expect(useCItemAdapterSpy).toHaveBeenCalledWith(AdapterContext, 'TestItemAdapter');
  });

  it('should use custom adapterContext name when provided', () => {
    render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        adapterContext="CustomAdapter"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    expect(useCItemAdapterSpy).toHaveBeenCalledWith(AdapterContext, 'CustomAdapter');
  });

  it('should call adapter.facet with correct parameters', async () => {
    const facetParams = { param1: 'value1', param2: 42 };

    render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
        facetParams={facetParams}
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledWith(
        itemKey,
        'testFacet',
        facetParams
      );
    });
  });

  it('should handle empty facetParams', async () => {
    render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledWith(
        itemKey,
        'testFacet',
        {}
      );
    });
  });

  it('should update context value with facet result', async () => {
    let capturedContextValue: any;

    const TestChild = () => {
      const context = React.useContext(TestContext);
      capturedContextValue = context;
      return <div>Test Child</div>;
    };

    render(
      <TestContext.Provider value={mockItemContext}>
        <CItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChild />
        </CItemFacet>
      </TestContext.Provider>
    );

    await waitFor(() => {
      // Check that facetResults has the nested structure
      expect(capturedContextValue?.facetResults?.testFacet).toBeDefined();
      const facetResultsForTestFacet = capturedContextValue?.facetResults?.testFacet;
      const paramHashKeys = Object.keys(facetResultsForTestFacet || {});
      expect(paramHashKeys).toHaveLength(1);
      expect(facetResultsForTestFacet?.[paramHashKeys[0]]).toEqual(mockFacetResult);
    });
  });

  it('should preserve existing facet results when adding new ones', async () => {
    const existingFacetResults = { existingFacet: { 'existingParamHash': 'existing data' } };
    mockItemContext.facetResults = existingFacetResults;

    let capturedContextValue: any;

    const TestChild = () => {
      const context = React.useContext(TestContext);
      capturedContextValue = context;
      return <div>Test Child</div>;
    };

    render(
      <TestContext.Provider value={mockItemContext}>
        <CItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChild />
        </CItemFacet>
      </TestContext.Provider>
    );

    await waitFor(() => {
      // Check that testFacet results are added with nested structure
      expect(capturedContextValue?.facetResults?.testFacet).toBeDefined();
      const testFacetResults = capturedContextValue?.facetResults?.testFacet;
      const testFacetKeys = Object.keys(testFacetResults || {});
      expect(testFacetKeys).toHaveLength(1);
      expect(testFacetResults?.[testFacetKeys[0]]).toEqual(mockFacetResult);

      // Check that existing facet results are preserved
      expect(capturedContextValue?.facetResults?.existingFacet).toEqual({ 'existingParamHash': 'existing data' });
    });
  });

  it('should handle facet call errors gracefully', async () => {
    mockAdapterContext.facet = vi.fn().mockRejectedValue(new Error('Facet error'));

    let capturedContextValue: any;

    const TestChild = () => {
      const context = React.useContext(TestContext);
      capturedContextValue = context;
      return <div>Test Child</div>;
    };

    render(
      <TestContext.Provider value={mockItemContext}>
        <CItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChild />
        </CItemFacet>
      </TestContext.Provider>
    );

    await waitFor(() => {
      expect(capturedContextValue?.facetResults).toEqual({});
      expect(capturedContextValue?.isLoading).toBe(false);
    });
  });

  it('should manage loading state correctly', async () => {
    const capturedStates: boolean[] = [];

    const TestChild = () => {
      const context = React.useContext(TestContext);
      if (context) {
        capturedStates.push(context.isLoading);
      }
      return <div>Test Child</div>;
    };

    render(
      <TestContext.Provider value={mockItemContext}>
        <CItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChild />
        </CItemFacet>
      </TestContext.Provider>
    );

    await waitFor(() => {
      expect(capturedStates).toContain(true);  // Should start with loading true
      expect(capturedStates).toContain(false); // Should end with loading false
    });
  });

  it('should reflect parent context loading state', async () => {
    mockItemContext.isLoading = true;

    let capturedContextValue: any;

    const TestChild = () => {
      const context = React.useContext(TestContext);
      capturedContextValue = context;
      return <div>Test Child</div>;
    };

    render(
      <TestContext.Provider value={mockItemContext}>
        <CItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChild />
        </CItemFacet>
      </TestContext.Provider>
    );

    await waitFor(() => {
      expect(capturedContextValue?.isLoading).toBe(true);
    });
  });

  it('should re-run facet call when facet parameter changes', async () => {
    const { rerender } = render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(1);
    });

    rerender(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="newFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(2);
      expect(mockAdapterContext.facet).toHaveBeenLastCalledWith(
        itemKey,
        'newFacet',
        {}
      );
    });
  });

  it('should re-run facet call when facetParams change', async () => {
    const { rerender } = render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
        facetParams={{ param1: 'value1' }}
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(1);
    });

    rerender(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
        facetParams={{ param1: 'value2' }}
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(2);
      expect(mockAdapterContext.facet).toHaveBeenLastCalledWith(
        itemKey,
        'testFacet',
        { param1: 'value2' }
      );
    });
  });

  it('should re-run facet call when item key changes', async () => {
    const newItemKey: ComKey<'test', 'container'> = {
      pk: '3-3-3-3-3' as UUID,
      kt: 'test',
      loc: locKeyArray
    };

    const { rerender } = render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(1);
    });

    // Update the mock context with new key
    useCItemSpy.mockReturnValue({
      ...mockItemContext,
      key: newItemKey
    });

    rerender(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(2);
      expect(mockAdapterContext.facet).toHaveBeenLastCalledWith(
        newItemKey,
        'testFacet',
        {}
      );
    });
  });

  it('should re-run facet call when locations change', async () => {
    const newLocations: LocKeyArray<'container'> = [{ lk: '4-4-4-4-4' as UUID, kt: 'container' }];

    const { rerender } = render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(1);
    });

    // Update the mock context with new locations
    useCItemSpy.mockReturnValue({
      ...mockItemContext,
      locations: newLocations
    });

    rerender(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledTimes(2);
    });
  });

  it('should not call facet when required dependencies are missing', () => {
    useCItemSpy.mockReturnValue({
      ...mockItemContext,
      key: null as any
    });

    render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    expect(mockAdapterContext.facet).not.toHaveBeenCalled();
  });

  it('should handle facetParams with various data types', async () => {
    const complexParams = {
      stringParam: 'test',
      numberParam: 42,
      booleanParam: true,
      dateParam: new Date('2023-01-01'),
      arrayParam: ['a', 'b', 'c']
    };

    render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
        facetParams={complexParams}
      >
        <div>Test Child</div>
      </CItemFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.facet).toHaveBeenCalledWith(
        itemKey,
        'testFacet',
        complexParams
      );
    });
  });

  it('should return original context value when item context is null', () => {
    useCItemSpy.mockReturnValue(null as any);

    let capturedContextValue: any;

    const TestChild = () => {
      const context = React.useContext(TestContext);
      capturedContextValue = context;
      return <div>Test Child</div>;
    };

    render(
      <CItemFacet
        adapter={AdapterContext}
        context={TestContext}
        contextName="TestItem"
        facet="testFacet"
      >
        <TestChild />
      </CItemFacet>
    );

    expect(capturedContextValue).toBeNull();
  });

  it('should maintain context structure when no facet result exists', () => {
    let capturedContextValue: any;

    const TestChild = () => {
      const context = React.useContext(TestContext);
      capturedContextValue = context;
      return <div>Test Child</div>;
    };

    render(
      <TestContext.Provider value={mockItemContext}>
        <CItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChild />
        </CItemFacet>
      </TestContext.Provider>
    );

    // Before the facet call completes
    expect(capturedContextValue).toEqual({
      ...mockItemContext,
      isLoading: true,
      facetResults: {}
    });
  });
});
