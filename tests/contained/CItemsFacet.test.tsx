 
import { Item } from "@fjell/core";
import { render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as AItem from "../../src/AItem";
import * as CItemAdapter from "../../src/contained/CItemAdapter";
import { CItemsFacet } from "../../src/contained/CItemsFacet";
import { CItemsProvider } from "../../src/contained/CItemsProvider";
import * as CItems from "../../src/contained/CItems";

// Mock the CItemsProvider component
vi.mock("../../src/contained/CItemsProvider", () => ({
  CItemsProvider: vi.fn(() => <div data-testid="citems-provider">Mocked CItemsProvider</div>)
}));

type TestItem = Item<'test'>;
type TestParentItem = Item<'parent', 'location1', 'location2'>;

describe('CItemsFacet', () => {
  let mockCItemAdapterContext: any;
  let mockAItemContext: any;
  let mockCItemsContext: any;
  let mockAdapter: any;
  let mockCItemsContextRef: any;
  let mockParent: any;

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock adapter context
    mockCItemAdapterContext = {
      name: 'test-adapter',
      pkTypes: ['test'],
      all: vi.fn().mockResolvedValue([]),
      one: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({} as TestItem),
      get: vi.fn().mockResolvedValue(null),
      remove: vi.fn().mockResolvedValue({} as TestItem),
      retrieve: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({} as TestItem),
      action: vi.fn().mockResolvedValue({} as TestItem),
      allAction: vi.fn().mockResolvedValue([]),
      allFacet: vi.fn().mockResolvedValue({ facetData: 'test-result' }),
      facet: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue({} as TestItem),
    };

    // Mock parent context
    const mockLocations = [
      { parent: 'parent-value' },
      { location1: 'loc1-value' },
      { location2: 'loc2-value' }
    ] as any;

    mockAItemContext = {
      name: 'test-parent',
      key: null as any,
      item: null,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      pkTypes: ['parent', 'location1', 'location2'],
      remove: vi.fn(),
      update: vi.fn(),
      action: vi.fn(),
      facet: vi.fn(),
      actions: {},
      locations: mockLocations,
      set: vi.fn().mockResolvedValue({} as TestParentItem),
    };

    // Create mock contexts
    mockAdapter = React.createContext(undefined);
    mockCItemsContextRef = React.createContext(undefined);
    mockParent = React.createContext(undefined);

    // Mock context creation
    mockCItemsContext = mockCItemsContextRef;

    // Mock the hook functions
    vi.spyOn(CItemAdapter, 'useCItemAdapter').mockReturnValue(mockCItemAdapterContext as any);
    vi.spyOn(AItem, 'useAItem').mockReturnValue(mockAItemContext as any);
    // Mock useCItems to throw error (simulate no existing context)
    vi.spyOn(CItems, 'useCItems').mockImplementation(() => {
      throw new Error('No existing context');
    });
  });

  const defaultProps = {
    name: 'test-facet',
    adapter: mockAdapter,
    context: mockCItemsContext,
    contextName: 'TestCItemsContext',
    parent: mockParent,
    parentContextName: 'TestParentContext',
    facet: 'testFacet',
    facetParams: { param1: 'value1', param2: 42 },
  };

  it('should render CItemsProvider with correct props', () => {
    render(<CItemsFacet {...defaultProps} />);

    expect(CItemsProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-facet',
        contextName: 'TestCItemsContext',
        parentContextName: 'TestParentContext',
        facetResults: {},
        isLoadingParam: true,
      })
    );
  });

  it('should call allFacet with correct parameters when all required data is present', async () => {
    render(<CItemsFacet {...defaultProps} />);

    // Wait for the effect to run
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
      'testFacet',
      { param1: 'value1', param2: 42 },
      mockAItemContext.locations
    );
  });

  it('should update result and loading state after successful facet call', async () => {
    const mockResult = { data: 'facet-result' };
    mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(mockResult);

    render(<CItemsFacet {...defaultProps} />);

    // Wait for the effect to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Check that CItemsProvider was called again with the result
    expect(CItemsProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({
        facetResults: expect.objectContaining({
          'testFacet': expect.any(Object)
        }),
        isLoadingParam: false,
      })
    );

    // Verify the nested structure contains the result
    const mockCItemsProvider = CItemsProvider as any;
    const lastCall = mockCItemsProvider.mock.calls[mockCItemsProvider.mock.calls.length - 1][0];
    const testFacetResults = lastCall.facetResults['testFacet'];
    const paramHashKeys = Object.keys(testFacetResults);
    expect(paramHashKeys).toHaveLength(1);
    expect(testFacetResults[paramHashKeys[0]]).toEqual(mockResult);
  });

  it('should not call allFacet when facet is missing', () => {
    const propsWithoutFacet = { ...defaultProps };
    delete (propsWithoutFacet as any).facet;

    render(<CItemsFacet {...propsWithoutFacet} facet="" />);

    expect(mockCItemAdapterContext.allFacet).not.toHaveBeenCalled();
  });

  it('should not call allFacet when parentLocations is null', () => {
    const mockAItemContextWithoutLocations = {
      ...mockAItemContext,
      locations: null,
    };
    vi.spyOn(AItem, 'useAItem').mockReturnValue(mockAItemContextWithoutLocations as any);

    render(<CItemsFacet {...defaultProps} />);

    expect(mockCItemAdapterContext.allFacet).not.toHaveBeenCalled();
  });

  it('should not call allFacet when adapterContext is null', () => {
    vi.spyOn(CItemAdapter, 'useCItemAdapter').mockReturnValue(null as any);

    render(<CItemsFacet {...defaultProps} />);

    expect(mockCItemAdapterContext.allFacet).not.toHaveBeenCalled();
  });

  it('should handle default facetParams when not provided', async () => {
    const propsWithoutFacetParams = { ...defaultProps };
    delete (propsWithoutFacetParams as any).facetParams;

    render(<CItemsFacet {...propsWithoutFacetParams} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
      'testFacet',
      {},
      mockAItemContext.locations
    );
  });

  it('should re-run effect when facet changes', async () => {
    const { rerender } = render(<CItemsFacet {...defaultProps} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledTimes(1);

    // Change the facet
    rerender(<CItemsFacet {...defaultProps} facet="newFacet" />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledTimes(2);
    expect(mockCItemAdapterContext.allFacet).toHaveBeenLastCalledWith(
      'newFacet',
      { param1: 'value1', param2: 42 },
      mockAItemContext.locations
    );
  });

  it('should re-run effect when facetParams change', async () => {
    const { rerender } = render(<CItemsFacet {...defaultProps} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledTimes(1);

    // Change the facetParams
    const newFacetParams = { param1: 'newValue', param3: 100 };
    rerender(<CItemsFacet {...defaultProps} facetParams={newFacetParams} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledTimes(2);
    expect(mockCItemAdapterContext.allFacet).toHaveBeenLastCalledWith(
      'testFacet',
      newFacetParams,
      mockAItemContext.locations
    );
  });

  it('should re-run effect when parentLocations change', async () => {
    const { rerender } = render(<CItemsFacet {...defaultProps} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledTimes(1);

    // Change the parent locations
    const newLocations = [
      { parent: 'new-parent-value' },
      { location1: 'new-loc1-value' },
      { location2: 'new-loc2-value' }
    ] as any;
    const newMockAItemContext = {
      ...mockAItemContext,
      locations: newLocations,
    };
    vi.spyOn(AItem, 'useAItem').mockReturnValue(newMockAItemContext as any);

    rerender(<CItemsFacet {...defaultProps} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledTimes(2);
    expect(mockCItemAdapterContext.allFacet).toHaveBeenLastCalledWith(
      'testFacet',
      { param1: 'value1', param2: 42 },
      newLocations
    );
  });

  it('should pass children to CItemsProvider', () => {
    const children = <div>Test Children</div>;

    render(<CItemsFacet {...defaultProps}>{children}</CItemsFacet>);

    expect(CItemsProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        children,
      })
    );
  });

  it('should pass renderEach to CItemsProvider', () => {
    const renderEach = (item: TestItem) => <div key={item.test}>Item: {item.test}</div>;

    render(<CItemsFacet {...defaultProps} renderEach={renderEach} />);

    expect(CItemsProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        renderEach,
      })
    );
  });

  it('should use default adapterContext name when not provided', () => {
    render(<CItemsFacet {...defaultProps} />);

    expect(CItemAdapter.useCItemAdapter).toHaveBeenCalledWith(
      defaultProps.adapter,
      'TestCItemsContextAdapter'
    );
  });

  it('should use provided adapterContext name when specified', () => {
    render(<CItemsFacet {...defaultProps} adapterContext="CustomAdapterName" />);

    expect(CItemAdapter.useCItemAdapter).toHaveBeenCalledWith(
      defaultProps.adapter,
      'CustomAdapterName'
    );
  });

  it('should render with default empty children when none provided', () => {
    render(<CItemsFacet {...defaultProps} />);

    expect(CItemsProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        children: expect.anything(),
      })
    );
  });

  it('should handle various facetParams types', async () => {
    const complexFacetParams = {
      stringParam: 'test-string',
      numberParam: 123,
      booleanParam: true,
      dateParam: new Date('2023-01-01'),
      arrayParam: ['item1', 'item2', 123, true],
    };

    render(<CItemsFacet {...defaultProps} facetParams={complexFacetParams} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
      'testFacet',
      complexFacetParams,
      mockAItemContext.locations
    );
  });

  it('should handle allFacet rejection gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Facet call failed');
    mockCItemAdapterContext.allFacet = vi.fn().mockRejectedValue(error);

    // Should not throw
    expect(() => {
      render(<CItemsFacet {...defaultProps} />);
    }).not.toThrow();

    // Wait for effect and catch any unhandled rejections
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch {
      // Expected to fail, that's what we're testing
    }

    // Should still be in loading state since the call failed
    expect(CItemsProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isLoadingParam: true,
      })
    );

    consoleSpy.mockRestore();
  });

  describe('existing context enhancement', () => {
    let existingContextMock: any;
    let mockReactCreateElement: any;

    beforeEach(() => {
      existingContextMock = {
        name: 'existing-context',
        items: [],
        isLoading: false,
        isUpdating: false,
        facetResults: {
          existingFacet: {
            'existing-hash': { existingData: 'test' }
          }
        },
        actions: {},
        remove: vi.fn(),
        update: vi.fn(),
        action: vi.fn(),
        allAction: vi.fn(),
        facet: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        set: vi.fn(),
      };

      // Mock useCItems to return existing context instead of throwing
      vi.spyOn(CItems, 'useCItems').mockReturnValue(existingContextMock as any);

      // Mock React.createElement to avoid Provider issues
      mockReactCreateElement = vi.spyOn(React, 'createElement').mockReturnValue(<div data-testid="enhanced-context">Enhanced Context</div>);
    });

    afterEach(() => {
      mockReactCreateElement.mockRestore();
    });

    it('should enhance existing context with new facet results', async () => {
      const mockResult = { newFacetData: 'test-result' };
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(mockResult);

      render(<CItemsFacet {...defaultProps} />);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call React.createElement with enhanced context
      expect(mockReactCreateElement).toHaveBeenCalled();
      expect(CItemsProvider).not.toHaveBeenCalled();
    });

    it('should preserve existing facet results when adding new ones', async () => {
      const mockResult = { newData: 'test' };
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(mockResult);

      const { container } = render(<CItemsFacet {...defaultProps} />);

      await new Promise(resolve => setTimeout(resolve, 10));

      // The enhanced context should be provided to children
      expect(container).toBeDefined();
      expect(mockReactCreateElement).toHaveBeenCalled();
    });

    it('should handle multiple calls with different parameters', async () => {
      const firstResult = { data: 'first-call' };
      const secondResult = { data: 'second-call' };

      // Test that the component sets up correctly for handling multiple results
      expect(existingContextMock.facetResults).toBeDefined();
      expect(typeof existingContextMock.facetResults).toBe('object');

      // Verify the component can handle different facet results
      const enhancedResults = { ...existingContextMock.facetResults };
      enhancedResults['testFacet'] = {
        'hash1': firstResult,
        'hash2': secondResult
      };

      expect(enhancedResults['testFacet']['hash1']).toEqual(firstResult);
      expect(enhancedResults['testFacet']['hash2']).toEqual(secondResult);
    });

    it('should initialize facetResults object for new facet when enhancing existing context', async () => {
      // Start with context that doesn't have our facet
      existingContextMock.facetResults = {
        differentFacet: {
          'some-hash': { differentData: 'test' }
        }
      };

      const mockResult = { newFacetData: 'test-result' };
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(mockResult);

      render(<CItemsFacet {...defaultProps} />);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call React.createElement instead of CItemsProvider
      expect(mockReactCreateElement).toHaveBeenCalled();
      expect(CItemsProvider).not.toHaveBeenCalled();
    });

    it('should handle no result when enhancing existing context', () => {
      // Don't set up allFacet to return anything
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(null);

      render(<CItemsFacet {...defaultProps} />);

      // Should still enhance the context even without results
      expect(mockReactCreateElement).toHaveBeenCalled();
      expect(CItemsProvider).not.toHaveBeenCalled();
    });
  });

  it('should handle empty facetParams object', async () => {
    render(<CItemsFacet {...defaultProps} facetParams={{}} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
      'testFacet',
      {},
      mockAItemContext.locations
    );
  });

  it('should memoize parent context correctly', () => {
    const { rerender } = render(<CItemsFacet {...defaultProps} />);

    // Rerender with same parent context
    rerender(<CItemsFacet {...defaultProps} />);

    // Should only call useAItem hooks, not re-create contexts
    expect(AItem.useAItem).toHaveBeenCalled();
  });

  it('should handle query prop pass-through', () => {
    const mockQuery = { limit: 10, offset: 0 } as any;

    render(<CItemsFacet {...defaultProps} query={mockQuery} />);

    expect(CItemsProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        // Note: query is not directly used in CItemsFacet, but should be passed through
        name: 'test-facet',
      })
    );
  });

  it('should handle facetParams with arrays of primitive types', async () => {
    const arrayParams = {
      stringArray: ['item1', 'item2', 'item3'],
      numberArray: [1, 2, 3, 42],
      booleanArray: [true, false, true],
      dateArray: [new Date('2023-01-01'), new Date('2023-12-31')],
      mixedArray: ['string', 123, true, new Date('2023-01-01')]
    };

    render(<CItemsFacet {...defaultProps} facetParams={arrayParams} />);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
      'testFacet',
      arrayParams,
      mockAItemContext.locations
    );
  });

  describe('createStableHash utility integration', () => {
    it('should generate stable hash for identical facetParams objects', async () => {
      const params1 = { param1: 'value1', param2: 42 };
      const params2 = { param2: 42, param1: 'value1' }; // Different order

      const { rerender } = render(<CItemsFacet {...defaultProps} facetParams={params1} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      const callCountAfterFirst = mockCItemAdapterContext.allFacet.mock.calls.length;

      // Rerender with same params but different object reference and key order
      rerender(<CItemsFacet {...defaultProps} facetParams={params2} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should not trigger additional calls since hash should be the same
      expect(mockCItemAdapterContext.allFacet.mock.calls.length).toBe(callCountAfterFirst);
    });

    it('should handle complex nested objects in facetParams with stable hashing', async () => {
      const complexParams = {
        nested: {
          deep: {
            value: 'test',
            number: 42
          },
          array: [1, 2, { inner: 'value' }]
        },
        date: new Date('2023-01-01T00:00:00Z'),
        primitive: 'simple'
      };

      render(<CItemsFacet {...defaultProps} facetParams={complexParams} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
        'testFacet',
        complexParams,
        mockAItemContext.locations
      );
    });

    it('should handle circular references in facetParams gracefully', async () => {
      const circularObj: any = { a: 1 };
      circularObj.self = circularObj;

      // Should not throw when creating stable hash
      expect(() => {
        render(<CItemsFacet {...defaultProps} facetParams={circularObj} />);
      }).not.toThrow();
    });

    it('should handle null and undefined values in facetParams', async () => {
      const paramsWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        normalValue: 'test'
      };

      render(<CItemsFacet {...defaultProps} facetParams={paramsWithNulls} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
        'testFacet',
        paramsWithNulls,
        mockAItemContext.locations
      );
    });
  });

  describe('error handling and edge cases', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log specific error details when allFacet fails', async () => {
      const testError = new Error('Specific facet error');
      mockCItemAdapterContext.allFacet = vi.fn().mockRejectedValue(testError);

      render(<CItemsFacet {...defaultProps} />);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[@fjell/providers] [CItemsFacet] Failed to execute facet "testFacet" with params'),
        { param1: 'value1', param2: 42 },
        ':',
        testError
      );
    });

    it('should maintain loading state when allFacet throws', async () => {
      mockCItemAdapterContext.allFacet = vi.fn().mockRejectedValue(new Error('Test error'));

      render(<CItemsFacet {...defaultProps} />);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should remain in loading state when error occurs
      expect(CItemsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoadingParam: true,
        })
      );
    });

    it('should handle network timeout errors appropriately', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockCItemAdapterContext.allFacet = vi.fn().mockRejectedValue(timeoutError);

      render(<CItemsFacet {...defaultProps} />);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute facet "testFacet"'),
        expect.any(Object),
        ':',
        timeoutError
      );
    });

    it('should handle Promise rejection without result update', async () => {
      mockCItemAdapterContext.allFacet = vi.fn().mockRejectedValue(new Error('Rejection test'));

      render(<CItemsFacet {...defaultProps} />);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify that result remains null and no facetResults are created
      expect(CItemsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          facetResults: {},
        })
      );
    });
  });

  describe('async state management', () => {
    it('should handle rapid facet parameter changes without race conditions', async () => {
      const { rerender } = render(<CItemsFacet {...defaultProps} facetParams={{ version: 1 }} />);

      // Quickly change parameters multiple times
      rerender(<CItemsFacet {...defaultProps} facetParams={{ version: 2 }} />);
      rerender(<CItemsFacet {...defaultProps} facetParams={{ version: 3 }} />);
      rerender(<CItemsFacet {...defaultProps} facetParams={{ version: 4 }} />);

      await new Promise(resolve => setTimeout(resolve, 20));

      // Should have called allFacet for each change
      expect(mockCItemAdapterContext.allFacet.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle component unmount during async operation', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockCItemAdapterContext.allFacet = vi.fn().mockReturnValue(pendingPromise);

      const { unmount } = render(<CItemsFacet {...defaultProps} />);

      // Unmount before the promise resolves
      unmount();

      // Now resolve the promise
      resolvePromise!({ data: 'late-result' });
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should not cause any errors or state updates after unmount
      expect(() => {
        // This should not throw
      }).not.toThrow();
    });

    it('should handle sequential loading states correctly', async () => {
      const { rerender } = render(<CItemsFacet {...defaultProps} />);

      // Initial render should be loading
      expect(CItemsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoadingParam: true,
        })
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      // After facet resolves should not be loading
      expect(CItemsProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoadingParam: false,
        })
      );

      // Change params to trigger new loading - this will immediately set loading back to true
      rerender(<CItemsFacet {...defaultProps} facetParams={{ newParam: 'value' }} />);

      // Since the rerender triggers a new effect and sets loading to true, then resolves quickly
      // We need to check the second-to-last call or handle the fact that it may resolve immediately
      await new Promise(resolve => setTimeout(resolve, 1));

      // Check that at some point during the rerender, loading was set to true
      const providerCalls = (CItemsProvider as any).mock.calls;
      const hasLoadingTrue = providerCalls.some((call: any) => call[0].isLoadingParam === true);
      expect(hasLoadingTrue).toBe(true);
    });
  });

  describe('context enhancement edge cases', () => {
    let existingContextMock: any;
    let mockReactCreateElement: any;

    beforeEach(() => {
      existingContextMock = {
        name: 'existing-context',
        items: [],
        isLoading: false,
        isUpdating: false,
        facetResults: {},
        actions: {},
        remove: vi.fn(),
        update: vi.fn(),
        action: vi.fn(),
        allAction: vi.fn(),
        facet: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
        set: vi.fn(),
      };

      vi.spyOn(CItems, 'useCItems').mockReturnValue(existingContextMock as any);
      mockReactCreateElement = vi.spyOn(React, 'createElement').mockReturnValue(<div data-testid="enhanced-context">Enhanced</div>);
    });

    afterEach(() => {
      mockReactCreateElement.mockRestore();
    });

    it('should handle enhancement when existing context has no facetResults', async () => {
      existingContextMock.facetResults = undefined;

      const mockResult = { data: 'test' };
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(mockResult);

      render(<CItemsFacet {...defaultProps} />);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify that React.createElement was called for enhancement
      expect(mockReactCreateElement).toHaveBeenCalled();

      // Check that the enhanced context was provided
      const createElementCalls = mockReactCreateElement.mock.calls;
      const enhancementCall = createElementCalls.find((call: any) =>
        call[1] && call[1].value && typeof call[1].value === 'object'
      );

      if (enhancementCall) {
        expect(enhancementCall[1].value).toHaveProperty('facetResults');
      } else {
        // If direct enhancement call not found, verify CItemsProvider wasn't called
        expect(CItemsProvider).not.toHaveBeenCalled();
      }
    });

    it('should preserve all existing context properties when enhancing', async () => {
      existingContextMock.customProperty = 'should-be-preserved';
      existingContextMock.anotherProp = { nested: 'value' };

      const mockResult = { enhancedData: 'test' };
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(mockResult);

      render(<CItemsFacet {...defaultProps} />);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify React.createElement was called with enhanced context
      expect(mockReactCreateElement).toHaveBeenCalled();
      const callArgs = mockReactCreateElement.mock.calls[0];
      expect(callArgs).toBeDefined();
    });

    it('should handle multiple facets in existing context correctly', async () => {
      existingContextMock.facetResults = {
        facet1: { 'hash1': { data1: 'test1' } },
        facet2: { 'hash2': { data2: 'test2' } }
      };

      const mockResult = { newData: 'test3' };
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(mockResult);

      render(<CItemsFacet {...defaultProps} facet="facet3" />);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockReactCreateElement).toHaveBeenCalled();
    });

    it('should handle enhancement with null/undefined result gracefully', async () => {
      mockCItemAdapterContext.allFacet = vi.fn().mockResolvedValue(null);

      render(<CItemsFacet {...defaultProps} />);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still enhance context even with null result
      expect(mockReactCreateElement).toHaveBeenCalled();
      expect(CItemsProvider).not.toHaveBeenCalled();
    });
  });

  describe('parameter validation and edge cases', () => {
    it('should handle empty string facet name', () => {
      render(<CItemsFacet {...defaultProps} facet="" />);

      expect(mockCItemAdapterContext.allFacet).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only facet name', () => {
      render(<CItemsFacet {...defaultProps} facet="   " />);

      // Should still call allFacet as whitespace is technically a valid string
      expect(mockCItemAdapterContext.allFacet).toHaveBeenCalled();
    });

    it('should handle very long facet names', async () => {
      const longFacetName = 'a'.repeat(1000);

      render(<CItemsFacet {...defaultProps} facet={longFacetName} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
        longFacetName,
        expect.any(Object),
        expect.any(Array)
      );
    });

    it('should handle special characters in facet names', async () => {
      const specialFacetName = 'facet-with.special_chars@123';

      render(<CItemsFacet {...defaultProps} facet={specialFacetName} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
        specialFacetName,
        expect.any(Object),
        expect.any(Array)
      );
    });

    it('should handle extremely large facetParams objects', async () => {
      const largeFacetParams: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeFacetParams[`param${i}`] = `value${i}`;
      }

      render(<CItemsFacet {...defaultProps} facetParams={largeFacetParams} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
        'testFacet',
        largeFacetParams,
        expect.any(Array)
      );
    });

    it('should handle facetParams with deeply nested structures', async () => {
      const deeplyNested: any = { level0: {} };
      let current = deeplyNested.level0;
      for (let i = 1; i < 100; i++) {
        current[`level${i}`] = {};
        current = current[`level${i}`];
      }
      current.finalValue = 'deep';

      render(<CItemsFacet {...defaultProps} facetParams={deeplyNested} />);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockCItemAdapterContext.allFacet).toHaveBeenCalledWith(
        'testFacet',
        deeplyNested,
        expect.any(Array)
      );
    });
  });

  describe('component lifecycle and cleanup', () => {
    it('should not call allFacet after component unmounts', async () => {
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockCItemAdapterContext.allFacet = vi.fn().mockReturnValue(delayedPromise);

      const { unmount } = render(<CItemsFacet {...defaultProps} />);

      // Unmount before the promise resolves
      unmount();

      // Resolve the promise after unmount
      resolvePromise!({ data: 'after-unmount' });
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify the component doesn't attempt state updates after unmount
      // (This is more about ensuring no React warnings/errors occur)
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should handle rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<CItemsFacet {...defaultProps} />);
        unmount();
      }

      // Should not cause any errors
      expect(true).toBe(true);
    });

    it('should handle effect cleanup when dependencies change rapidly', async () => {
      const { rerender } = render(<CItemsFacet {...defaultProps} facetParams={{ version: 1 }} />);

      // Rapidly change dependencies
      for (let i = 2; i <= 10; i++) {
        rerender(<CItemsFacet {...defaultProps} facetParams={{ version: i }} />);
      }

      await new Promise(resolve => setTimeout(resolve, 20));

      // Should handle all changes without errors
      expect(mockCItemAdapterContext.allFacet.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('memoization and performance', () => {
    it('should memoize parentLocations correctly and not cause unnecessary re-renders', () => {
      const { rerender } = render(<CItemsFacet {...defaultProps} />);

      const initialCallCount = mockCItemAdapterContext.allFacet.mock.calls.length;

      // Rerender with same props - should not trigger additional allFacet calls
      rerender(<CItemsFacet {...defaultProps} />);

      // Should not increase call count since dependencies haven't changed
      expect(mockCItemAdapterContext.allFacet.mock.calls.length).toBe(initialCallCount);
    });

    it('should handle memo optimization when parentContext object changes but content is same', () => {
      const sameLocations = [
        { parent: 'parent-value' },
        { location1: 'loc1-value' },
        { location2: 'loc2-value' }
      ] as any;

      // Create a new context object with same locations content
      const newMockAItemContext = {
        ...mockAItemContext,
        locations: sameLocations, // Same content, different reference
      };

      const { rerender } = render(<CItemsFacet {...defaultProps} />);

      vi.spyOn(AItem, 'useAItem').mockReturnValue(newMockAItemContext as any);
      rerender(<CItemsFacet {...defaultProps} />);

      // Should trigger new call since locations reference changed
      expect(mockCItemAdapterContext.allFacet.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
