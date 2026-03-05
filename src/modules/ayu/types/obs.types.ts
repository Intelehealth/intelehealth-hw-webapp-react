/** Captured image: keeps both the File (for upload) and base64 (for preview) */
export interface CapturedImage {
  file: File;
  preview: string; // base64 data-URL for thumbnail display
}

/** JSON part of the multipart obs image upload (matches Android ObsPushDTO) */
export interface ObsPushDTO {
  concept: string;
  encounter: string;
  obsDatetime: string;
  person: string;
  comment: string;
}

/** Single obs result from GET /obs */
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

/** Response from GET /obs */
export interface ObsApiResponse {
  results: ObsResult[];
}

/** Concept UUIDs for physical exam image observations */
export const OBS_CONCEPTS = {
  PHYSICAL_EXAMINATION: '200b7a45-77bc-4986-b879-cc727f5f7d5b',
  ADDITIONAL_DOCUMENT: '07a816ce-ffc0-49b9-ad92-a1bf9bf5e2ba',
} as const;
