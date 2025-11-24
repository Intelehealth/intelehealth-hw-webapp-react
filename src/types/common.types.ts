export interface Slide {
  image: string;
  title: string;
  description: string;
  heartbeat1?: string; // red heartbeat image
  heartbeat2?: string; // green heartbeat image
}

export interface CountryCode {
  name: string;
  code: string;
  dial_code: string;
}

export interface PhoneNumberObject {
  countryCode: string;
  number: string;
}

export type WebpackRequireContext = {
  keys: () => string[];
  <T = unknown>(id: string): { default: React.ComponentType<T> };
};
