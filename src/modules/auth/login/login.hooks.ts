// src/modules/auth/login/login.hooks.ts
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/api';
import type { AppDispatch } from '../../../store/store';
import { cookie } from '../../../utils/cookie';
import { storage } from '../../../utils/storage';

interface UseLoginReturn {
  handleLogin: (email: string, password: string) => Promise<void>;
}

export const useLogin = (): UseLoginReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Encode OpenMRS basic auth
      const cred = `${email}:${password}`;
      const base64cred = btoa(cred);
      const axiosConfig = {
        headers: {
          Authorization: `Basic ${base64cred}`,
        },
      };
      // First call OpenMRS login
      const { user, sessionId } = await apiService.openMRSLogin(axiosConfig);

      // Set JSESSIONID cookie
      if (!sessionId) throw new Error('No sessionId from OpenMRS');
      cookie.setCookie('JSESSIONID', sessionId);

      // Then call our backend login
      const { token } = await apiService.login({ email, password });
      storage.setAuthToken(token);

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

      //redirect to dashboard or some other page
      navigate('/dashboard');
    } catch (error: unknown) {
      let message = 'Login failed';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        message = axiosError.response?.data?.message || message;
      }

      dispatch({ type: 'LOGIN_FAILURE', payload: message });
    }
  };

  return { handleLogin };
};
