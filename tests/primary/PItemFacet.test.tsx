/* eslint-disable no-undefined */
import { Item, PriKey, UUID } from '@fjell/core';
import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PItemFacet } from '../../src/primary/PItemFacet';
import * as PItemAdapter from '../../src/primary/PItemAdapter';
import * as PItem from '../../src/primary/PItem';

type TestItem = Item<'test'>;
type TestItemContextType = PItem.ContextType<TestItem, 'test'>;
type TestItemAdapterContextType = PItemAdapter.ContextType<TestItem, 'test'>;

const TestContext = React.createContext<TestItemContextType | undefined>(undefined);
const AdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

describe('PItemFacet', () => {
  const itemKey: PriKey<'test'> = { pk: '1-1-1-1-1' as UUID, kt: 'test' };

  const testItem: TestItem = {
    key: itemKey,
    name: 'Test Item',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  } as TestItem;

  const mockFacetFn = vi.fn();

  const mockItemContext: TestItemContextType = {
    name: 'TestItem',
    key: itemKey,
    pkTypes: ['test'],
    item: testItem,
    isLoading: false,
    isUpdating: false,
    isRemoving: false,
    actions: {},
    facets: {},
    facetResults: {},
    remove: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    action: vi.fn(),
    facet: vi.fn(),
  };

  const mockAdapterContext: TestItemAdapterContextType = {
    name: 'TestAdapter',
    cacheMap: {} as any,
    pkTypes: ['test'],
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
    facet: mockFacetFn,
    find: vi.fn(),
    findOne: vi.fn(),
    set: vi.fn(),
  };

  const TestWrapper = ({
    children,
    itemContextValue = mockItemContext,
    adapterContextValue = mockAdapterContext
  }: {
    children: React.ReactNode;
    itemContextValue?: TestItemContextType;
    adapterContextValue?: TestItemAdapterContextType;
  }) => (
    <AdapterContext.Provider value={adapterContextValue}>
      <TestContext.Provider value={itemContextValue}>
        {children}
      </TestContext.Provider>
    </AdapterContext.Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockFacetFn.mockReset();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <div>Test Child</div>
        </PItemFacet>
      </TestWrapper>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('uses default adapterContext name when not provided', () => {
    const TestChildComponent = () => {
      const context = PItem.usePItem(TestContext, 'TestItem');
      return <div data-testid="child">{context.name}</div>;
    };

    render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChildComponent />
        </PItemFacet>
      </TestWrapper>
    );

    // The component should use "TestItemAdapter" as the default adapter context name
    // and the test should pass without throwing errors about missing context
  });

  it('calls adapter facet method with correct parameters', async () => {
    const mockFacetResult = { data: 'facet result' };
    mockFacetFn.mockResolvedValue(mockFacetResult);

    const facetParams = { param1: 'value1', param2: 42 };

    render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
          facetParams={facetParams}
        >
          <div>Test Child</div>
        </PItemFacet>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFacetFn).toHaveBeenCalledWith(
        itemKey,
        'testFacet',
        facetParams
      );
    });
  });

  it('updates context with facet results using nested structure', async () => {
    const mockFacetResult = { data: 'facet result' };
    mockFacetFn.mockResolvedValue(mockFacetResult);

    let capturedContext: TestItemContextType | null = null;

    const TestChildComponent = () => {
      const context = PItem.usePItem(TestContext, 'TestItem');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    const facetParams = { param1: 'value1' };

    render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
          facetParams={facetParams}
        >
          <TestChildComponent />
        </PItemFacet>
      </TestWrapper>
    );

    await waitFor(() => {
      // Check that facetResults has the nested structure
      expect(capturedContext?.facetResults.testFacet).toBeDefined();
      // The result should be nested under a parameter hash key
      const facetResultsForTestFacet = capturedContext?.facetResults.testFacet;
      const paramHashKeys = Object.keys(facetResultsForTestFacet || {});
      expect(paramHashKeys).toHaveLength(1);
      expect(facetResultsForTestFacet?.[paramHashKeys[0]]).toEqual(mockFacetResult);
    });

    expect(capturedContext!.isLoading).toBe(false);
  });

  it('supports multiple calls to same facet with different parameters', async () => {
    const mockFacetResult1 = { data: 'GPH result' };
    const mockFacetResult2 = { data: 'PRT result' };

    mockFacetFn.mockResolvedValue(mockFacetResult2);

    // Start with a context that already has one facet result (simulating a previous call)
    const itemContextWithExistingReportFacet = {
      ...mockItemContext,
      facetResults: {
        report: {
          'existingGPHHash': mockFacetResult1
        }
      }
    };

    let capturedContext: TestItemContextType | null = null;

    const TestChildComponent = () => {
      const context = PItem.usePItem(TestContext, 'TestItem');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    // Call facet with PRT parameters - this should add to the existing GPH results
    render(
      <TestWrapper itemContextValue={itemContextWithExistingReportFacet}>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="report"
          facetParams={{ code: 'PRT' }}
        >
          <TestChildComponent />
        </PItemFacet>
      </TestWrapper>
    );

    // Wait for the new facet to complete
    await waitFor(() => {
      const reportResults = capturedContext?.facetResults.report;
      expect(Object.keys(reportResults || {})).toHaveLength(2);
    });

    // Verify both results are preserved
    const finalReportResults = capturedContext?.facetResults.report || {};
    const resultKeys = Object.keys(finalReportResults);
    expect(resultKeys).toHaveLength(2);

    // Check that both results are present
    expect(finalReportResults['existingGPHHash']).toEqual(mockFacetResult1);

    // Find the new result (the one that's not the existing hash)
    const newResultKey = resultKeys.find(key => key !== 'existingGPHHash');
    expect(newResultKey).toBeDefined();
    expect(finalReportResults[newResultKey!]).toEqual(mockFacetResult2);
  });

  it('handles facet loading state correctly', async () => {
    const mockFacetResult = { data: 'facet result' };
    let resolveFacet: (value: any) => void;
    const facetPromise = new Promise((resolve) => {
      resolveFacet = resolve;
    });
    mockFacetFn.mockReturnValue(facetPromise);

    let capturedContext: TestItemContextType | null = null;

    const TestChildComponent = () => {
      const context = PItem.usePItem(TestContext, 'TestItem');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChildComponent />
        </PItemFacet>
      </TestWrapper>
    );

    // Initially should be loading
    await waitFor(() => {
      expect(capturedContext?.isLoading).toBe(true);
    });

    // Resolve the facet call
    await act(async () => {
      resolveFacet(mockFacetResult);
      await facetPromise;
    });

    // Should no longer be loading
    await waitFor(() => {
      expect(capturedContext?.isLoading).toBe(false);
    });
  });

  it('handles facet errors gracefully', async () => {
    mockFacetFn.mockRejectedValue(new Error('Facet error'));

    let capturedContext: TestItemContextType | null = null;

    const TestChildComponent = () => {
      const context = PItem.usePItem(TestContext, 'TestItem');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <TestChildComponent />
        </PItemFacet>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(capturedContext?.isLoading).toBe(false);
    });

    // Facet result should not be set when there's an error
    expect(capturedContext!.facetResults.testFacet).toBeUndefined();
  });

  it('re-queries when facet parameters change', async () => {
    const mockFacetResult1 = { data: 'result 1' };
    const mockFacetResult2 = { data: 'result 2' };
    mockFacetFn
      .mockResolvedValueOnce(mockFacetResult1)
      .mockResolvedValueOnce(mockFacetResult2);

    const { rerender } = render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
          facetParams={{ param1: 'value1' }}
        >
          <div>Test Child</div>
        </PItemFacet>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFacetFn).toHaveBeenCalledWith(
        itemKey,
        'testFacet',
        { param1: 'value1' }
      );
    });

    // Change parameters
    rerender(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
          facetParams={{ param1: 'value2' }}
        >
          <div>Test Child</div>
        </PItemFacet>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFacetFn).toHaveBeenCalledWith(
        itemKey,
        'testFacet',
        { param1: 'value2' }
      );
    });

    expect(mockFacetFn).toHaveBeenCalledTimes(2);
  });

  it('preserves existing facet results when adding new ones', async () => {
    const mockFacetResult = { data: 'new facet result' };
    mockFacetFn.mockResolvedValue(mockFacetResult);

    const itemContextWithExistingFacets = {
      ...mockItemContext,
      facetResults: { existingFacet: { 'existingParamHash': { data: 'existing' } } }
    };

    let capturedContext: TestItemContextType | null = null;

    const TestChildComponent = () => {
      const context = PItem.usePItem(TestContext, 'TestItem');
      capturedContext = context;
      return <div>Test Child</div>;
    };

    render(
      <TestWrapper itemContextValue={itemContextWithExistingFacets}>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="newFacet"
        >
          <TestChildComponent />
        </PItemFacet>
      </TestWrapper>
    );

    await waitFor(() => {
      // Check that newFacet results are added with nested structure
      expect(capturedContext?.facetResults.newFacet).toBeDefined();
      const newFacetResults = capturedContext?.facetResults.newFacet;
      const newFacetKeys = Object.keys(newFacetResults || {});
      expect(newFacetKeys).toHaveLength(1);
      expect(newFacetResults?.[newFacetKeys[0]]).toEqual(mockFacetResult);

      // Check that existing facet results are preserved
      expect(capturedContext?.facetResults.existingFacet).toEqual({ 'existingParamHash': { data: 'existing' } });
    });
  });

  it('does not call facet when required dependencies are missing', () => {
    const itemContextWithoutKey = {
      ...mockItemContext,
      key: null as any
    };

    render(
      <TestWrapper itemContextValue={itemContextWithoutKey}>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          facet="testFacet"
        >
          <div>Test Child</div>
        </PItemFacet>
      </TestWrapper>
    );

    expect(mockFacetFn).not.toHaveBeenCalled();
  });

  it('uses custom adapterContext when provided', () => {
    const { getByText } = render(
      <TestWrapper>
        <PItemFacet
          adapter={AdapterContext}
          context={TestContext}
          contextName="TestItem"
          adapterContext="CustomAdapter"
          facet="testFacet"
        >
          <div>Test Child</div>
        </PItemFacet>
      </TestWrapper>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
    // The component should work without errors when using a custom adapter context name
  });
});
