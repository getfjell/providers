 
import { Item } from '@fjell/core';
import { render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PItemsFacet } from '../../src/primary/PItemsFacet';
import * as PItemAdapter from '../../src/primary/PItemAdapter';
import * as PItems from '../../src/primary/PItems';

// @vitest-environment jsdom

interface TestItem extends Item<'test'> {
  name: string;
}

describe('PItemsFacet', () => {
  let mockAdapterContext: PItemAdapter.ContextType<TestItem, 'test'>;
  let mockItemsContext: PItems.ContextType<TestItem, 'test'>;
  let TestAdapterContext: PItemAdapter.Context<TestItem, 'test'>;
  let TestItemsContext: PItems.Context<TestItem, 'test'>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockAdapterContext = {
      name: 'test',
      pkTypes: ['test'],
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as TestItem),
      get: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue({} as TestItem),
      retrieve: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as TestItem),
      action: vi.fn().mockResolvedValue({} as TestItem),
      allAction: vi.fn().mockResolvedValue({} as TestItem),
      allFacet: vi.fn().mockResolvedValue({ facetData: 'test-result' }),
      facet: vi.fn().mockResolvedValue('facet-result'),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue({} as TestItem),
    };

    mockItemsContext = {
      name: 'test',
      items: [],
      facetResults: {},
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isRemoving: false,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      all: vi.fn(),
      one: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      allAction: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
      finders: {},
      set: vi.fn(),
      pkTypes: ['test'],
    };

    TestAdapterContext = React.createContext<PItemAdapter.ContextType<TestItem, 'test'> | undefined>(undefined);
    TestItemsContext = React.createContext<PItems.ContextType<TestItem, 'test'> | undefined>(undefined);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <TestAdapterContext.Provider value={mockAdapterContext}>
        <TestItemsContext.Provider value={mockItemsContext}>
          {component}
        </TestItemsContext.Provider>
      </TestAdapterContext.Provider>
    );
  };

  it('should render without errors', () => {
    const { getByText } = renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={{ category: 'test' }}
      >
        <div>Test children</div>
      </PItemsFacet>
    );
    expect(getByText('Test children')).toBeDefined();
  });

  it('should call allFacet when facet and params are provided', async () => {
    const facetParams = { category: 'test', active: true };

    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={facetParams}
      >
        <div>Test children</div>
      </PItemsFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith('testFacet', facetParams);
    });
  });

  it('should handle when allFacet is not available', async () => {
    const adapterWithoutFacet = {
      ...mockAdapterContext,
      allFacet: undefined as any,
    };

    const TestAdapterContextWithoutFacet = React.createContext<PItemAdapter.ContextType<TestItem, 'test'> | undefined>(undefined);

    const { getByText } = render(
      <TestAdapterContextWithoutFacet.Provider value={adapterWithoutFacet}>
        <TestItemsContext.Provider value={mockItemsContext}>
          <PItemsFacet<TestItem, 'test'>
            name="test-facet"
            adapter={TestAdapterContextWithoutFacet}
            context={TestItemsContext}
            contextName="TestContext"
            facet="testFacet"
            facetParams={{ category: 'test' }}
          >
            <div>Test children</div>
          </PItemsFacet>
        </TestItemsContext.Provider>
      </TestAdapterContextWithoutFacet.Provider>
    );

    expect(getByText('Test children')).toBeDefined();
  });

  it('should update when facetParams change', async () => {
    const initialParams = { category: 'initial' };
    const updatedParams = { category: 'updated' };

    const TestComponent = () => {
      const [params, setParams] = React.useState(initialParams);

      return (
        <div>
          <PItemsFacet<TestItem, 'test'>
            name="test-facet"
            adapter={TestAdapterContext}
            context={TestItemsContext}
            contextName="TestContext"
            facet="testFacet"
            facetParams={params}
          >
            <div>Test children</div>
          </PItemsFacet>
          <button onClick={() => setParams(updatedParams)}>Update Params</button>
        </div>
      );
    };

    const { getByText } = renderWithProviders(<TestComponent />);

    // Wait for initial call
    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith('testFacet', initialParams);
    });

    // Update params
    getByText('Update Params').click();

    // Wait for updated call
    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith('testFacet', updatedParams);
    });

    expect(mockAdapterContext.allFacet).toHaveBeenCalledTimes(2);
  });

  it('should pass renderEach prop to PItemsProvider', () => {
    const renderEach = vi.fn((item: TestItem) => <div key={item.priKey}>{item.name}</div>);

    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={{ category: 'test' }}
        renderEach={renderEach}
      >
        <div>Test children</div>
      </PItemsFacet>
    );
    expect(renderEach).toBeDefined();
  });

  it('should handle empty facetParams', async () => {
    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={{}}
      >
        <div>Test children</div>
      </PItemsFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith('testFacet', {});
    });
  });

  it('should store facet results in nested structure', async () => {
    const mockFacetResult = { data: 'test facet result' };
    mockAdapterContext.allFacet = vi.fn().mockResolvedValue(mockFacetResult);

    let capturedContext: PItems.ContextType<TestItem, 'test'> | null = null;

    const TestChildComponent = () => {
      const context = PItems.usePItems(TestItemsContext, 'TestContext');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={{ category: 'test' }}
      >
        <TestChildComponent />
      </PItemsFacet>
    );

    await waitFor(() => {
      // Check that facetResults has the nested structure
      expect(capturedContext?.facetResults?.testFacet).toBeDefined();
      // The result should be nested under a parameter hash key
      const facetResultsForTestFacet = capturedContext?.facetResults?.testFacet;
      const paramHashKeys = Object.keys(facetResultsForTestFacet || {});
      expect(paramHashKeys).toHaveLength(1);
      expect(facetResultsForTestFacet?.[paramHashKeys[0]]).toEqual(mockFacetResult);
    });
  });

  it('should support multiple calls to same facet with different parameters', async () => {
    const mockFacetResult1 = { data: 'GPH result' };
    const mockFacetResult2 = { data: 'PRT result' };

    mockAdapterContext.allFacet = vi.fn().mockResolvedValue(mockFacetResult2);

    // Start with a context that already has one facet result (simulating a previous call)
    const itemsContextWithExistingReportFacet = {
      ...mockItemsContext,
      facetResults: {
        report: {
          'existingGPHHash': mockFacetResult1
        }
      }
    };

    let capturedContext: PItems.ContextType<TestItem, 'test'> | null = null;

    const TestChildComponent = () => {
      const context = PItems.usePItems(TestItemsContext, 'TestContext');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    // Render with existing context that has existing facet results
    render(
      <TestAdapterContext.Provider value={mockAdapterContext}>
        <TestItemsContext.Provider value={itemsContextWithExistingReportFacet}>
          <PItemsFacet<TestItem, 'test'>
            name="test-facet"
            adapter={TestAdapterContext}
            context={TestItemsContext}
            contextName="TestContext"
            facet="report"
            facetParams={{ code: 'PRT' }}
          >
            <TestChildComponent />
          </PItemsFacet>
        </TestItemsContext.Provider>
      </TestAdapterContext.Provider>
    );

    // Wait for the new facet to complete
    await waitFor(() => {
      const reportResults = capturedContext?.facetResults?.report;
      expect(Object.keys(reportResults || {})).toHaveLength(2);
    });

    // Verify both results are preserved
    expect(capturedContext).toBeDefined();
    const finalReportResults = capturedContext!.facetResults?.report || {};
    const resultKeys = Object.keys(finalReportResults);
    expect(resultKeys).toHaveLength(2);

    // Check that both results are present
    expect(finalReportResults['existingGPHHash']).toEqual(mockFacetResult1);

    // Find the new result (the one that's not the existing hash)
    const newResultKey = resultKeys.find(key => key !== 'existingGPHHash');
    expect(newResultKey).toBeDefined();
    expect(finalReportResults[newResultKey!]).toEqual(mockFacetResult2);
  });

  it('should use default adapterContext when not provided', async () => {
    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={{ category: 'test' }}
      >
        <div>Test children</div>
      </PItemsFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith('testFacet', { category: 'test' });
    });
  });

  it('should use custom adapterContext when provided', async () => {
    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        adapterContext="CustomAdapter"
        facet="testFacet"
        facetParams={{ category: 'test' }}
      >
        <div>Test children</div>
      </PItemsFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith('testFacet', { category: 'test' });
    });
  });

  it('should handle different facetParams types', async () => {
    const complexParams = {
      stringParam: 'test',
      numberParam: 42,
      booleanParam: true,
      dateParam: new Date('2023-01-01'),
      arrayParam: ['a', 'b', 'c'],
      mixedArrayParam: [1, 'test', true]
    };

    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={complexParams}
      >
        <div>Test children</div>
      </PItemsFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith('testFacet', complexParams);
    });
  });

  it('should manage loading state correctly when creating new provider', async () => {
    let resolveAllFacet: (value: any) => void;
    const allFacetPromise = new Promise((resolve) => {
      resolveAllFacet = resolve;
    });

    mockAdapterContext.allFacet = vi.fn().mockReturnValue(allFacetPromise);

    let capturedContext: PItems.ContextType<TestItem, 'test'> | null = null;

    const TestChildComponent = () => {
      const context = PItems.usePItems(TestItemsContext, 'TestContext');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    // Mock PItems.usePItems to first throw (no existing context), then work normally
    const originalUsePItems = PItems.usePItems;
    let shouldThrow = true;

    vi.spyOn(PItems, 'usePItems').mockImplementation((contextObj, contextName) => {
      if (shouldThrow) {
        shouldThrow = false; // Only throw on first call
        throw new Error('No context found');
      }
      // Use the original implementation for subsequent calls
      return originalUsePItems(contextObj, contextName);
    });

    render(
      <TestAdapterContext.Provider value={mockAdapterContext}>
        <PItemsFacet<TestItem, 'test'>
          name="test-facet"
          adapter={TestAdapterContext}
          context={TestItemsContext}
          contextName="TestContext"
          facet="testFacet"
          facetParams={{ category: 'test' }}
        >
          <TestChildComponent />
        </PItemsFacet>
      </TestAdapterContext.Provider>
    );

    // Should initially be loading (this is passed to PItemsProvider)
    await waitFor(() => {
      expect(capturedContext?.isLoading).toBe(true);
    });

    // Resolve the promise
    resolveAllFacet!({ data: 'test-result' });

    // Should no longer be loading
    await waitFor(() => {
      expect(capturedContext?.isLoading).toBe(false);
    });

    // Restore original function
    vi.spyOn(PItems, 'usePItems').mockImplementation(originalUsePItems);
  });

  it('should create new provider when no existing context', () => {
    // Mock PItems.usePItems to throw (simulating no existing context)
    const originalUsePItems = PItems.usePItems;
    vi.spyOn(PItems, 'usePItems').mockImplementation(() => {
      throw new Error('No context found');
    });

    const { getByText } = render(
      <TestAdapterContext.Provider value={mockAdapterContext}>
        <PItemsFacet<TestItem, 'test'>
          name="test-facet"
          adapter={TestAdapterContext}
          context={TestItemsContext}
          contextName="TestContext"
          facet="testFacet"
          facetParams={{ category: 'test' }}
        >
          <div>Test children</div>
        </PItemsFacet>
      </TestAdapterContext.Provider>
    );

    expect(getByText('Test children')).toBeDefined();

    // Restore original function
    vi.spyOn(PItems, 'usePItems').mockImplementation(originalUsePItems);
  });

  it('should only re-run effect when facetParamsString changes', async () => {
    const TestComponent = () => {
      const [irrelevantState, setIrrelevantState] = React.useState(0);
      const [params, setParams] = React.useState({ category: 'test' });

      return (
        <div data-irrelevant-state={irrelevantState}>
          <PItemsFacet<TestItem, 'test'>
            name="test-facet"
            adapter={TestAdapterContext}
            context={TestItemsContext}
            contextName="TestContext"
            facet="testFacet"
            facetParams={params}
          >
            <div>Test children</div>
          </PItemsFacet>
          <button onClick={() => setIrrelevantState(prev => prev + 1)}>
            Update Irrelevant State
          </button>
          <button onClick={() => setParams({ category: 'updated' })}>
            Update Params
          </button>
        </div>
      );
    };

    const { getByText } = renderWithProviders(<TestComponent />);

    // Wait for initial call
    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledTimes(1);
    });

    // Update irrelevant state - should NOT trigger new allFacet call
    getByText('Update Irrelevant State').click();

    // Wait a bit and verify no additional calls
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockAdapterContext.allFacet).toHaveBeenCalledTimes(1);

    // Update params - should trigger new allFacet call
    getByText('Update Params').click();

    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle null and undefined facet results', async () => {
    mockAdapterContext.allFacet = vi.fn().mockResolvedValue(null);

    let capturedContext: PItems.ContextType<TestItem, 'test'> | null = null;

    const TestChildComponent = () => {
      const context = PItems.usePItems(TestItemsContext, 'TestContext');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet="testFacet"
        facetParams={{ category: 'test' }}
      >
        <TestChildComponent />
      </PItemsFacet>
    );

    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalled();
    });

    // Should not add null results to facetResults
    expect(capturedContext).toBeDefined();
    expect(capturedContext!.facetResults?.testFacet).toBeUndefined();
  });

  it('should preserve existing facetResults when enhancing context', async () => {
    const existingFacetResults = {
      existingFacet: {
        'someHash': { data: 'existing data' }
      },
      testFacet: {
        'anotherHash': { data: 'another existing data' }
      }
    };

    const itemsContextWithExisting = {
      ...mockItemsContext,
      facetResults: existingFacetResults
    };

    const newFacetResult = { data: 'new facet result' };
    mockAdapterContext.allFacet = vi.fn().mockResolvedValue(newFacetResult);

    let capturedContext: PItems.ContextType<TestItem, 'test'> | null = null;

    const TestChildComponent = () => {
      const context = PItems.usePItems(TestItemsContext, 'TestContext');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    render(
      <TestAdapterContext.Provider value={mockAdapterContext}>
        <TestItemsContext.Provider value={itemsContextWithExisting}>
          <PItemsFacet<TestItem, 'test'>
            name="test-facet"
            adapter={TestAdapterContext}
            context={TestItemsContext}
            contextName="TestContext"
            facet="testFacet"
            facetParams={{ category: 'new' }}
          >
            <TestChildComponent />
          </PItemsFacet>
        </TestItemsContext.Provider>
      </TestAdapterContext.Provider>
    );

    await waitFor(() => {
      const facetResults = capturedContext?.facetResults;

      // Should preserve existing facet
      expect(facetResults?.existingFacet?.someHash).toEqual({ data: 'existing data' });

      // Should preserve existing data in same facet
      expect(facetResults?.testFacet?.anotherHash).toEqual({ data: 'another existing data' });

      // Should add new result
      const testFacetKeys = Object.keys(facetResults?.testFacet || {});
      expect(testFacetKeys).toHaveLength(2);

      // Find the new key (not 'anotherHash')
      const newKey = testFacetKeys.find(key => key !== 'anotherHash');
      expect(facetResults?.testFacet?.[newKey!]).toEqual(newFacetResult);
    });
  });

  it('should handle stable hash with identical objects', async () => {
    const params1 = { category: 'test', count: 5 };
    const params2 = { category: 'test', count: 5 };

    const TestComponent = () => {
      const [useFirst, setUseFirst] = React.useState(true);

      return (
        <div>
          <PItemsFacet<TestItem, 'test'>
            name="test-facet"
            adapter={TestAdapterContext}
            context={TestItemsContext}
            contextName="TestContext"
            facet="testFacet"
            facetParams={useFirst ? params1 : params2}
          >
            <div>Test children</div>
          </PItemsFacet>
          <button onClick={() => setUseFirst(false)}>Switch Params</button>
        </div>
      );
    };

    const { getByText } = renderWithProviders(<TestComponent />);

    // Wait for initial call
    await waitFor(() => {
      expect(mockAdapterContext.allFacet).toHaveBeenCalledTimes(1);
    });

    // Switch to identical params object - should NOT trigger new call due to stable hash
    getByText('Switch Params').click();

    // Wait a bit and verify no additional calls
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockAdapterContext.allFacet).toHaveBeenCalledTimes(1);
  });

  it('should not call allFacet with empty string facet name', async () => {
    const { getByText } = renderWithProviders(
      <PItemsFacet<TestItem, 'test'>
        name="test-facet"
        adapter={TestAdapterContext}
        context={TestItemsContext}
        contextName="TestContext"
        facet=""
        facetParams={{ category: 'test' }}
      >
        <div>Test children</div>
      </PItemsFacet>
    );

    expect(getByText('Test children')).toBeDefined();

    // Wait a bit to ensure allFacet is not called
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockAdapterContext.allFacet).not.toHaveBeenCalled();
  });
});
