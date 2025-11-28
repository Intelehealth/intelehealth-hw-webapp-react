import { env } from '../config/env';
import { startLoading, stopLoading } from '../reducers/loader.reducer';
import { store } from '../store/store';
import { storage } from '../utils/storage';
import { HttpService } from './http';

const IGNORED_ROUTES = ['/auth/login'];

class MindmapService extends HttpService {
  constructor(baseURL: string) {
    super({
      baseURL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(config => {
      const shouldIgnore = IGNORED_ROUTES.some(route =>
        config.url?.includes(route)
      );

      if (!shouldIgnore) {
        const token = storage.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      //  dispatch loader: startLoading()
      const showLoader = config.headers?.loader !== false;
      if (showLoader) {
        const id = (config.headers['loader-id'] as string) || undefined;
        store.dispatch(startLoading(id));
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      response => {
        //dispatch loader: stopLoading()
        // Loader configuration comes from the original request config, not response headers
        const requestHeaders = response.config?.headers;
        const showLoader = requestHeaders?.loader !== false;
        if (showLoader) {
          const id = (requestHeaders?.['loader-id'] as string) || undefined;
          store.dispatch(stopLoading(id));
        }
        return response;
      },
      error => {
        // In Axios errors, the original request config is in error.config, not error.headers
        const requestHeaders = error.config?.headers;
        const showLoader = requestHeaders?.loader !== false;
        if (showLoader) {
          const id = (requestHeaders?.['loader-id'] as string) || undefined;
          store.dispatch(stopLoading(id));
        }
        // Auto logout on 401
        if (error.response?.status === 401) {
          storage.clearAuthToken();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }
}

// Create multiple instances but with the same auth mechanism
export const MindmapAuthGatewayApi = new MindmapService(
  env.AUTH_GATEWAY_API_URL
);
export const MindmapPortalApi = new MindmapService(env.PORTAL_API_URL!);
export const MindmapConfigApi = new MindmapService(env.CONFIG_API_URL!);
