import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache } from '@fjell/cache';
import { Item } from "@fjell/types";
import { PItemAdapter, useCacheSubscription } from '../src';

// Mock logger to avoid console noise in tests
vi.mock('../src/logger', () => ({
  default: {
    get: () => ({
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

interface TestUser extends Item<'test-user'> {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const TestUserAdapterContext: PItemAdapter.Context<TestUser, 'test-user'> = React.createContext<PItemAdapter.ContextType<TestUser, 'test-user'> | undefined>(null as any);

describe('Cache Events Integration', () => {
  let mockCache: Cache<TestUser, 'test-user'>;
  let eventListeners: Array<(event: any) => void>;

  beforeEach(() => {
    eventListeners = [];

    // Create a mock cache with event subscription support
    mockCache = {
      coordinate: {
        kta: ['test-user']
      },
      cacheMap: {
        get: vi.fn(),
        set: vi.fn(),
      },
      operations: {
        get: vi.fn().mockResolvedValue([null, null]),
        set: vi.fn().mockResolvedValue([null, null]),
        update: vi.fn().mockResolvedValue([null, null]),
        remove: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue([null, null]),
        retrieve: vi.fn().mockResolvedValue([null, null]),
        one: vi.fn().mockResolvedValue([null, null]),
        all: vi.fn().mockResolvedValue([null, []]),
        action: vi.fn().mockResolvedValue([null, null]),
        allAction: vi.fn().mockResolvedValue([null, []]),
        facet: vi.fn().mockResolvedValue([null, null]),
        allFacet: vi.fn().mockResolvedValue([null, null]),
        find: vi.fn().mockResolvedValue([null, []]),
      },
      subscribe: vi.fn((listener, options) => {
        eventListeners.push(listener);
        return {
          id: `sub_${eventListeners.length}`,
          unsubscribe: () => {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
              eventListeners.splice(index, 1);
            }
          },
          isActive: () => true,
          getOptions: () => options || {}
        };
      }),
      unsubscribe: vi.fn()
    } as any;
  });

  it('should subscribe to cache events in adapters', async () => {
    render(
      <PItemAdapter.Adapter
        name="TestAdapter"
        cache={mockCache}
        context={TestUserAdapterContext}
      >
        <div>Test content</div>
      </PItemAdapter.Adapter>
    );

    // Wait for the component to mount and subscribe
    await waitFor(() => {
      expect(mockCache.subscribe).toHaveBeenCalled();
    });

    // Verify subscription was called with correct event types
    expect(mockCache.subscribe).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        eventTypes: expect.arrayContaining([
          'item_created',
          'item_updated',
          'item_removed',
          'item_retrieved',
          'item_set',
          'items_queried',
          'cache_cleared',
          'location_invalidated',
          'query_invalidated'
        ]),
        debounceMs: 0
      })
    );
  });

  it('should trigger re-renders when cache events occur', async () => {
    const eventReceived = { current: false };

    const TestComponent = () => {
      const [renderCount, setRenderCount] = React.useState(0);

      // Use useCacheSubscription to test cache event handling
      useCacheSubscription(mockCache, () => {
        eventReceived.current = true;
        setRenderCount(prev => prev + 1);
      }, {
        eventTypes: ['item_updated']
      });

      return <div data-testid="render-count">{renderCount}</div>;
    };

    render(
      <PItemAdapter.Adapter
        name="TestAdapter"
        cache={mockCache}
        context={TestUserAdapterContext}
      >
        <TestComponent />
      </PItemAdapter.Adapter>
    );

    // Wait for both adapter and component subscriptions
    await waitFor(() => {
      expect(mockCache.subscribe).toHaveBeenCalledTimes(2); // Adapter + TestComponent
    });

    // Capture initial render state
    await waitFor(() => {
      const element = screen.getByTestId('render-count');
      expect(element.textContent).toBe('0');
    });

    // Simulate a cache event - call all listeners
    await act(async () => {
      if (eventListeners.length > 0) {
        const testEvent = {
          type: 'item_updated',
          timestamp: Date.now(),
          source: 'api',
          key: { pk: 'test-user-1' },
          item: { id: 'test-user-1', name: 'Updated User' },
          previousItem: { id: 'test-user-1', name: 'Original User' }
        };
        // Call all event listeners
        eventListeners.forEach(listener => listener(testEvent));
      }
    });

    // Should trigger a re-render due to cache event
    await waitFor(() => {
      const element = screen.getByTestId('render-count');
      expect(element.textContent).toBe('1');
      expect(eventReceived.current).toBe(true);
    }, { timeout: 200 });
  });

  it('should unsubscribe when component unmounts', async () => {
    const unsubscribeMock = vi.fn();
    mockCache.subscribe = vi.fn(() => ({
      id: 'test-sub',
      unsubscribe: unsubscribeMock,
      isActive: () => true,
      getOptions: () => ({})
    }));

    const { unmount } = render(
      <PItemAdapter.Adapter
        name="TestAdapter"
        cache={mockCache}
        context={TestUserAdapterContext}
      >
        <div>Test content</div>
      </PItemAdapter.Adapter>
    );

    // Wait for subscription
    await waitFor(() => {
      expect(mockCache.subscribe).toHaveBeenCalled();
    });

    // Unmount component
    unmount();

    // Should have called unsubscribe
    await waitFor(() => {
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  it('should work with useCacheSubscription hook', async () => {
    const eventHandler = vi.fn();

    const TestComponent = () => {
      useCacheSubscription(mockCache, eventHandler, {
        eventTypes: ['item_updated']
      });

      return <div>Listening for events</div>;
    };

    render(<TestComponent />);

    // Wait for subscription
    await waitFor(() => {
      expect(mockCache.subscribe).toHaveBeenCalled();
    });

    // Verify subscription options - the hook copies the eventTypes array
    expect(mockCache.subscribe).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        eventTypes: ['item_updated']
      })
    );

    // Test that the event handler is called when an event is triggered
    await act(async () => {
      if (eventListeners.length > 0) {
        const testEvent = {
          type: 'item_updated',
          timestamp: Date.now(),
          source: 'api',
          key: { pk: 'test-user-1' },
          item: { id: 'test-user-1', name: 'Updated User' }
        };
        eventListeners[eventListeners.length - 1](testEvent); // Call the most recent listener
      }
    });

    expect(eventHandler).toHaveBeenCalled();
  });

  it('should handle multiple simultaneous subscriptions', async () => {
    const TestComponent1 = () => {
      useCacheSubscription(mockCache, vi.fn(), { eventTypes: ['item_created'] });
      return <div>Component 1</div>;
    };

    const TestComponent2 = () => {
      useCacheSubscription(mockCache, vi.fn(), { eventTypes: ['item_updated'] });
      return <div>Component 2</div>;
    };

    render(
      <div>
        <TestComponent1 />
        <TestComponent2 />
        <PItemAdapter.Adapter
          name="TestAdapter"
          cache={mockCache}
          context={TestUserAdapterContext}
        >
          <div>Adapter component</div>
        </PItemAdapter.Adapter>
      </div>
    );

    // Should have 3 subscriptions (2 from hooks + 1 from adapter)
    await waitFor(() => {
      expect(mockCache.subscribe).toHaveBeenCalledTimes(3);
    });
  });
});
