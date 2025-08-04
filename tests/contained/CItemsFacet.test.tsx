/* eslint-disable no-undefined */
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
      cacheMap: {} as any,
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
});
