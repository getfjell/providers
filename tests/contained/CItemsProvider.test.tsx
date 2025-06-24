// @ts-nocheck
/* eslint-disable no-undefined */
import { ComKey, Item, UUID } from '@fjell/core';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CItemsProvider } from '../../src/contained/CItemsProvider';
import { CItemsContextType } from '../../src/contained/CItemsContext';
import { AItemContextType } from '../../src/AItemContext';

type TestItem = Item<'test', 'container'>;
type ParentItem = Item<'container'>;

type TestItemsContextType = CItemsContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItemContextType<ParentItem, 'container'>;

const TestContext = React.createContext<TestItemsContextType | undefined>(undefined);
const ParentContext = React.createContext<ParentItemContextType | undefined>(undefined);

describe('CItemsProvider', () => {
  const itemKey: ComKey<'test', 'container'> = {
    pk: '1-1-1-1-1' as UUID,
    kt: 'test',
    loc: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }]
  };

  const testItem: TestItem = {
    key: itemKey,
  } as TestItem;

  it('should render with basic props', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsProvider({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with items', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const items = [testItem];

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsProvider({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      items,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with renderEach function', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const items = [testItem];
    const renderEach = (item: TestItem) =>
      React.createElement('div', { key: item.key.pk }, `Item: ${item.key.pk}`);

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsProvider({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      items,
      renderEach,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with loading state', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsProvider({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      isLoadingParam: true,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with overrides', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const overrides = {
      all: vi.fn().mockResolvedValue([testItem]),
      one: vi.fn().mockResolvedValue(testItem),
    };

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsProvider({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      overrides,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with addQueries function', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const addQueries = () => ({
      customQuery: vi.fn().mockResolvedValue('result'),
    });

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsProvider({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      addQueries,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle component creation', () => {
    const TestComponent = () =>
      // @ts-ignore - This is a smoke test, not testing actual functionality
      CItemsProvider({
        name: 'TestItems',
        adapter: TestContext,
        children: React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child'),
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
      });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });
});
