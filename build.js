import { createReactConfig } from '@fjell/eslint-config/esbuild/react';
import { createBuilder } from '@fjell/eslint-config/esbuild';

// React library with automatic JSX and proper externals
// Use temp-config strategy to generate all TypeScript declarations
const config = createReactConfig();
const buildOptions = {
  generateTypes: true,
  typeStrategy: "temp-config"
};

createBuilder(config, buildOptions)();
