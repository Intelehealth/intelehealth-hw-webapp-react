import { toast, type ToastOptions, type TypeOptions } from 'react-toastify';
import ToastContent from '../components/toast'; // 👈 keep this, we use it below

export const showToast = (
  title: string,
  description?: string,
  type: TypeOptions = 'default',
  options: ToastOptions = {}
) => {
  // 👇 actually using ToastContent here
  toast(<ToastContent title={title} description={description} />, {
    type,
    position: 'bottom-right',
    ...options,
  });
};
