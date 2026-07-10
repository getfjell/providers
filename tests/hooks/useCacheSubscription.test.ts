import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCacheSubscription } from '../../src/hooks/useCacheSubscription';

describe('useCacheSubscription', () => {
  let mockCache: any;
  let subscriptions: Array<{ options: any; unsubscribe: ReturnType<typeof vi.fn> }>;

  beforeEach(() => {
    subscriptions = [];
    mockCache = {
      subscribe: vi.fn((listener, options) => {
        const unsubscribe = vi.fn();
        subscriptions.push({ options, unsubscribe });
        return {
          id: `sub_${subscriptions.length}`,
          unsubscribe,
          isActive: () => true
        };
      })
    };
  });

  it('should subscribe with initial options', () => {
    const listener = vi.fn();
    renderHook(() =>
      useCacheSubscription(mockCache, listener, { eventTypes: ['item_created'] })
    );

    expect(mockCache.subscribe).toHaveBeenCalledTimes(1);
    expect(subscriptions[0].options.eventTypes).toEqual(['item_created']);
  });

  it('should resubscribe when eventTypes options change (issue #128)', () => {
    const listener = vi.fn();
    const { rerender } = renderHook(
      ({ eventTypes }) =>
        useCacheSubscription(mockCache, listener, { eventTypes }),
      { initialProps: { eventTypes: ['item_created'] as any } }
    );

    expect(mockCache.subscribe).toHaveBeenCalledTimes(1);
    expect(subscriptions[0].options.eventTypes).toEqual(['item_created']);

    rerender({ eventTypes: ['item_updated'] as any });

    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockCache.subscribe).toHaveBeenCalledTimes(2);
    expect(subscriptions[1].options.eventTypes).toEqual(['item_updated']);
  });

  it('should resubscribe when keys filter changes', () => {
    const listener = vi.fn();
    const keyA = { kt: 'test', pk: 'a' };
    const keyB = { kt: 'test', pk: 'b' };

    const { rerender } = renderHook(
      ({ keys }) =>
        useCacheSubscription(mockCache, listener, { keys }),
      { initialProps: { keys: [keyA] as any } }
    );

    expect(mockCache.subscribe).toHaveBeenCalledTimes(1);

    rerender({ keys: [keyB] as any });

    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockCache.subscribe).toHaveBeenCalledTimes(2);
    expect(subscriptions[1].options.keys).toEqual([keyB]);
  });

  it('should not resubscribe when listener identity changes but options stay the same', () => {
    const { rerender } = renderHook(
      ({ listener }) =>
        useCacheSubscription(mockCache, listener, { eventTypes: ['item_created'] }),
      { initialProps: { listener: vi.fn() } }
    );

    expect(mockCache.subscribe).toHaveBeenCalledTimes(1);

    rerender({ listener: vi.fn() });

    expect(mockCache.subscribe).toHaveBeenCalledTimes(1);
    expect(subscriptions[0].unsubscribe).not.toHaveBeenCalled();
  });

  it('should unsubscribe when cache becomes null', () => {
    const listener = vi.fn();
    const { rerender } = renderHook(
      ({ cache }) =>
        useCacheSubscription(cache, listener, { eventTypes: ['item_created'] }),
      { initialProps: { cache: mockCache as any } }
    );

    expect(mockCache.subscribe).toHaveBeenCalledTimes(1);

    rerender({ cache: null as any });

    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
  });
});
