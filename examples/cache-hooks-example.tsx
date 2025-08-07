import React from 'react';
import { Cache } from '@fjell/cache';
import { Item, ItemQuery, PriKey } from '@fjell/core';
import { useCacheItem, useCacheQuery } from '../src/hooks';

// Example item type
interface User extends Item<'user'> {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

// Props for components that receive a cache instance
interface CacheComponentProps {
  userCache: Cache<User, 'user'>;
}

/**
 * Component that displays a single user using the useCacheItem hook
 */
const UserProfile: React.FC<CacheComponentProps & { userId: string }> = ({
  userCache,
  userId
}) => {
  const userKey: PriKey<'user'> = { pk: userId };
  const { item: user, isLoading, refetch } = useCacheItem(userCache, userKey);

  if (isLoading) {
    return <div>Loading user...</div>;
  }

  if (!user) {
    return (
      <div>
        <p>User not found</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Status: <span className={`status-${user.status}`}>{user.status}</span></p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
};

/**
 * Component that displays a list of users using the useCacheQuery hook
 */
const UserList: React.FC<CacheComponentProps> = ({ userCache }) => {
  const activeUsersQuery: ItemQuery = { status: 'active' };
  const { items: users, isLoading, refetch } = useCacheQuery(userCache, activeUsersQuery);

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="user-list">
      <div className="header">
        <h2>Active Users ({users.length})</h2>
        <button onClick={handleRefresh}>Refresh</button>
      </div>

      {users.length === 0 ? (
        <p>No active users found</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id} className="user-item">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Component that demonstrates live updates when cache events occur
 */
const LiveUserDashboard: React.FC<CacheComponentProps> = ({ userCache }) => {
  const allUsersQuery: ItemQuery = {};
  const { items: allUsers } = useCacheQuery(userCache, allUsersQuery);

  const activeUsers = allUsers.filter(user => user.status === 'active');
  const inactiveUsers = allUsers.filter(user => user.status === 'inactive');

  const handleCreateUser = async () => {
    const newUser = {
      id: `user-${Date.now()}`,
      name: `New User ${Math.floor(Math.random() * 1000)}`,
      email: `user${Date.now()}@example.com`,
      status: 'active' as const
    };

    try {
      await userCache.operations.create(newUser);
      // The useCacheQuery hook will automatically update the UI
      // when the cache emits the 'item_created' event
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      await userCache.operations.update(user.key, { status: newStatus });
      // The useCacheQuery hook will automatically update the UI
      // when the cache emits the 'item_updated' event
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="live-dashboard">
      <div className="dashboard-header">
        <h1>Live User Dashboard</h1>
        <button onClick={handleCreateUser}>Add Random User</button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <span className="stat-number">{allUsers.length}</span>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <span className="stat-number">{activeUsers.length}</span>
        </div>
        <div className="stat-card">
          <h3>Inactive Users</h3>
          <span className="stat-number">{inactiveUsers.length}</span>
        </div>
      </div>

      <div className="user-sections">
        <section className="active-section">
          <h2>Active Users</h2>
          {activeUsers.map(user => (
            <div key={user.id} className="user-card">
              <span>{user.name}</span>
              <button
                onClick={() => handleToggleUserStatus(user)}
                className="toggle-status"
              >
                Deactivate
              </button>
            </div>
          ))}
        </section>

        <section className="inactive-section">
          <h2>Inactive Users</h2>
          {inactiveUsers.map(user => (
            <div key={user.id} className="user-card inactive">
              <span>{user.name}</span>
              <button
                onClick={() => handleToggleUserStatus(user)}
                className="toggle-status"
              >
                Activate
              </button>
            </div>
          ))}
        </section>
      </div>

      <div className="demo-note">
        <p>
          <strong>Demo:</strong> This dashboard updates in real-time as you create or modify users.
          The hooks automatically subscribe to cache events and update the UI without manual state management.
        </p>
      </div>
    </div>
  );
};

/**
 * Example app showing all the hooks in action
 */
const App: React.FC<{ userCache: Cache<User, 'user'> }> = ({ userCache }) => {
  return (
    <div className="app">
      <UserProfile userCache={userCache} userId="user-1" />
      <UserList userCache={userCache} />
      <LiveUserDashboard userCache={userCache} />
    </div>
  );
};

export default App;

// Usage example with cache setup:
/*
import { createCache } from '@fjell/cache';
import { createRegistry } from '@fjell/registry';

const registry = createRegistry();
const coordinate = { kta: ['user'] as ['user'] };

// Your API implementation
const userApi = {
  async all(query) { ... },
  async get(key) { ... },
  async create(user) { ... },
  async update(key, updates) { ... },
  // ... other API methods
};

const userCache = createCache(userApi, coordinate, registry, {
  cacheType: 'memory'
});

// Now you can use the components
<App userCache={userCache} />
*/
