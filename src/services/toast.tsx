import type { CSSProperties } from 'react';
import { toast } from 'react-toastify';
import ToastContent from '../components/toast';

export interface ToastOptions {
  autoClose?: number;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  progress?: number | undefined;
  position?:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
  closeButton?: boolean;
  className?: string;
  style?: CSSProperties;
  toastId?: string | number;
}

export const showToast = (
  title: string,
  description?: string,
  type: 'success' | 'error' | 'info' | 'warning' | 'default' = 'default',
  options?: ToastOptions
) => {
  const defaultOptions: ToastOptions = {
    position: 'bottom-right',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return toast(<ToastContent title={title} description={description} />, {
    type,
    ...mergedOptions,
  });
};

export default showToast;
