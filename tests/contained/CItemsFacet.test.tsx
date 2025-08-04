/* eslint-disable no-undefined */
import { Item } from "@fjell/core";
import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    const lastCall = CItemsProvider.mock.calls[CItemsProvider.mock.calls.length - 1][0];
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
});
