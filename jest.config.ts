
// jest.config.ts
// import { pathsToModuleNameMapper } from 'ts-jest'
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
// import { compilerOptions } from './tsconfig.json'
import type { JestConfigWithTsJest } from 'ts-jest'

const esModules = [
  '@fjell',
].join('|');

const jestConfig: JestConfigWithTsJest = {
  // roots: ['<rootDir>'],
  // modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  // moduleNameMapper: {
  //   ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' } ),
  //   '^(\\.{1,2}/.*)\\.js$': '$1',
  // },
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/',
    '<rootDir>/src/index.ts',
    '<rootDir>/src/logger.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  preset: 'ts-jest/presets/js-with-ts',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '@/(.*)': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.js?$': 'babel-jest',
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts']
};

export default jestConfig;