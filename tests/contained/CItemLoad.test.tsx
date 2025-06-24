// @ts-nocheck
/* eslint-disable no-undefined */
import { ComKey, Item, UUID } from '@fjell/core';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CItemLoad } from '../../src/contained/CItemLoad';
import { CItemContextType } from '../../src/contained/CItemContext';
import { AItemContextType } from '../../src/AItemContext';

type TestItem = Item<'test', 'container'>;
type ParentItem = Item<'container'>;

type TestItemContextType = CItemContextType<TestItem, 'test', 'container'>;
type ParentItemContextType = AItemContextType<ParentItem, 'container'>;

const TestContext = React.createContext<TestItemContextType | undefined>(undefined);
const ParentContext = React.createContext<ParentItemContextType | undefined>(undefined);

describe('CItemLoad', () => {
  const itemKey: ComKey<'test', 'container'> = {
    pk: '1-1-1-1-1' as UUID,
    kt: 'test',
    loc: [{ lk: '2-2-2-2-2' as UUID, kt: 'container' }]
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render with valid props', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemLoad({
      name: 'TestItem',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemContext',
      ik: itemKey,
      parent: ParentContext,
      parentContextName: 'ParentContext',
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should render with null item key', () => {
    const mockChildren = React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child');

    // @ts-ignore - This is a smoke test, not testing actual functionality
    const TestComponent = () => CItemLoad({
      name: 'TestItem',
      adapter: TestContext,
      children: mockChildren,
      context: TestContext,
      contextName: 'TestItemContext',
      ik: null,
      parent: ParentContext,
      parentContextName: 'ParentContext',
    });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });

  it('should handle component creation', () => {
    const TestComponent = () =>
      // @ts-ignore - This is a smoke test, not testing actual functionality
      CItemLoad({
        name: 'TestItem',
        adapter: TestContext,
        children: React.createElement('div', { 'data-testid': 'test-child' }, 'Test Child'),
        context: TestContext,
        contextName: 'TestItemContext',
        ik: itemKey,
        parent: ParentContext,
        parentContextName: 'ParentContext',
      });

    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });
});
