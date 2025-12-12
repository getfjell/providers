# Fjell Providers

React providers for the Fjell ecosystem, providing seamless integration with Fjell's core functionality through React context and hooks.

## Overview

Fjell Providers offers a comprehensive set of React providers and hooks that make it easy to integrate Fjell's powerful data management capabilities into your React applications. Built on top of [@fjell/core](https://www.npmjs.com/package/@fjell/core), [@fjell/cache](https://www.npmjs.com/package/@fjell/cache), and [@fjell/client-api](https://www.npmjs.com/package/@fjell/client-api), this package provides type-safe, performant React components and hooks.

## Key Features

- **React Context Integration**: Seamless integration with React's context system
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Performance Optimized**: Built with React 19 and modern React patterns
- **Error Boundaries**: Robust error handling with React Error Boundary
- **Caching Support**: Integrated caching capabilities through Fjell Cache
- **API Integration**: Easy connection to Fjell Client API

## Installation

```bash
npm install @fjell/providers
# or
npm install @fjell/providers
# or
yarn add @fjell/providers
```

## Dependencies

This package depends on several Fjell ecosystem packages:

- `@fjell/cache` - Caching functionality
- `@fjell/client-api` - API client capabilities
- `@fjell/core` - Core Fjell functionality
- `@fjell/logging` - Logging capabilities
- `react` & `react-dom` - React framework
- `react-error-boundary` - Error handling

## Quick Start

```tsx
import { AItemProvider, useAItem } from '@fjell/providers';

function App() {
  return (
    <AItemProvider>
      <MyComponent />
    </AItemProvider>
  );
}

function MyComponent() {
  const { items, loading, error } = useAItem();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Components

### Primary Providers
- **AItemProvider** - Main item provider with comprehensive functionality
- **AItemsProvider** - Multiple items management

### Contained Providers
- **CItemProvider** - Contained item provider for specific contexts
- **CItemsProvider** - Multiple contained items management

### Adapters
- **AItemAdapter** - Adapter component for item transformation and mapping

## Error Handling

All providers include robust error handling through React Error Boundary integration:

```tsx
import { AItemProvider } from '@fjell/providers';

function App() {
  return (
    <AItemProvider
      onError={(error, errorInfo) => {
        console.error('Provider error:', error, errorInfo);
      }}
    >
      <YourApp />
    </AItemProvider>
  );
}
```

## TypeScript Support

Fjell Providers is built with TypeScript and provides comprehensive type definitions:

```tsx
import type { AItem, AItemConfig } from '@fjell/providers';

interface CustomItem extends AItem {
  customField: string;
}

const config: AItemConfig<CustomItem> = {
  // Fully typed configuration
};
```

## Performance

- Built with React 19 for optimal performance
- Integrated caching through @fjell/cache
- Optimized re-rendering patterns
- Memory-efficient data management

## License

Apache-2.0

## Contributing

This package is part of the Fjell ecosystem. For contributing guidelines and development setup, please refer to the main Fjell documentation.

Built by the Fjell team.
