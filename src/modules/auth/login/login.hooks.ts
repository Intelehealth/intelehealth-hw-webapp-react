// src/modules/auth/login/login.hooks.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../services/toast';
import type { LoginCredentials } from '../../../types/auth/login.types';
import { cookie } from '../../../utils/cookie';
import { storage } from '../../../utils/storage';
import { NURSE_ROLE } from './login.constant';
import loginService from './login.service';

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
      storage.clearAuthToken();
      storage.clearBasicAuthHeader();
      storage.clearUser();
      cookie.removeJSessionId();

      // Encode OpenMRS basic auth
      const cred = `${credentials.username}:${credentials.password}`;
      const base64cred = btoa(cred);
      const basicAuthHeader = `Basic ${base64cred}`;
      const xAuthSig = btoa(basicAuthHeader);
      const axiosConfig = {
        headers: {
          Authorization: basicAuthHeader,
        },
      };
      // Store encoded basic auth header for use in other API calls (e.g. EMR Middleware)
      storage.setBasicAuthHeader(xAuthSig);

      // First call OpenMRS Logout to clear any existing session
      await loginService.openMRSLogout(axiosConfig);

      // Second call OpenMRS login
      const { user, sessionId, authenticated } =
        await loginService.openMRSLogin(axiosConfig);

      // Set JSESSIONID cookie
      if (!authenticated) throw new Error('Login to OpenMRS failed');
      cookie.setCookie('JSESSIONID', sessionId);

      let userRoles: string[] = [];
      if (user && user.roles) {
        userRoles = user.roles.map(role => role.display);
      }
      // Check if user has required roles
      const hasRequiredRole = userRoles.some(role =>
        [NURSE_ROLE].includes(role)
      );
      if (!hasRequiredRole) {
        showToast(
          'Login Failed',
          `User does not have required roles to login`,
          'error'
        );
      } else {
        // Then call our backend login
        const { token } = await loginService.login(credentials);
        if (!token) throw new Error('Login to backend failed');
        storage.setAuthToken(token);
        storage.setUser(JSON.stringify(user));

        //show toast message
        showToast('Login Successful', `Welcome back`, 'success');
        //redirect to dashboard or some other page
        navigate('/dashboard');
      }
      setLoading(false);
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
