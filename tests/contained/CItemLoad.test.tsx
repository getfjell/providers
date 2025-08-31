/* eslint-disable no-undefined */
import { ComKey, ikToLKA, isComKey, isValidComKey, Item, UUID } from '@fjell/core';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

import { CItemLoad } from '../../src/contained/CItemLoad';
import { ContextType as CItemContextType } from '../../src/contained/CItem';
import { ContextType as AItemContextType } from '../../src/AItem';
import { ContextType as CItemAdapterContextType } from '../../src/contained/CItemAdapter';

// Mock the logger
vi.mock('../../src/logger', () => ({
  default: {
    get: () => ({
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock the hooks
vi.mock('../../src/contained/CItemAdapter', () => ({
  useCItemAdapter: vi.fn(),
}));

vi.mock('../../src/AItem', () => ({
  useAItem: vi.fn(),
}));

// Mock core functions
vi.mock('@fjell/core', async () => {
  const actual = await vi.importActual('@fjell/core');
  return {
    ...actual,
    isComKey: vi.fn(),
    isValidComKey: vi.fn(),
    ikToLKA: vi.fn(),
    abbrevIK: vi.fn((key) => `abbreviated-${key?.pk || 'null'}`),
  };
});

type TestItem = Item<'test', 'container'>;
type ParentItem = Item<'container'>;

type TestItemContextType = CItemContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItemContextType<ParentItem, 'container'>;
type TestItemAdapterContextType = CItemAdapterContextType<TestItem, 'test', 'container'>;

describe('CItemLoad', () => {
  const itemKey: ComKey<'test', 'container'> = {
    pk: '1-1-1-1-1' as UUID,
    kt: 'test',
    loc: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }]
  };

  const testItem: TestItem = {
    key: itemKey,
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    },
  };

  const parentItem: ParentItem = {
    key: { pk: '2-2-2-2-2' as UUID, kt: 'container', loc: [] },
    events: {
      created: { at: new Date() },
      updated: { at: new Date() },
      deleted: { at: null },
    },
  };

  let mockRetrieve: ReturnType<typeof vi.fn>;
  let mockRemove: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockAction: ReturnType<typeof vi.fn>;
  let mockFacet: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;
  let mockAddActions: ReturnType<typeof vi.fn>;
  let mockAddFacets: ReturnType<typeof vi.fn>;

  let TestContext: React.Context<TestItemContextType | undefined>;
  let ParentContext: React.Context<ParentItemContextType | undefined>;
  let AdapterContext: React.Context<TestItemAdapterContextType | undefined>;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Reset mocked functions
    vi.mocked(isComKey).mockImplementation((key) => key && typeof key === 'object' && 'pk' in key && 'kt' in key);
    vi.mocked(isValidComKey).mockImplementation((key) => {
      if (!key || typeof key !== 'object' || !('pk' in key) || !('kt' in key) || !('loc' in key)) {
        return false;
      }
      // Check that pk and kt are valid (not null, undefined, empty string, or 'null')
      if (!key.pk || key.pk === '' || key.pk === 'null' || !key.kt || key.kt === '' || key.kt === 'null') {
        return false;
      }
      // Check that loc is an array and each location key is valid
      if (!Array.isArray(key.loc)) {
        return false;
      }
      return key.loc.every((locKey: any) =>
        locKey &&
        typeof locKey === 'object' &&
        'lk' in locKey &&
        'kt' in locKey &&
        locKey.lk &&
        locKey.lk !== '' &&
        locKey.lk !== 'null' &&
        locKey.kt &&
        locKey.kt !== '' &&
        locKey.kt !== 'null'
      );
    });
    vi.mocked(ikToLKA).mockImplementation((key) => (key && 'loc' in key) ? key.loc || [] as any : [] as any);

    // Setup adapter methods
    mockRetrieve = vi.fn().mockResolvedValue(testItem);
    mockRemove = vi.fn().mockResolvedValue(undefined);
    mockUpdate = vi.fn().mockResolvedValue(testItem);
    mockAction = vi.fn().mockResolvedValue(testItem);
    mockFacet = vi.fn().mockResolvedValue({ data: 'facet-result' });
    mockSet = vi.fn().mockResolvedValue(testItem);
    mockAddActions = vi.fn().mockReturnValue({ customAction: vi.fn() });
    mockAddFacets = vi.fn().mockReturnValue({ customFacet: vi.fn() });

    // Setup contexts
    TestContext = React.createContext<TestItemContextType | undefined>(undefined);
    ParentContext = React.createContext<ParentItemContextType | undefined>(undefined);
    AdapterContext = React.createContext<TestItemAdapterContextType | undefined>(undefined);

    // Setup the mocked hooks
    const { useCItemAdapter } = await import('../../src/contained/CItemAdapter');
    vi.mocked(useCItemAdapter).mockReturnValue({
      pkTypes: ['test'],
      name: 'test',
      all: vi.fn().mockResolvedValue([testItem]),
      one: vi.fn().mockResolvedValue(testItem),
      create: vi.fn().mockResolvedValue(testItem),
      get: vi.fn().mockResolvedValue(testItem),
      retrieve: mockRetrieve,
      remove: mockRemove,
      update: mockUpdate,
      action: mockAction,
      facet: mockFacet,
      set: mockSet,
      allAction: vi.fn().mockResolvedValue([testItem]),
      allFacet: vi.fn().mockResolvedValue({ data: 'facet-result' }),
      find: vi.fn().mockResolvedValue([testItem]),
      findOne: vi.fn().mockResolvedValue(testItem),
      addActions: mockAddActions,
      addFacets: mockAddFacets,
      addAllActions: vi.fn().mockReturnValue({}),
      addAllFacets: vi.fn().mockReturnValue({}),
    });

    const { useAItem } = await import('../../src/AItem');
    vi.mocked(useAItem).mockReturnValue({
      name: 'parent',
      key: parentItem.key,
      locations: [],
      pkTypes: ['container'],
      parentItem: null,
      item: parentItem,
      isLoading: false,
      isUpdating: false,
      isRemoving: false,
      actions: {},
      remove: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(parentItem),
      set: vi.fn().mockResolvedValue(parentItem),
      action: vi.fn().mockResolvedValue(parentItem),
    });
  });

  describe('Error Handling', () => {
    it('should throw error when both ik and item are provided', () => {
      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={<div>Test Child</div>}
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          item={testItem}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      expect(() => render(<TestComponent />)).toThrow(
        "TestItem: Cannot provide both 'ik' and 'item' parameters. Please provide only one."
      );
    });

    it('should throw error when invalid ComKey is provided', () => {
      vi.mocked(isComKey).mockReturnValue(false);

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={<div>Test Child</div>}
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      expect(() => render(<TestComponent />)).toThrow('TestItem: Key is not a ComKey');
    });
  });

  describe('Provided Item Behavior', () => {
    it('should use provided item directly and skip cache retrieval', () => {
      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={<div data-testid="test-child">Test Child</div>}
          context={TestContext}
          contextName="TestItemContext"
          item={testItem}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(mockRetrieve).not.toHaveBeenCalled();
    });

    it('should handle null provided item', () => {
      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={<div data-testid="test-child">Test Child</div>}
          context={TestContext}
          contextName="TestItemContext"
          item={null}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Item Key Behavior', () => {
    it('should retrieve item from cache when valid key is provided', async () => {
      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={<div data-testid="test-child">Test Child</div>}
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(mockRetrieve).toHaveBeenCalledWith(itemKey);
      });
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should handle null item key', () => {
      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={<div data-testid="test-child">Test Child</div>}
          context={TestContext}
          contextName="TestItemContext"
          ik={null}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(mockRetrieve).not.toHaveBeenCalled();
    });

    it('should handle undefined item key', () => {
      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={<div data-testid="test-child">Test Child</div>}
          context={TestContext}
          contextName="TestItemContext"
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(mockRetrieve).not.toHaveBeenCalled();
    });
  });

  describe('CRUD Operations', () => {
    let contextValue: TestItemContextType;

    beforeEach(async () => {
      const TestComponent = () => {
        return (
          <CItemLoad
            name="TestItem"
            adapter={AdapterContext}
            children={
              <TestContext.Consumer>
                {(value) => {
                  contextValue = value as TestItemContextType;
                  return <div data-testid="test-child">Test Child</div>;
                }}
              </TestContext.Consumer>
            }
            context={TestContext}
            contextName="TestItemContext"
            ik={itemKey}
            parent={ParentContext}
            parentContextName="ParentContext"
          />
        );
      };

      render(<TestComponent />);
      await waitFor(() => expect(contextValue).toBeDefined());
    });

    it('should handle remove operation', async () => {
      await act(async () => {
        await contextValue.remove();
      });

      expect(mockRemove).toHaveBeenCalledWith(itemKey);
    });

    it('should throw error on remove without valid key', async () => {
      // Create a component without a key
      let contextValueNoKey: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValueNoKey = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);
      await waitFor(() => expect(contextValueNoKey).toBeDefined());

      if (contextValueNoKey) {
        await expect(contextValueNoKey.remove()).rejects.toThrow(
          'TestItem: No item key provided for remove'
        );
      }
    });

    it('should handle update operation', async () => {
      const updateData = { name: 'updated' };

      await act(async () => {
        const result = await contextValue.update(updateData);
        expect(result).toBe(testItem);
      });

      expect(mockUpdate).toHaveBeenCalledWith(itemKey, updateData);
    });

    it('should throw error on update without item data', async () => {
      await expect(contextValue.update(undefined as any)).rejects.toThrow(
        'TestItem: No item provided for update'
      );
    });

    it('should handle set operation', async () => {
      await act(async () => {
        const result = await contextValue.set(testItem);
        expect(result).toBe(testItem);
      });

      expect(mockSet).toHaveBeenCalledWith(itemKey, testItem);
    });

    it('should throw error on set without item', async () => {
      await expect(contextValue.set(null as any)).rejects.toThrow(
        'TestItem: No item provided to set'
      );
    });

    it('should handle action operation', async () => {
      const actionName = 'testAction';
      const body = { param: 'value' };

      await act(async () => {
        const result = await contextValue.action(actionName, body);
        expect(result).toBe(testItem);
      });

      expect(mockAction).toHaveBeenCalledWith(itemKey, actionName, body);
    });

    it('should handle facet operation', async () => {
      const facetName = 'testFacet';
      const params = { param1: 'value1' };

      await act(async () => {
        const result = await contextValue.facet(facetName, params);
        expect(result).toEqual({ data: 'facet-result' });
      });

      expect(mockFacet).toHaveBeenCalledWith(itemKey, facetName, params);
    });
  });

  describe('Loading States', () => {
    it('should set isLoading to false when provided item is used', async () => {
      let contextValue: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValue = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          item={testItem}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);

      await waitFor(() => expect(contextValue).toBeDefined());

      if (contextValue) {
        expect(contextValue.isLoading).toBe(false);
        expect(contextValue.isUpdating).toBe(false);
        expect(contextValue.isRemoving).toBe(false);
      }
    });

    it('should call remove method and complete successfully', async () => {
      let contextValue: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValue = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);
      await waitFor(() => expect(contextValue).toBeDefined());

      if (contextValue) {
        // Initially not removing
        expect(contextValue.isRemoving).toBe(false);

        // Execute remove operation
        await act(async () => {
          await contextValue.remove();
        });

        // Verify the mock was called
        expect(mockRemove).toHaveBeenCalledWith(itemKey);

        // After operation completes, should not be removing
        expect(contextValue.isRemoving).toBe(false);
      }
    });
  });

  describe('Context Value Creation', () => {
    it('should create proper context value with all required properties', async () => {
      let contextValue: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValue = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);
      await waitFor(() => expect(contextValue).toBeDefined());

      if (contextValue) {
        expect(contextValue.name).toBe('TestItem');
        expect(contextValue.key).toBe(itemKey);
        expect(contextValue.item).toBe(testItem);
        expect(contextValue.parentItem).toBe(parentItem);
        expect(contextValue.pkTypes).toEqual(['test']);
        expect(typeof contextValue.remove).toBe('function');
        expect(typeof contextValue.update).toBe('function');
        expect(typeof contextValue.action).toBe('function');
        expect(typeof contextValue.facet).toBe('function');
        expect(typeof contextValue.set).toBe('function');
        expect(contextValue.actions).toBeDefined();
        expect(contextValue.facets).toBeDefined();
      }
    });

    it('should create locations from item key', async () => {
      const mockLocations = [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }] as any;
      vi.mocked(ikToLKA).mockReturnValue(mockLocations);

      let contextValue: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValue = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);
      await waitFor(() => expect(contextValue).toBeDefined());

      if (contextValue) {
        expect(contextValue.locations).toBe(mockLocations);
        expect(ikToLKA).toHaveBeenCalledWith(itemKey);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid ComKey for operations', async () => {
      vi.mocked(isValidComKey).mockReturnValue(false);

      let contextValue: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValue = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);
      await waitFor(() => expect(contextValue).toBeDefined());

      if (contextValue) {
        await expect(contextValue.remove()).rejects.toThrow(
          'TestItem: Invalid item key provided for remove'
        );
        await expect(contextValue.update({ name: 'test' })).rejects.toThrow(
          'TestItem: Invalid item key provided for update'
        );
        await expect(contextValue.action('testAction')).rejects.toThrow(
          'TestItem: Invalid item key provided for action \'testAction\''
        );
        await expect(contextValue.facet('testFacet')).rejects.toThrow(
          'TestItem: Invalid item key provided for facet \'testFacet\''
        );
      }
    });

    it('should handle set operation with invalid item key', async () => {
      const invalidItem = { ...testItem, key: { ...itemKey, pk: 'invalid' as UUID } };
      vi.mocked(isValidComKey).mockImplementation((key) => key?.pk !== 'invalid');

      let contextValue: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValue = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);
      await waitFor(() => expect(contextValue).toBeDefined());

      if (contextValue) {
        await expect(contextValue.set(invalidItem)).rejects.toThrow(
          'TestItem: Invalid or missing key in item provided to set'
        );
      }
    });

    it('should return null item when no valid key is provided', async () => {
      vi.mocked(isValidComKey).mockReturnValue(false);

      let contextValue: TestItemContextType | undefined;

      const TestComponent = () => (
        <CItemLoad
          name="TestItem"
          adapter={AdapterContext}
          children={
            <TestContext.Consumer>
              {(value) => {
                contextValue = value as TestItemContextType;
                return <div>Test Child</div>;
              }}
            </TestContext.Consumer>
          }
          context={TestContext}
          contextName="TestItemContext"
          ik={itemKey}
          parent={ParentContext}
          parentContextName="ParentContext"
        />
      );

      render(<TestComponent />);
      await waitFor(() => expect(contextValue).toBeDefined());

      if (contextValue) {
        expect(contextValue.item).toBeNull();
        expect(contextValue.locations).toBeNull();
      }
    });
  });
});
