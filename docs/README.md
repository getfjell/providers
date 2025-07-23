# Fjell Providers Documentation

This directory contains the documentation site for Fjell Providers, built using the Fjell docs template.

## Development

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Run tests
pnpm run test
```

## Configuration

The documentation is configured in `docs.config.ts`. This file defines:

- Project metadata (name, branding, links)
- Documentation sections and their source files
- Files to copy during the build process
- Theme and styling configuration

## Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the main branch via the `.github/workflows/deploy-docs.yml` workflow.
