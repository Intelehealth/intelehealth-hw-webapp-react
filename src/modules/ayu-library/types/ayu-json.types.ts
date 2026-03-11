import type { FhirQuestionnaire } from './fhir-raw.types';

// Raw response from API - json is a string
export interface AyuJsonItemRaw {
  id: number;
  name: string;
  json: string;
  keyName: string;
  isActive: boolean;
}

export interface AyuApiResponse {
  data: AyuJsonItemRaw[];
}

// Parsed item stored in Redux - json is parsed object
export interface AyuJsonItem {
  id: number;
  name: string;
  json: FhirQuestionnaire;
  keyName: string;
  isActive: boolean;
}
