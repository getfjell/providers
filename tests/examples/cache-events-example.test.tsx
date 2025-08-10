import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache } from '@fjell/cache';
import { Item } from '@fjell/core';
import {
  CacheEventMonitor,
  CacheEventsDemo
} from '../../examples/cache-events-example';

// Mock logger to avoid console noise in tests
vi.mock('../../src/logger', () => ({
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

// Mock window.confirm for delete operations
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(),
});

interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastUpdated: Date;
}

interface Notification extends Item<'notification'> {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId: string;
  read: boolean;
  createdAt: Date;
}

describe('Cache Events Example', () => {
  let mockUserCache: Cache<User, 'user'>;
  let mockNotificationCache: Cache<Notification, 'notification'>;
  let userEventListeners: Array<(event: any) => void>;
  let notificationEventListeners: Array<(event: any) => void>;

  const createMockCache = <T extends Item<K>, K extends string>(
    listeners: Array<(event: any) => void>,
    kta: K[]
  ): Cache<T, K> => ({
      coordinate: {
        kta
      },
      cacheMap: {
        get: vi.fn(),
        set: vi.fn(),
        clone: vi.fn()
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
        listeners.push(listener);
        return {
          id: `sub_${listeners.length}`,
          unsubscribe: () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          },
          isActive: () => true,
          getOptions: () => options || {}
        };
      }),
      unsubscribe: vi.fn()
    } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    userEventListeners = [];
    notificationEventListeners = [];

    mockUserCache = createMockCache<User, 'user'>(userEventListeners, ['user']);
    mockNotificationCache = createMockCache<Notification, 'notification'>(notificationEventListeners, ['notification']);

    // Mock successful user retrieval
    mockUserCache.operations.one = vi.fn().mockResolvedValue([null, {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      status: 'active',
      lastUpdated: new Date('2023-01-01')
    }]);

    // Mock successful notifications retrieval
    mockNotificationCache.operations.all = vi.fn().mockResolvedValue([null, [
      {
        id: 'notif_1',
        message: 'Test notification',
        type: 'info',
        userId: 'user1',
        read: false,
        createdAt: new Date('2023-01-01')
      }
    ]]);
  });

  describe('CacheEventMonitor', () => {
    it('should render without errors', () => {
      render(
        <CacheEventMonitor
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      expect(screen.getByText('Real-time Cache Events')).toBeInTheDocument();
      expect(screen.getByText(/No events yet/)).toBeInTheDocument();
    });

    it('should subscribe to both cache instances', () => {
      render(
        <CacheEventMonitor
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      expect(mockUserCache.subscribe).toHaveBeenCalled();
      expect(mockNotificationCache.subscribe).toHaveBeenCalled();
    });

    it('should display cache events when they occur', async () => {
      render(
        <CacheEventMonitor
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      // Simulate a user cache event
      act(() => {
        userEventListeners[0]({
          type: 'create',
          source: 'test-source',
          timestamp: Date.now()
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/User Cache: create - test-source/)).toBeInTheDocument();
      });

      // Simulate a notification cache event
      act(() => {
        notificationEventListeners[0]({
          type: 'update',
          source: 'notification-source',
          timestamp: Date.now()
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Notification Cache: update - notification-source/)).toBeInTheDocument();
      });
    });
  });

  describe('CacheEventsDemo', () => {
    it('should render all sections correctly', () => {
      render(
        <CacheEventsDemo
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      expect(screen.getByText('Fjell Cache Events Demo')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Real-time Cache Events')).toBeInTheDocument();
    });

    it('should render user profiles', () => {
      render(
        <CacheEventsDemo
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      // Should render UserProfile components - they initially show "User not found"
      // since the mock doesn't fully simulate the provider behavior
      expect(screen.getAllByText('User not found')).toHaveLength(2);
    });

    it('should render notifications section with empty state', () => {
      render(
        <CacheEventsDemo
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      expect(screen.getByText('Notifications (0)')).toBeInTheDocument();
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText('Add Random Notification')).toBeInTheDocument();
    });
  });

  describe('Component integration', () => {
    it('should handle cache operation failures gracefully', async () => {
      // Mock cache operation failures
      mockUserCache.operations.one = vi.fn().mockResolvedValue([new Error('Network error'), null]);

      render(
        <CacheEventsDemo
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Fjell Cache Events Demo')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should render complete demo structure', () => {
      render(
        <CacheEventsDemo
          userCache={mockUserCache}
          notificationCache={mockNotificationCache}
        />
      );

      // Test that all main sections are present
      expect(screen.getByText('Fjell Cache Events Demo')).toBeInTheDocument();
      expect(screen.getByText(/This demo shows how the Fjell Providers/)).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Real-time Cache Events')).toBeInTheDocument();
    });
  });
});
