 
import { Item, PriKey, UUID } from "@fjell/types";
import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PItemFacet } from '../src/primary/PItemFacet';
import * as PItemAdapter from '../src/primary/PItemAdapter';
import * as PItem from '../src/primary/PItem';
import { createStableHash } from '../src/utils';

// @vitest-environment jsdom

type TestItem = Item<'test'>;
type TestItemContextType = PItem.ContextType<TestItem, 'test'>;
type TestItemAdapterContextType = PItemAdapter.ContextType<TestItem, 'test'>;

const TestContext = React.createContext<TestItemContextType | undefined>(undefined);
const AdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

describe('Nested FacetResults Integration Tests', () => {
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

  let mockFacetFn: any;
  let mockItemContext: TestItemContextType;
  let mockAdapterContext: TestItemAdapterContextType;

  beforeEach(() => {
    mockFacetFn = vi.fn();

    mockItemContext = {
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

    mockAdapterContext = {
      name: 'test',
      pkTypes: ['test'],
      all: vi.fn(),
      one: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      action: vi.fn(),
      allAction: vi.fn(),
      allFacet: vi.fn(),
      facet: mockFacetFn,
      find: vi.fn(),
      findOne: vi.fn(),
      set: vi.fn(),
      addActions: vi.fn(),
      addFacets: vi.fn(),
      addAllActions: vi.fn(),
      addAllFacets: vi.fn(),
    };

    vi.clearAllMocks();
  });

  const TestWrapper = ({
    children,
    itemContextValue = mockItemContext
  }: {
    children: React.ReactNode;
    itemContextValue?: TestItemContextType;
  }) => (
    <AdapterContext.Provider value={mockAdapterContext}>
      <TestContext.Provider value={itemContextValue}>
        {children}
      </TestContext.Provider>
    </AdapterContext.Provider>
  );

  describe('Multiple facet calls with same name, different parameters', () => {
    it('should preserve both results when calling same facet with different parameters', async () => {
      let capturedContext: TestItemContextType | null = null;

      const TestChild = () => {
        const context = React.useContext(TestContext);
        capturedContext = context;
        return <div>Test Child</div>;
      };

      // Start with existing facet result for GPH
      const existingGPHHash = createStableHash({ code: 'GPH' });
      const gphResult = { data: 'GPH report data' };
      const itemContextWithGPH = {
        ...mockItemContext,
        facetResults: {
          report: {
            [existingGPHHash]: gphResult
          }
        }
      };

      // Mock facet to return PRT data
      const prtResult = { data: 'PRT report data' };
      mockFacetFn.mockResolvedValue(prtResult);

      // Render PItemFacet for PRT parameters
      render(
        <TestWrapper itemContextValue={itemContextWithGPH}>
          <PItemFacet
            adapter={AdapterContext}
            context={TestContext}
            contextName="TestItem"
            facet="report"
            facetParams={{ code: 'PRT' }}
          >
            <TestChild />
          </PItemFacet>
        </TestWrapper>
      );

      // Wait for facet to complete
      await waitFor(() => {
        expect(capturedContext?.facetResults.report).toBeDefined();
        const reportResults = capturedContext?.facetResults.report;
        expect(Object.keys(reportResults || {})).toHaveLength(2);
      });

      // Verify both results are preserved
      const finalReportResults = capturedContext?.facetResults.report || {};

      // Should have both GPH and PRT results
      expect(finalReportResults[existingGPHHash]).toEqual(gphResult);

      // Find the PRT result key
      const prtHash = createStableHash({ code: 'PRT' });
      expect(finalReportResults[prtHash]).toEqual(prtResult);
    });

    it('should handle multiple different facets independently', async () => {
      let capturedContext: TestItemContextType | null = null;

      const TestChild = () => {
        const context = React.useContext(TestContext);
        capturedContext = context;
        return <div>Test Child</div>;
      };

      // Start with existing results for two different facets
      const reportHash = createStableHash({ code: 'GPH' });
      const statsHash = createStableHash({ period: 'monthly' });

      const itemContextWithMultipleFacets = {
        ...mockItemContext,
        facetResults: {
          report: {
            [reportHash]: { data: 'report data' }
          },
          stats: {
            [statsHash]: { count: 42 }
          }
        }
      };

      // Mock facet to return new analytics data
      const analyticsResult = { metrics: ['cpu', 'memory'] };
      mockFacetFn.mockResolvedValue(analyticsResult);

      // Add a third facet type
      render(
        <TestWrapper itemContextValue={itemContextWithMultipleFacets}>
          <PItemFacet
            adapter={AdapterContext}
            context={TestContext}
            contextName="TestItem"
            facet="analytics"
            facetParams={{ type: 'performance' }}
          >
            <TestChild />
          </PItemFacet>
        </TestWrapper>
      );

      // Wait for facet to complete
      await waitFor(() => {
        expect(capturedContext?.facetResults.analytics).toBeDefined();
      });

      // Verify all three facet types are preserved independently
      const facetResults = capturedContext?.facetResults || {};

      expect(Object.keys(facetResults)).toHaveLength(3);
      expect(facetResults.report[reportHash]).toEqual({ data: 'report data' });
      expect(facetResults.stats[statsHash]).toEqual({ count: 42 });

      const analyticsHash = createStableHash({ type: 'performance' });
      expect(facetResults.analytics[analyticsHash]).toEqual(analyticsResult);
    });

    it('should handle parameter hash stability correctly', () => {
      // Test that parameter hashing is stable across calls
      const params1 = { code: 'GPH', sort: 'asc', limit: 10 };
      const params2 = { limit: 10, code: 'GPH', sort: 'asc' }; // Different order
      const params3 = { code: 'PRT', sort: 'asc', limit: 10 }; // Different value

      const hash1 = createStableHash(params1);
      const hash2 = createStableHash(params2);
      const hash3 = createStableHash(params3);

      // Same params in different order should have same hash
      expect(hash1).toBe(hash2);

      // Different params should have different hash
      expect(hash1).not.toBe(hash3);
    });

    it('should update loading state correctly during facet calls', async () => {
      const capturedLoadingStates: boolean[] = [];

      const TestChild = () => {
        const context = React.useContext(TestContext);
        capturedLoadingStates.push(context?.isLoading || false);
        return <div>Test Child</div>;
      };

      // Mock a slow facet call
      let resolveFacet: any;
      const facetPromise = new Promise((resolve) => {
        resolveFacet = resolve;
      });
      mockFacetFn.mockReturnValue(facetPromise);

      render(
        <TestWrapper>
          <PItemFacet
            adapter={AdapterContext}
            context={TestContext}
            contextName="TestItem"
            facet="slowFacet"
            facetParams={{ data: 'test' }}
          >
            <TestChild />
          </PItemFacet>
        </TestWrapper>
      );

      // Should start as loading
      await waitFor(() => {
        expect(capturedLoadingStates.some(state => state === true)).toBe(true);
      });

      // Resolve the facet
      await act(async () => {
        resolveFacet({ result: 'success' });
        await facetPromise;
      });

      // Should end as not loading
      await waitFor(() => {
        expect(capturedLoadingStates[capturedLoadingStates.length - 1]).toBe(false);
      });
    });
  });

  describe('Error handling with nested structure', () => {
    it('should handle facet errors without corrupting existing results', async () => {
      let capturedContext: TestItemContextType | null = null;

      const TestChild = () => {
        const context = React.useContext(TestContext);
        capturedContext = context;
        return <div>Test Child</div>;
      };

      // Start with existing successful result
      const existingHash = createStableHash({ code: 'GPH' });
      const existingResult = { data: 'successful data' };
      const itemContextWithExisting = {
        ...mockItemContext,
        facetResults: {
          report: {
            [existingHash]: existingResult
          }
        }
      };

      // Mock facet to throw error
      mockFacetFn.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper itemContextValue={itemContextWithExisting}>
          <PItemFacet
            adapter={AdapterContext}
            context={TestContext}
            contextName="TestItem"
            facet="report"
            facetParams={{ code: 'PRT' }}
          >
            <TestChild />
          </PItemFacet>
        </TestWrapper>
      );

      // Wait for error handling to complete
      await waitFor(() => {
        expect(capturedContext?.isLoading).toBe(false);
      });

      // Existing result should still be there, no new result should be added
      const reportResults = capturedContext?.facetResults.report || {};
      expect(Object.keys(reportResults)).toHaveLength(1);
      expect(reportResults[existingHash]).toEqual(existingResult);
    });
  });
});
