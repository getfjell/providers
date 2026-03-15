# Usage Guide

Comprehensive usage guidance for `@fjell/providers`.

## Installation

```bash
npm install @fjell/providers
```

## API Highlights

- Namespaces for `AItem`, `PItem`, `PItems`, `CItem`, and `CItems` flows
- Provider/query/facet exports for both primary and contained models
- `useAsyncError`, utility helpers, and shared provider types

## Quick Example

```ts
import { PItems } from "@fjell/providers";

const widgetsProvider = PItems.createProvider({
  load: async query => client.widgets.find(query),
  save: async item => client.widgets.save(item),
});

const widgets = await widgetsProvider.find({ tenantId: "t1" });
```

## Model Consumption Rules

1. Import from the package root (`@fjell/providers`) instead of deep-internal paths unless explicitly documented.
2. Keep usage aligned with exported public symbols listed in this guide.
3. Prefer explicit typing at package boundaries so generated code remains robust during upgrades.
4. Keep error handling deterministic and map infrastructure failures into domain-level errors.
5. Co-locate integration wrappers in your app so model-generated code has one canonical entry point.

## Best Practices

- Keep examples and abstractions consistent with existing Fjell package conventions.
- Favor composable wrappers over one-off inline integration logic.
- Add targeted tests around generated integration code paths.
