export type CapturedImageStatus = 'uploading' | 'done' | 'failed';

export interface CapturedImage {
  file: File | null;
  preview: string;
  assetRecordId?: number;
  status: CapturedImageStatus;
}

export interface ObsPushDTO {
  concept: string;
  encounter: string;
  obsDatetime: string;
  person: string;
  comment: string;
}

export interface ObsResult {
  uuid: string;
  comment: string;
  value: {
    display: string;
    links: { rel: string; uri: string };
  };
  encounter: {
    visit: { uuid: string };
  } | null;
}

export interface ObsApiResponse {
  results: ObsResult[];
}

export interface CapturedDocument {
  file: File;
  preview: string;
  name: string;
}

export const ACCEPTED_DOCUMENT_TYPES = 'image/*,.jpg,.jpeg,.png,.gif,.webp';

export const OBS_CONCEPTS = {
  PHYSICAL_EXAMINATION: '200b7a45-77bc-4986-b879-cc727f5f7d5b',
  ADDITIONAL_DOCUMENT: '07a816ce-ffc0-49b9-ad92-a1bf9bf5e2ba',
} as const;
