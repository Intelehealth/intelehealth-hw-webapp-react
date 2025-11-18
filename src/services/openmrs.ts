import { HttpService } from './http';

class OpenMRSService extends HttpService {
  constructor() {
    super({
      baseURL: import.meta.env.VITE_OPENMRS_API_URL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor - ensure credentials are sent and add debugging
    this.axiosInstance.interceptors.request.use(config => {
      config.withCredentials = true;
      return config;
    });

    // Response interceptor - capture JSESSIONID if returned
    this.axiosInstance.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        // 401 check can be added here if needed
        if (error.response?.status === 401) {
          // Handle unauthorized access
        }
        return Promise.reject(error);
      }
    );
  }
}

export const OpenMRSApi = new OpenMRSService();
