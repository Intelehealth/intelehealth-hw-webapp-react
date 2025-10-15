import { MindmapPortalApi } from '../../../services/mindmap';
import type {
  RequestOtpModel,
  RequestOtpResponseModel,
  VerifyOtpModel,
  VerifyOtpResponseModel,
} from './verify-otp.types';

// Basic API endpoints
export const API_ENDPOINTS = Object.freeze({
  REQUEST_OTP: '/auth/requestOtp',
  VERIFY_OTP: '/auth/verifyOtp',
});

// Basic API functions
export const verifyOtpService = {
  requestOtp: (payload: RequestOtpModel) =>
    MindmapPortalApi.post<RequestOtpResponseModel>(
      API_ENDPOINTS.REQUEST_OTP,
      payload
    ),

  verifyOtp: (payload: VerifyOtpModel) =>
    MindmapPortalApi.post<VerifyOtpResponseModel>(
      API_ENDPOINTS.VERIFY_OTP,
      payload
    ),
};

export default verifyOtpService;
