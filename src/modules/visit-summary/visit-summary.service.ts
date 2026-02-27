import { OpenMRSApi } from '../../services/openmrs';

export const API_ENDPOINTS = {
  VISIT: '/visit',
} as const;

interface CloseVisitPayload {
  stopDatetime: string;
}

export const visitSummaryService = {
  // POST /visit/{visitUuid} - Close a visit by setting stopDatetime
  closeVisit: async (visitUuid: string) => {
    const payload: CloseVisitPayload = {
      stopDatetime: new Date().toISOString(),
    };
    return OpenMRSApi.post(`${API_ENDPOINTS.VISIT}/${visitUuid}`, payload);
  },
};

export default visitSummaryService;
