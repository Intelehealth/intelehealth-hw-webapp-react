import { OpenMRSApi } from '../../../services/openmrs';
import type { ObsApiResponse } from '../types/obs.types';
import { OBS_CONCEPTS } from '../types/obs.types';

const OBS_ENDPOINT = '/obs';

// The hook pushes images here as the user captures them.
let pendingImages: Array<{ file: File; comment: string }> = [];

export const addPendingImage = (file: File, comment: string) => {
  pendingImages.push({ file, comment });
};

export const removePendingImage = (index: number) => {
  pendingImages.splice(index, 1);
};

export const clearPendingImages = () => {
  pendingImages = [];
};

export const getPendingImages = () => pendingImages;

/**
 * Upload all pending physical exam images in bulk via Promise.all.
 * Call after visit + encounter creation.
 */
export const uploadAllPhysicalExamImages = async (
  encounterUuid: string,
  patientUuid: string
): Promise<void> => {
  if (pendingImages.length === 0) return;

  const uploads = pendingImages.map(img => {
    const formData = new FormData();
    formData.append('file', img.file);
    formData.append(
      'json',
      JSON.stringify({
        concept: OBS_CONCEPTS.PHYSICAL_EXAMINATION,
        encounter: encounterUuid,
        person: patientUuid,
        obsDatetime: new Date().toISOString(),
        comment: img.comment,
      })
    );
    return OpenMRSApi.post(OBS_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  await Promise.all(uploads);
  pendingImages = [];
};

// ─── Additional Documents ────────────────────────────────────────────────────

let pendingDocuments: Array<{ file: File; comment: string }> = [];

export const addPendingDocument = (file: File, comment: string) => {
  pendingDocuments.push({ file, comment });
};

export const removePendingDocument = (index: number) => {
  pendingDocuments.splice(index, 1);
};

export const clearPendingDocuments = () => {
  pendingDocuments = [];
};

export const getPendingDocuments = () => pendingDocuments;

/**
 * Upload all pending additional documents in bulk via Promise.all.
 * Call after visit + encounter creation.
 */
export const uploadAllAdditionalDocuments = async (
  encounterUuid: string,
  patientUuid: string
): Promise<void> => {
  if (pendingDocuments.length === 0) return;

  const uploads = pendingDocuments.map(doc => {
    const formData = new FormData();
    formData.append('file', doc.file);
    formData.append(
      'json',
      JSON.stringify({
        concept: OBS_CONCEPTS.ADDITIONAL_DOCUMENT,
        encounter: encounterUuid,
        person: patientUuid,
        obsDatetime: new Date().toISOString(),
        comment: doc.comment,
      })
    );
    return OpenMRSApi.post(OBS_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  await Promise.all(uploads);
  pendingDocuments = [];
};

/**
 * GET /obs?patient={patientUuid}&concept={conceptUuid}
 *       &v=custom:(uuid,comment,value,encounter:(visit:(uuid)))
 */
export const getObsByPatientAndConcept = async (
  patientUuid: string,
  conceptUuid: string
): Promise<ObsApiResponse> => {
  const url = `${OBS_ENDPOINT}?patient=${patientUuid}&v=custom:(uuid,comment,value,encounter:(visit:(uuid)))&concept=${conceptUuid}`;
  return OpenMRSApi.get<ObsApiResponse>(url);
};
