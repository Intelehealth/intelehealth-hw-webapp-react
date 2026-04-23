const PASSWORD_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';

export const DEFAULT_GENERATED_PASSWORD_LENGTH = 8;

export const randomString = (len: number): string => {
  const bytes = new Uint32Array(len);
  window.crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += PASSWORD_CHARSET.charAt(bytes[i] % PASSWORD_CHARSET.length);
  }
  return out;
};

const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,}$/;

export const isValidPassword = (password: string | null | undefined): boolean =>
  !!password && PASSWORD_PATTERN.test(password);

type AxiosErrorLike = {
  response?: {
    data?: { message?: string; error?: { message?: string } };
  };
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong'
): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const e = error as AxiosErrorLike;
    return (
      e.response?.data?.error?.message ?? e.response?.data?.message ?? fallback
    );
  }
  return fallback;
};
