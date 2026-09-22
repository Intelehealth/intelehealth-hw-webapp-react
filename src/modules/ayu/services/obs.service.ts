import { OpenMRSApi } from '../../../services/openmrs';
import type { ObsApiResponse } from '../types/obs.types';
import { OBS_CONCEPTS } from '../types/obs.types';

const OBS_ENDPOINT = '/obs';

let pendingImages: Array<{
  file: File;
  comment: string;
  questionId?: string;
  /**
   * Temp-storage asset created for this file. Lets an image restored from
   * temp storage (which has no File) find its queued twin when it is deleted.
   */
  assetRecordId?: number;
}> = [];

export const addPendingImage = (
  file: File,
  comment: string,
  questionId?: string
) => {
  pendingImages.push({ file, comment, questionId });
};

export const removePendingImage = (index: number) => {
  pendingImages.splice(index, 1);
};

export const removePendingImagesByQuestionId = (questionId: string) => {
  pendingImages = pendingImages.filter(img => img.questionId !== questionId);
};

/** Drops only the queued entry for this exact File, leaving every other image queued. */
export const removePendingImageByFile = (file: File) => {
  pendingImages = pendingImages.filter(img => img.file !== file);
};

/** Drops only the queued entry linked to this temp-storage asset. */
export const removePendingImageByAssetId = (assetRecordId: number) => {
  pendingImages = pendingImages.filter(
    img => img.assetRecordId !== assetRecordId
  );
};

/** Links a queued file to the temp-storage asset that was created for it. */
export const setPendingImageAssetId = (file: File, assetRecordId: number) => {
  const entry = pendingImages.find(img => img.file === file);
  if (entry) entry.assetRecordId = assetRecordId;
};

export const clearPendingImages = () => {
  pendingImages = [];
};

export const getPendingImages = () => pendingImages;

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
    return OpenMRSApi.post(OBS_ENDPOINT, formData);
  });

  await Promise.all(uploads);
  pendingImages = [];
};

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

export const uploadAllAdditionalDocuments = async (
  encounterUuid: string | undefined,
  patientUuid: string
): Promise<void> => {
  if (pendingDocuments.length === 0) return;

  const uploads = pendingDocuments.map(doc => {
    const obsJson: Record<string, string> = {
      concept: OBS_CONCEPTS.ADDITIONAL_DOCUMENT,
      person: patientUuid,
      obsDatetime: new Date().toISOString(),
      comment: doc.comment,
    };
    if (encounterUuid) {
      obsJson.encounter = encounterUuid;
    }
    const formData = new FormData();
    formData.append('file', doc.file);
    formData.append('json', JSON.stringify(obsJson));
    return OpenMRSApi.post(OBS_ENDPOINT, formData);
  });

  await Promise.allSettled(uploads);
  pendingDocuments = [];
};

export const getObsByPatientAndConcept = async (
  patientUuid: string,
  conceptUuid: string
): Promise<ObsApiResponse> => {
  const url = `${OBS_ENDPOINT}?patient=${patientUuid}&v=custom:(uuid,comment,value,encounter:(visit:(uuid)))&concept=${conceptUuid}`;
  return OpenMRSApi.get<ObsApiResponse>(url);
};

export const getLatestEncounterUuid = async (
  patientUuid: string,
  encounterTypeUuid: string
): Promise<string | undefined> => {
  const response = await OpenMRSApi.get<{
    results: Array<{
      encounters: Array<{ uuid: string; encounterType: { uuid: string } }>;
    }>;
  }>(
    `/visit?patient=${patientUuid}&v=custom:(encounters:(uuid,encounterType:(uuid)))&limit=1&order=desc`
  );
  const visit = response.results?.[0];
  if (!visit) return undefined;
  return visit.encounters?.find(
    enc => enc.encounterType?.uuid === encounterTypeUuid
  )?.uuid;
};

export const getLatestVisitUuid = async (
  patientUuid: string
): Promise<string | undefined> => {
  const response = await OpenMRSApi.get<{
    results: Array<{ uuid: string }>;
  }>(`/visit?patient=${patientUuid}&v=custom:(uuid)&limit=1&order=desc`);
  return response.results?.[0]?.uuid;
};
