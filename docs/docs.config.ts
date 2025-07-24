import { DocsConfig } from '@fjell/docs-template';

const config: DocsConfig = {
  projectName: 'Fjell Providers',
  basePath: '/providers/',
  port: 3004,
  branding: {
    theme: 'providers',
    tagline: 'React Providers for Fjell',
    backgroundImage: '/pano.png',
    github: 'https://github.com/getfjell/fjell-providers',
    npm: 'https://www.npmjs.com/package/@fjell/providers'
  },
  sections: [
    {
      id: 'overview',
      title: 'Foundation',
      subtitle: 'Core concepts & usage',
      file: '/README.md'
    }
  ],
  filesToCopy: [
    {
      source: '../README.md',
      destination: 'public/README.md'
    }
  ],
  plugins: [],
  version: {
    source: 'package.json'
  }
}

export default config
