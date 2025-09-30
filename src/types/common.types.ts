export interface Slide {
  image: string;
  title: string;
  description: string;
}

export type WebpackRequireContext = {
  keys: () => string[];
  <T = unknown>(id: string): { default: React.ComponentType<T> };
};
