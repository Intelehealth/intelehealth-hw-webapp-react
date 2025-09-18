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
      // const { user, sessionId } = {
      //   sessionId: '83748A87DA06803ADE9F3096D84EAE62',
      //   user: {
      //     uuid: '9eb2dd7c-93f5-4578-8031-de1fcef1ac68',
      //     display: 'doctor1',
      //     username: 'doctor1',
      //     systemId: '21-6',
      //     userProperties: {
      //       loginAttempts: '0',
      //     },
      //     person: {
      //       uuid: 'b659d6b2-ec90-4f22-8c48-2c4486e5ce38',
      //       display: 'rohith M s',
      //     },
      //   },
      // };

      // Set JSESSIONID cookie
      if (!sessionId) throw new Error('No sessionId from OpenMRS');
      cookie.setCookie('JSESSIONID', sessionId);

      // Then call our backend login
      //const { token } = await apiService.login({ email, password });
      const { token } = {
        token:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTc5NjA5OTksImRhdGEiOnsic2Vzc2lvbklkIjoiQUFFMTYyRTUwMEIxQTZENjZGNDg1MUU0OERDQjNBNDUiLCJ1c2VySWQiOiI5ZWIyZGQ3Yy05M2Y1LTQ1NzgtODAzMS1kZTFmY2VmMWFjNjgiLCJuYW1lIjoiZG9jdG9yMSJ9LCJpYXQiOjE3NTc5MzMxMDJ9.sL_a3mhsjL1afnPumtMaQc2wLHiz_2md5h4DA9lp_vb-oL4s62jdv-mp4YmY1CrZ1jasktEn167pya7lW8ssizHBpV4AvgZsg5ZG8UZGr7yElKKiyKOn6bUOsppYeS7pxP7ziD_s4UFQXEgBDpxX-AhdNRQVOOyjG4aIY-sztgR-u9IlPe_rjXN5L7fTDdVinxXK95r-OzS3Q6KqVryQ7jms3uXD3TGyFMz950EBMUpQUezpTMpfaD9FGpXBXG_epVat37LV27fe-CpZotY6aPXWueHal9Mo39WkCtvCZkO1VznUt24qVR_pFBbQjxX4FIq5OISFM76ZQwjd5CLOTA',
      };
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
