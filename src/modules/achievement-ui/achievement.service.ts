import { EmrMiddlewareApi } from '../../services/patient.service';
import type {
  PullRawData,
  PullDataResponse,
} from '../../types/achievement.types';

const DATETIME = '2008-05-12 15:58:31';
const LIMIT = 50000;

export const achievementService = {
  async fetchRawData(locationUuid: string): Promise<PullRawData> {
    const url = `/pull/pulldata/${locationUuid}/${DATETIME}/0/${LIMIT}`;
    const res = await EmrMiddlewareApi.get<PullDataResponse>(url);
    const { patientAttributesList, encounterlist, obslist } = res.data;
    return { patientAttributesList, encounterlist, obslist };
  },
};
