 
import { AllOperationResult, ComKey, Item, LocKeyArray, PriKey, UUID } from "@fjell/types";
import { act, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CItemsProvider } from '../../src/contained/CItemsProvider';
import { ContextType as CItemsContextType } from '../../src/contained/CItems';
import { ContextType as AItemContextType } from '../../src/AItem';
import * as CItemAdapter from '../../src/contained/CItemAdapter';
import * as AItem from '../../src/AItem';

type TestItem = Item<'test', 'container'>;
type ParentItem = Item<'container'>;

type TestItemsContextType = CItemsContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItemContextType<ParentItem, 'container'>;
type TestItemAdapterContextType = CItemAdapter.ContextType<TestItem, 'test', 'container'>;

const TestContext = React.createContext<TestItemsContextType | undefined>(undefined);
const ParentContext = React.createContext<ParentItemContextType | undefined>(undefined);
const AdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

describe('CItemsProvider', () => {
  const locKeyArray: LocKeyArray<'container'> = [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }];
  const itemKey: ComKey<'test', 'container'> = {
    pk: '1-1-1-1-1' as UUID,
    kt: 'test',
    loc: locKeyArray
  };
  const parentKey: PriKey<'container'> = { pk: '2-2-2-2-2' as UUID, kt: 'container' };

  const testItem: TestItem = {
    key: itemKey,
    name: 'Test Item',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  } as TestItem;

  const parentItem: ParentItem = {
    key: parentKey,
    name: 'Parent Item',
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    }
  } as ParentItem;

  let mockAdapterContext: TestItemAdapterContextType;
  let mockParentContext: ParentItemContextType;
  let mockUseCItemAdapter: ReturnType<typeof vi.fn>;
  let mockUseAItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock the adapter context
    mockAdapterContext = {
      name: 'TestItems',
      pkTypes: ['test', 'container'],
      all: vi.fn().mockResolvedValue({
        items: [testItem],
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      } as AllOperationResult<TestItem>),
      one: vi.fn().mockResolvedValue(testItem),
      create: vi.fn().mockResolvedValue(testItem),
      get: vi.fn().mockResolvedValue(testItem),
      retrieve: vi.fn().mockResolvedValue(testItem),
      update: vi.fn().mockResolvedValue(testItem),
      remove: vi.fn().mockResolvedValue(undefined),
      allAction: vi.fn().mockResolvedValue([testItem]),
      allFacet: vi.fn().mockResolvedValue({ count: 1 }),
      action: vi.fn().mockResolvedValue(testItem),
      facet: vi.fn().mockResolvedValue({ result: 'success' }),
      set: vi.fn().mockResolvedValue(testItem),
      find: vi.fn().mockResolvedValue([testItem]),
      findOne: vi.fn().mockResolvedValue(testItem),
      addAllActions: vi.fn().mockReturnValue({ customAction: vi.fn() }),
      addAllFacets: vi.fn().mockReturnValue({ customFacet: vi.fn() }),
    };

    // Mock the parent context
    mockParentContext = {
      name: 'ParentItem',
      key: parentKey,
      locations: locKeyArray,
      pkTypes: ['container'],
      item: parentItem,
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

    // Mock the hooks
    mockUseCItemAdapter = vi.fn().mockReturnValue(mockAdapterContext);
    mockUseAItem = vi.fn().mockReturnValue(mockParentContext);

    // Mock the hook imports
    vi.spyOn(CItemAdapter, 'useCItemAdapter').mockImplementation(mockUseCItemAdapter);
    vi.spyOn(AItem, 'useAItem').mockImplementation(mockUseAItem);
  });

  describe('Basic rendering', () => {
    it('should render with minimal props', () => {
      const result = render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
        })
      );

      expect(result.container).toBeDefined();
      expect(mockUseCItemAdapter).toHaveBeenCalledWith(AdapterContext, 'TestItemsContext');
      expect(mockUseAItem).toHaveBeenCalledWith(ParentContext, 'ParentContext');
    });

    it('should render with children', () => {
      const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');

      const result = render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: mockChildren,
        })
      );

      expect(result.getByTestId('test-child')).toBeDefined();
    });

    it('should render items with renderEach', () => {
      const items = [testItem];
      const renderEach = vi.fn().mockImplementation((item: TestItem) =>
        React.createElement('div', { key: item.key.pk, 'data-testid': `item-${item.key.pk}` }, item.name)
      );

      const result = render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          items,
          renderEach,
        })
      );

      expect(renderEach).toHaveBeenCalledWith(testItem);
      expect(result.getByTestId(`item-${testItem.key.pk}`)).toBeDefined();
    });
  });

  describe('State management', () => {
    it('should initialize with loading state from isLoadingParam', async () => {
      let contextValue: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          isLoadingParam: true,
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue?.isLoading).toBe(true);
      });
    });

    it('should update loading state when isLoadingParam changes', async () => {
      let contextValue: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      const { rerender } = render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          isLoadingParam: false,
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue?.isLoading).toBe(false);
      });

      rerender(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          isLoadingParam: true,
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue?.isLoading).toBe(true);
      });
    });

    it('should manage creating state during create operation', async () => {
      let contextValue: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue?.isCreating).toBe(false);
      });

      act(() => {
        contextValue?.create({ name: 'New Item' });
      });

      await waitFor(() => {
        expect(contextValue?.isCreating).toBe(false); // Should be false after operation completes
      });
    });
  });

  describe('CRUD operations', () => {
    let contextValue: TestItemsContextType | undefined;

    beforeEach(async () => {
      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });
    });

    it('should call create with parent locations', async () => {
      const newItem = { name: 'New Item' };

      await act(async () => {
        const result = await contextValue!.create(newItem);
        expect(result).toEqual(testItem);
      });

      expect(mockAdapterContext.create).toHaveBeenCalledWith(newItem, { locations: locKeyArray });
    });

    it('should call update with key and item data', async () => {
      const updateData = { name: 'Updated Item' };

      await act(async () => {
        const result = await contextValue!.update(itemKey, updateData);
        expect(result).toEqual(testItem);
      });

      expect(mockAdapterContext.update).toHaveBeenCalledWith(itemKey, updateData);
    });

    it('should call remove with key', async () => {
      await act(async () => {
        await contextValue!.remove(itemKey);
      });

      expect(mockAdapterContext.remove).toHaveBeenCalledWith(itemKey);
    });

    it('should call all with parent locations', async () => {
      await act(async () => {
        const result = await contextValue!.all();
        expect(result).toEqual([testItem]);
      });

      expect(mockAdapterContext.all).toHaveBeenCalledWith({}, locKeyArray);
    });

    it('should call one with parent locations', async () => {
      await act(async () => {
        const result = await contextValue!.one();
        expect(result).toEqual(testItem);
      });

      expect(mockAdapterContext.one).toHaveBeenCalledWith({}, locKeyArray);
    });

    it('should throw error when creating without parent locations', async () => {
      // Mock a context without parent locations
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      // Mock parent context with null locations
      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.create({ name: 'New Item' });
      }).rejects.toThrow('No parent locations present to create containeditem in TestItems');
    });

    it('should throw error when querying all without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.all();
      }).rejects.toThrow('No parent locations present to query for all containeditems in TestItems');
    });

    it('should throw error when querying one without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.one();
      }).rejects.toThrow('No parent locations present to query for one containeditem in TestItems');
    });
  });

  describe('Action and Facet operations', () => {
    let contextValue: TestItemsContextType | undefined;

    beforeEach(async () => {
      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });
    });

    it('should call allAction with action, body and parent locations', async () => {
      const action = 'testAction';
      const body = { param: 'value' };

      await act(async () => {
        const result = await contextValue!.allAction(action, body);
        expect(result).toEqual([testItem]);
      });

      expect(mockAdapterContext.allAction).toHaveBeenCalledWith(action, body, locKeyArray);
    });

    it('should call allFacet with facet, params and parent locations', async () => {
      const facet = 'testFacet';
      const params = { filter: 'active' };

      await act(async () => {
        const result = await contextValue!.allFacet(facet, params);
        expect(result).toEqual({ count: 1 });
      });

      expect(mockAdapterContext.allFacet).toHaveBeenCalledWith(facet, params, locKeyArray);
    });

    it('should call action with key, action, body and parent locations', async () => {
      const action = 'activate';
      const body = { force: true };

      await act(async () => {
        const result = await contextValue!.action(itemKey, action, body);
        expect(result).toEqual(testItem);
      });

      expect(mockAdapterContext.action).toHaveBeenCalledWith(itemKey, action, body);
    });

    it('should call facet with key, facet, params and parent locations', async () => {
      const facet = 'status';
      const params = { detailed: true };

      await act(async () => {
        const result = await contextValue!.facet(itemKey, facet, params);
        expect(result).toEqual({ result: 'success' });
      });

      expect(mockAdapterContext.facet).toHaveBeenCalledWith(itemKey, facet, params);
    });

    it('should throw error for allAction without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.allAction('testAction');
      }).rejects.toThrow('No parent locations present to query for allAction containeditems in TestItems');
    });

    it('should throw error for allFacet without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.allFacet('testFacet');
      }).rejects.toThrow('No parent locations present to query for allFacet containeditems');
    });

    it('should throw error for action without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.action(itemKey, 'testAction');
      }).rejects.toThrow('No parent locations present to query for action testAction in TestItems');
    });

    it('should throw error for facet without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.facet(itemKey, 'testFacet');
      }).rejects.toThrow('No parent locations present to query for facet testFacet');
    });
  });

  describe('Find operations', () => {
    let contextValue: TestItemsContextType | undefined;

    beforeEach(async () => {
      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });
    });

    it('should call find with finder, params and parent locations', async () => {
      const finder = 'byName';
      const params = { name: 'test' };

      await act(async () => {
        const result = await contextValue!.find(finder, params);
        expect(result).toEqual([testItem]);
      });

      expect(mockAdapterContext.find).toHaveBeenCalledWith(finder, params, locKeyArray);
    });

    it('should call findOne with finder, params and parent locations', async () => {
      const finder = 'byName';
      const params = { name: 'test' };

      await act(async () => {
        const result = await contextValue!.findOne(finder, params);
        expect(result).toEqual(testItem);
      });

      expect(mockAdapterContext.findOne).toHaveBeenCalledWith(finder, params, locKeyArray);
    });

    it('should call set with key and item', async () => {
      await act(async () => {
        const result = await contextValue!.set(itemKey, testItem);
        expect(result).toEqual(testItem);
      });

      expect(mockAdapterContext.set).toHaveBeenCalledWith(itemKey, testItem);
    });

    it('should throw error for find without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.find('byName', { name: 'test' });
      }).rejects.toThrow('No parent locations present to query for find containeditems in TestItems');
    });

    it('should throw error for findOne without parent locations', async () => {
      let contextValueWithoutParent: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValueWithoutParent = React.useContext(TestContext);
        return null;
      };

      const mockParentContextWithoutLocations = {
        ...mockParentContext,
        locations: null,
      };
      mockUseAItem.mockReturnValue(mockParentContextWithoutLocations);

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValueWithoutParent).toBeDefined();
      });

      await expect(async () => {
        await contextValueWithoutParent!.findOne('byName', { name: 'test' });
      }).rejects.toThrow('No parent locations present to query for findOne containeditem in TestItems');
    });
  });

  describe('Context value and overrides', () => {
    it('should create proper context value structure', async () => {
      let contextValue: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      const items = [testItem];
      const result = { success: true };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          items,
          facetResults: result,
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue).toMatchObject({
          name: 'TestItems',
          items,
          facetResults: result,
          parentItem,
          isLoading: expect.any(Boolean),
          isCreating: expect.any(Boolean),
          isUpdating: expect.any(Boolean),
          isRemoving: expect.any(Boolean),
          pkTypes: ['test', 'container'],
          locations: locKeyArray,
          create: expect.any(Function),
          update: expect.any(Function),
          remove: expect.any(Function),
          all: expect.any(Function),
          one: expect.any(Function),
          allAction: expect.any(Function),
          allFacet: expect.any(Function),
          action: expect.any(Function),
          facet: expect.any(Function),
          find: expect.any(Function),
          findOne: expect.any(Function),
          set: expect.any(Function),
        });
      });
    });

    it('should use override functions when provided', async () => {
      let contextValue: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      const mockAllOverride = vi.fn().mockResolvedValue([testItem]);
      const mockOneOverride = vi.fn().mockResolvedValue(testItem);

      const overrides = {
        all: mockAllOverride,
        one: mockOneOverride,
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          overrides,
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      await act(async () => {
        await contextValue!.all();
        await contextValue!.one();
      });

      expect(mockAllOverride).toHaveBeenCalled();
      expect(mockOneOverride).toHaveBeenCalled();
      expect(mockAdapterContext.all).not.toHaveBeenCalled();
      expect(mockAdapterContext.one).not.toHaveBeenCalled();
    });

    it('should add memoized allActions when addAllActions is provided', async () => {
      let contextValue: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue?.allActions).toEqual({ customAction: expect.any(Function) });
        expect(mockAdapterContext.addAllActions).toHaveBeenCalledWith(contextValue?.allAction);
      });
    });

    it('should add memoized allFacets when addAllFacets is provided', async () => {
      let contextValue: TestItemsContextType | undefined;

      const TestConsumer = () => {
        contextValue = React.useContext(TestContext);
        return null;
      };

      render(
        React.createElement(CItemsProvider, {
          name: 'TestItems',
          adapter: AdapterContext as any,
          context: TestContext as any,
          contextName: 'TestItemsContext',
          parent: ParentContext as any,
          parentContextName: 'ParentContext',
          children: React.createElement(TestConsumer),
        })
      );

      await waitFor(() => {
        expect(contextValue?.allFacets).toEqual({ customFacet: expect.any(Function) });
        expect(mockAdapterContext.addAllFacets).toHaveBeenCalledWith(contextValue?.allFacet);
      });
    });
  });
});
