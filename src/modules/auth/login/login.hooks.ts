// src/modules/auth/login/login.hooks.ts
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/api';
import { showToast } from '../../../services/toast';
import type { AppDispatch } from '../../../store/store';
import { cookie } from '../../../utils/cookie';
import { storage } from '../../../utils/storage';

interface UseLoginReturn {
  handleLogin: (email: string, password: string) => Promise<void>;
}

export const useLogin = (): UseLoginReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogin = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Encode OpenMRS basic auth
      const cred = `${username}:${password}`;
      const base64cred = btoa(cred);
      const axiosConfig = {
        headers: {
          Authorization: `Basic ${base64cred}`,
        },
      };
      // First call OpenMRS login
      const { user, sessionId, authenticated } =
        await apiService.openMRSLogin(axiosConfig);

      // Set JSESSIONID cookie
      if (!authenticated) throw new Error('Login to OpenMRS failed');
      cookie.setCookie('JSESSIONID', sessionId);

      // Then call our backend login
      const { token } = await apiService.login({ username, password });
      storage.setAuthToken(token);

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

      //show toast message
      showToast('Login Successful', `Welcome back`, 'success');

      //redirect to dashboard or some other page
      navigate('/dashboard');
    } catch (error: unknown) {
      let message = 'Login Failed';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        message = axiosError.response?.data?.message || message;
      }

      //show toast message
      showToast('Login Failed', message, 'error');

      dispatch({ type: 'LOGIN_FAILURE', payload: message });
    }
  };

  return { handleLogin };
};
