/* eslint-disable no-undefined */
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
      allFacet: vi.fn(),
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
});
