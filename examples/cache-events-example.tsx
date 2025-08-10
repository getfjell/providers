import React, { useCallback, useState } from 'react';
import { Cache } from '@fjell/cache';
import { Item, PriKey } from '@fjell/core';
import {
  PItem,
  PItemAdapter,
  PItemLoad,
  PItems,
  PItemsProvider,
  useCacheSubscription
} from '../src';

// Example item types
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

// Props for components that receive cache instances
interface CacheComponentProps {
  userCache: Cache<User, 'user'>;
  notificationCache: Cache<Notification, 'notification'>;
}

// Create contexts for the providers
const UserItemContext = React.createContext<PItem.ContextType<User, 'user'> | null>(null);
const UserItemAdapterContext = React.createContext<PItemAdapter.ContextType<User, 'user'> | null>(null);
const NotificationItemsContext = React.createContext<PItems.ContextType<Notification, 'notification'> | null>(null);
const NotificationAdapterContext = React.createContext<PItemAdapter.ContextType<Notification, 'notification'> | null>(null);

/**
 * Component that shows cache events in real-time
 */
const CacheEventMonitor: React.FC<CacheComponentProps> = ({ userCache, notificationCache }) => {
  const [events, setEvents] = useState<string[]>([]);

  // Subscribe to user cache events
  useCacheSubscription(userCache, useCallback((event) => {
    const timestamp = new Date().toLocaleTimeString();
    const eventStr = `[${timestamp}] User Cache: ${event.type} - ${event.source}`;
    setEvents(prev => [eventStr, ...prev.slice(0, 19)]); // Keep last 20 events
  }, []), {
    debounceMs: 100
  });

  // Subscribe to notification cache events
  useCacheSubscription(notificationCache, useCallback((event) => {
    const timestamp = new Date().toLocaleTimeString();
    const eventStr = `[${timestamp}] Notification Cache: ${event.type} - ${event.source}`;
    setEvents(prev => [eventStr, ...prev.slice(0, 19)]); // Keep last 20 events
  }, []), {
    debounceMs: 100
  });

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      padding: '1rem',
      borderRadius: '8px',
      height: '300px',
      overflow: 'auto'
    }}>
      <h3>Real-time Cache Events</h3>
      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
        {events.length === 0 ? (
          <p style={{ color: '#666' }}>No events yet... Try creating, updating, or deleting items.</p>
        ) : (
          events.map((event, index) => (
            <div key={index} style={{
              padding: '2px 0',
              borderBottom: index < events.length - 1 ? '1px solid #ddd' : 'none'
            }}>
              {event}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * User profile component that automatically updates when user data changes
 */
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const userKey: PriKey<'user'> = { pk: userId };

  return (
    <PItemLoad
      name="UserProfile"
      adapter={UserItemAdapterContext}
      context={UserItemContext}
      contextName="UserProfile"
      ik={userKey}
    >
      <UserProfileContent />
    </PItemLoad>
  );
};

const UserProfileContent: React.FC = () => {
  const { item: user, isLoading, update, remove } = PItem.usePItem(UserItemContext, 'UserProfile');

  const handleToggleStatus = useCallback(async () => {
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await update({
      ...user,
      status: newStatus,
      lastUpdated: new Date()
    });
  }, [user, update]);

  const handleDelete = useCallback(async () => {
    if (!user || !window.confirm('Are you sure you want to delete this user?')) return;
    await remove();
  }, [user, remove]);

  if (isLoading) {
    return <div>Loading user...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem'
    }}>
      <h3>{user.name}</h3>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Status:</strong>
        <span style={{
          color: user.status === 'active' ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {user.status}
        </span>
      </p>
      <p><strong>Last Updated:</strong> {user.lastUpdated.toLocaleString()}</p>

      <div>
        <button
          onClick={handleToggleStatus}
          style={{ marginRight: '0.5rem' }}
        >
          Toggle Status
        </button>
        <button
          onClick={handleDelete}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Delete User
        </button>
      </div>
    </div>
  );
};

/**
 * Notifications list that updates in real-time
 */
const NotificationList: React.FC = () => {
  return (
    <PItemsProvider
      name="NotificationList"
      adapter={NotificationAdapterContext}
      context={NotificationItemsContext}
      contextName="NotificationList"
      renderEach={(notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      )}
    >
      <NotificationListContent />
    </PItemsProvider>
  );
};

const NotificationListContent: React.FC = () => {
  const { items: notifications, isLoading, create } = PItems.usePItems(NotificationItemsContext, 'NotificationList');

  const handleCreateNotification = useCallback(async () => {
    const types: ('info' | 'warning' | 'error' | 'success')[] = ['info', 'warning', 'error', 'success'];
    const messages = [
      'Your profile has been updated',
      'New message received',
      'System maintenance scheduled',
      'Password changed successfully',
      'Account verification required'
    ];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await create({
      id: `notif_${Date.now()}`,
      type: randomType,
      message: randomMessage,
      userId: 'user1', // In a real app, this would be the current user
      read: false,
      createdAt: new Date()
    });
  }, [create]);

  if (isLoading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3>Notifications ({notifications.length})</h3>
        <button onClick={handleCreateNotification}>
          Add Random Notification
        </button>
      </div>

      {notifications.length === 0 ? (
        <p style={{ color: '#666' }}>No notifications</p>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'success': return '#28a745';
      default: return '#007bff';
    }
  };

  return (
    <div style={{
      border: `1px solid ${getTypeColor(notification.type)}`,
      borderLeft: `4px solid ${getTypeColor(notification.type)}`,
      borderRadius: '4px',
      padding: '0.75rem',
      marginBottom: '0.5rem',
      backgroundColor: notification.read ? '#f8f9fa' : 'white'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{
            backgroundColor: getTypeColor(notification.type),
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            marginRight: '0.5rem'
          }}>
            {notification.type.toUpperCase()}
          </span>
          <span>{notification.message}</span>
        </div>
        <span style={{
          fontSize: '0.75rem',
          color: '#666',
          whiteSpace: 'nowrap'
        }}>
          {notification.createdAt.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

/**
 * Main demo component
 */
const CacheEventsDemo: React.FC<CacheComponentProps> = ({ userCache, notificationCache }) => {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Fjell Cache Events Demo</h1>
      <p>
        This demo shows how the Fjell Providers automatically update when cache events occur.
        Try modifying users or creating notifications to see real-time updates across all components.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h2>User Management</h2>
          <PItemAdapter.Adapter
            name="UserAdapter"
            cache={userCache}
            context={UserItemAdapterContext}
          >
            <UserProfile userId="user1" />
            <UserProfile userId="user2" />
          </PItemAdapter.Adapter>
        </div>

        <div>
          <h2>Notifications</h2>
          <PItemAdapter.Adapter
            name="NotificationAdapter"
            cache={notificationCache}
            context={NotificationAdapterContext}
          >
            <NotificationList />
          </PItemAdapter.Adapter>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <CacheEventMonitor
          userCache={userCache}
          notificationCache={notificationCache}
        />
      </div>
    </div>
  );
};

export default CacheEventsDemo;
export { CacheEventsDemo, CacheEventMonitor, UserProfile, NotificationList };
