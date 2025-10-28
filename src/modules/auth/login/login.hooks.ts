// src/modules/auth/login/login.hooks.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../services/toast';
import { cookie } from '../../../utils/cookie';
import { storage } from '../../../utils/storage';
import loginService from './login.service';
import type { LoginCredentials } from '../../../types/auth/login.types';

interface UseLoginReturn {
  handleLogin: (credentials: LoginCredentials) => Promise<void>;
  loading: boolean;
}

export const useLogin = (): UseLoginReturn => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      // Encode OpenMRS basic auth
      const cred = `${credentials.username}:${credentials.password}`;
      const base64cred = btoa(cred);
      const axiosConfig = {
        headers: {
          Authorization: `Basic ${base64cred}`,
        },
      };
      // First call OpenMRS login
      const { user, sessionId, authenticated } =
        await loginService.openMRSLogin(axiosConfig);

      // Set JSESSIONID cookie
      if (!authenticated) throw new Error('Login to OpenMRS failed');
      cookie.setCookie('JSESSIONID', sessionId);

      // Then call our backend login
      const { token } = await loginService.login(credentials);
      storage.setAuthToken(token);
      storage.setUser(JSON.stringify(user));

      //show toast message
      showToast('Login Successful', `Welcome back`, 'success');

      //redirect to dashboard or some other page
      navigate('/dashboard');
    } catch (error: unknown) {
      setLoading(false);
      let message = 'Login Failed';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (
          axiosError.response &&
          axiosError.response.data &&
          axiosError.response.data.message
        ) {
          message = axiosError.response.data.message;
        }
      }

      //show toast message
      showToast('Login Failed', message, 'error');
    }
  };

  return { handleLogin, loading };
};
