import type { WebpackRequireContext } from '../types/common.types';

export const commonFuctions = {
  // Utility function to load all components from a folder (including subfolders)
  loadComponents: (
    context: WebpackRequireContext
  ): Record<string, React.ComponentType> => {
    const components: Record<string, React.ComponentType> = {};

    context.keys().forEach(key => {
      const componentName = key
        .replace(/^.*[\\/]/, '') // e.g., './Home.component.tsx' → 'Home.component.tsx'
        .replace('.component.tsx', ''); // e.g., 'Home.component.tsx' → 'Home'

      const module = context(key);
      components[componentName] = module.default;
    });

    return components;
  },
};
