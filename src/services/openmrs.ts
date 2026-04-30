import { startLoading, stopLoading } from '../reducers/loader.reducer';
import { store } from '../store/store';
import { storage } from '../utils/storage';
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

    // Request interceptor - ensure credentials are sent and handle loader
    this.axiosInstance.interceptors.request.use(config => {
      config.withCredentials = true;

      const authHeader = storage.getBasicAuthHeader();
      if (authHeader) {
        config.headers.Authorization = atob(authHeader);
      }

      // Handle loader: default showLoader is true, can be disabled with showLoader: false
      const showLoader = config.headers?.loader !== false;
      if (showLoader) {
        const id = (config.headers['loader-id'] as string) || undefined;
        store.dispatch(startLoading(id));
      }
      return config;
    });

    // Response interceptor - capture JSESSIONID if returned and handle loader
    this.axiosInstance.interceptors.response.use(
      response => {
        // Handle loader: stop loading on successful response
        const requestHeaders = response.config?.headers;
        const showLoader = requestHeaders?.loader !== false;
        if (showLoader) {
          const id = (requestHeaders?.['loader-id'] as string) || undefined;
          store.dispatch(stopLoading(id));
        }
        return response;
      },
      error => {
        // Handle loader: stop loading on error
        const requestHeaders = error.config?.headers;
        const showLoader = requestHeaders?.loader !== false;
        if (showLoader) {
          const id = (requestHeaders?.['loader-id'] as string) || undefined;
          store.dispatch(stopLoading(id));
        }
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
