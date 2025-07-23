interface DocsConfig {
  projectName: string;
  basePath: string;
  port: number;
  branding: {
    theme: string;
    tagline: string;
    logo?: string;
    backgroundImage?: string;
    primaryColor?: string;
    accentColor?: string;
    github?: string;
    npm?: string;
  };
  sections: Array<{
    id: string;
    title: string;
    subtitle: string;
    file: string;
  }>;
  filesToCopy: Array<{
    source: string;
    destination: string;
  }>;
  plugins?: any[];
  version: {
    source: string;
  };
  customContent?: {
    [key: string]: (content: string) => string;
  };
}

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
