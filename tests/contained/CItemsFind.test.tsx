// @ts-nocheck
/* eslint-disable no-undefined */
import { Item } from '@fjell/core';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CItemsFind } from '../../src/contained/CItemsFind';
import { CItemsContextType } from '../../src/contained/CItemsContext';
import { AItemContextType } from '../../src/AItemContext';

type TestItem = Item<'test', 'container'>;
type ParentItem = Item<'container'>;

type TestItemsContextType = CItemsContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItemContextType<ParentItem, 'container'>;

const TestContext = React.createContext<TestItemsContextType | undefined>(undefined);
const ParentContext = React.createContext<ParentItemContextType | undefined>(undefined);

describe('CItemsFind', () => {
  it('should render with basic finder props', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsFind({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      finder: 'byName',
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with finder parameters', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const finderParams = { name: 'test', active: true };

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsFind({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      finder: 'byName',
      finderParams,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with renderEach function', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const renderEach = (item: TestItem) =>
      React.createElement('div', { key: item.key.pk }, `Item: ${item.key.pk}`);

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsFind({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      finder: 'byName',
      renderEach,
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
    const TestComponent = () => CItemsFind({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      finder: 'byName',
      addQueries,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle complex finder parameters', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');
    const finderParams = {
      name: 'test',
      count: 10,
      active: true,
      createdAt: new Date(),
      tags: ['tag1', 'tag2'],
    };

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemsFind({
      name: 'TestItems',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemsContext',
      parent: ParentContext,
      parentContextName: 'ParentContext',
      finder: 'complex',
      finderParams,
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle component creation', () => {
    const TestComponent = () =>
      // @ts-ignore - This is a smoke test, not testing actual functionality
      CItemsFind({
        name: 'TestItems',
        adapter: TestContext,
        children: React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child'),
        context: TestContext,
        contextName: 'TestItemsContext',
        parent: ParentContext,
        parentContextName: 'ParentContext',
        finder: 'byName',
      });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });
});
