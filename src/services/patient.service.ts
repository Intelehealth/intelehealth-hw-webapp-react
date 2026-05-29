import { env } from '../config/env';
import type { FollowupVisit } from '../hooks/useFollowupVisits';
import { storage } from '../utils/storage';
import { HttpService } from './http';

class EmrMiddlewareService extends HttpService {
  constructor(baseURL: string) {
    super({ baseURL });

    this.axiosInstance.interceptors.request.use(config => {
      const authHeader = storage.getBasicAuthHeader();
      if (authHeader) {
        config.headers.Authorization = atob(authHeader);
      }
      return config;
    });
  }
}

export const EmrMiddlewareApi = new EmrMiddlewareService(
  env.EMR_MIDDLEWARE_API_URL
);

export interface RecentPatient {
  visitUuid: string;
  patientName: string;
  gender: string;
  age?: number;
  visitCreatedDate: string;
  clinicName: string;
  uploadTimestamp: string;
}

export interface RecentPatientsResponse {
  status: string;
  data: {
    visits: RecentPatient[];
    totalCount: number;
    pageNo: number;
    pageSize: number;
  };
}

export interface PrescriptionReceivedVisit {
  visitUuid: string;
  patientName: string;
  gender: string;
  age?: number;
  visitCreatedDate: string;
  clinicName: string;
  prescriptionReceivedTimestamp: string;
}

export interface PrescriptionReceivedResponse {
  status: string;
  data: {
    visits: PrescriptionReceivedVisit[];
    totalCount: number;
    pageNo: number;
    pageSize: number;
  };
}

export interface OpenVisit {
  visitUuid: string;
  patientName: string;
  gender: string;
  age?: number;
  visitCreatedDate: string;
  clinicName: string;
  uploadTimestamp: string;
  isPriority?: boolean;
}

export interface OpenVisitsResponse {
  status: string;
  data: {
    visits: OpenVisit[];
    totalCount: number;
    pageNo: number;
    pageSize: number;
  };
}

export interface PrescriptionPendingVisit {
  visitUuid: string;
  patientName: string;
  gender: string;
  age?: number;
  visitCreatedDate: string;
  clinicName: string;
  uploadTimestamp: string;
}

export interface PrescriptionPendingResponse {
  status: string;
  data: {
    visits: PrescriptionPendingVisit[];
    totalCount: number;
    pageNo: number;
    pageSize: number;
  };
}

export const patientService = {
  async getFollowupVisits(
    locationId: string,
    page = 0,
    limit = 50
  ): Promise<{
    visits: FollowupVisit[];
    totalCount: number;
  }> {
    const url = `/pull/hw-visits/${locationId}?type=followup-visits&page=${page}&limit=${limit}`;
    const res = await EmrMiddlewareApi.get<{
      data: { visits: FollowupVisit[]; totalCount: number };
    }>(url);
    return { visits: res.data.visits, totalCount: res.data.totalCount };
  },
  async getRecentPatients(
    hwId: string,
    page = 0,
    limit = 50
  ): Promise<RecentPatient[]> {
    const url = `/pull/hw-visits/${hwId}?type=recent-patients&page=${page}&limit=${limit}`;
    const res = await EmrMiddlewareApi.get<RecentPatientsResponse>(url);
    return res.data.visits;
  },

  async getPrescriptionsReceived(
    hwId: string,
    page = 0,
    limit = 50
  ): Promise<PrescriptionReceivedVisit[]> {
    const url = `/pull/hw-visits/${hwId}?type=prescription-received&page=${page}&limit=${limit}`;
    const res = await EmrMiddlewareApi.get<PrescriptionReceivedResponse>(url);
    return res.data.visits;
  },

  async getOpenVisits(
    hwId: string,
    page = 0,
    limit = 50
  ): Promise<{ visits: OpenVisit[]; totalCount: number }> {
    const url = `/pull/hw-visits/${hwId}?type=open-visits&page=${page}&limit=${limit}`;
    const res = await EmrMiddlewareApi.get<OpenVisitsResponse>(url);
    return { visits: res.data.visits, totalCount: res.data.totalCount };
  },

  async getPriorityVisits(
    hwId: string,
    page = 0,
    limit = 50
  ): Promise<{ visits: OpenVisit[]; totalCount: number }> {
    const url = `/pull/hw-visits/${hwId}?type=priority-visits&page=${page}&limit=${limit}`;
    const res = await EmrMiddlewareApi.get<OpenVisitsResponse>(url);
    return { visits: res.data.visits, totalCount: res.data.totalCount };
  },

  async getPrescriptionsPending(
    hwId: string,
    page = 0,
    limit = 50
  ): Promise<PrescriptionPendingVisit[]> {
    const url = `/pull/hw-visits/${hwId}?type=prescription-pending&page=${page}&limit=${limit}`;
    const res = await EmrMiddlewareApi.get<PrescriptionPendingResponse>(url);
    return res.data.visits;
  },
};
