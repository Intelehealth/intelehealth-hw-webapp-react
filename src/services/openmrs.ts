import { cookie } from '../utils/cookie'; // <-- make sure you store/retrieve JSESSIONID here
import { HttpService } from './http';

class OpenMRSService extends HttpService {
  constructor() {
    super({
      baseURL: import.meta.env.VITE_OPENMRS_API_URL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // ensures browser cookies are sent
    });

    // Request interceptor - cookies are handled automatically by withCredentials
    this.axiosInstance.interceptors.request.use(config => {
      // withCredentials: true will automatically send cookies
      // No need to manually set Cookie header (browsers block this)
      return config;
    });

    // Response interceptor - capture JSESSIONID if returned
    this.axiosInstance.interceptors.response.use(
      response => {
        // If OpenMRS sends back a new JSESSIONID in Set-Cookie
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          const match = setCookieHeader.find((cookie: string) =>
            cookie.startsWith('JSESSIONID=')
          );
          if (match) {
            const jsessionId = match.split(';')[0].split('=')[1];
            cookie.setJSessionId(jsessionId); // save it for future requests
          }
        }
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
