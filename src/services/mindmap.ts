import { storage } from '../utils/storage';
import { HttpService } from './http';

const IGNORED_ROUTES: string[] = ['/auth/login'];

class MindmapService extends HttpService {
  constructor(baseURL: string) {
    super({
      baseURL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      headers: { 'Content-Type': 'application/json' },
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
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          storage.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }
}

// Create multiple instances but with the same auth mechanism
export const MindmapPortalApi = new MindmapService(
  import.meta.env.VITE_API_BASE_URL
);
// export const mindmapProjectsApi = new MindmapService(
//   import.meta.env.VITE_MINDMAP_PROJECTS_URL
// );
// export const mindmapNotesApi = new MindmapService(
//   import.meta.env.VITE_MINDMAP_NOTES_URL
// );
