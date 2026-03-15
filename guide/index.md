# @fjell/providers - Agentic Guide

## Purpose

Provider and adapter layer for connecting Fjell APIs to application state flows.

This guide is optimized for AI-assisted code generation and integration workflows.

## Documentation

- **[Usage Guide](./usage.md)** - API-oriented usage patterns and model-safe examples
- **[Integration Guide](./integration.md)** - Architecture placement, composition rules, and implementation guidance

## Key Capabilities

- Exports adapter/provider utilities for primary and contained item patterns
- Includes query/facet/find hooks and helper utilities
- Normalizes client API error handling with shared Fjell error types

## Installation

```bash
npm install @fjell/providers
```

## Public API Highlights

- Namespaces for `AItem`, `PItem`, `PItems`, `CItem`, and `CItems` flows
- Provider/query/facet exports for both primary and contained models
- `useAsyncError`, utility helpers, and shared provider types
