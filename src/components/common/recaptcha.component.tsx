import React, { useEffect, useRef } from 'react';

const SCRIPT_ID = 'google-recaptcha-script';
const CALLBACK_NAME = 'onRecaptchaLoadCallback' as const;

interface GrecaptchaApi {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark';
      size?: 'normal' | 'compact' | 'invisible';
    }
  ) => number;
  reset: (widgetId?: number) => void;
  getResponse: (widgetId?: number) => string;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi;
    [CALLBACK_NAME]?: () => void;
  }
}

export interface ReCaptchaProps {
  siteKey: string;
  onChange: (token: string | null) => void;
  theme?: 'light' | 'dark';
  className?: string;
}

const isGrecaptchaReady = (
  api: GrecaptchaApi | undefined
): api is GrecaptchaApi => !!api && typeof api.render === 'function';

const loadRecaptchaScript = (): Promise<GrecaptchaApi> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('reCAPTCHA requires a browser environment'));
      return;
    }

    if (isGrecaptchaReady(window.grecaptcha)) {
      resolve(window.grecaptcha);
      return;
    }

    const finish = () => {
      if (isGrecaptchaReady(window.grecaptcha)) {
        resolve(window.grecaptcha);
      } else {
        reject(
          new Error('reCAPTCHA script loaded but grecaptcha is unavailable')
        );
      }
    };

    const existing = document.getElementById(
      SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (existing) {
      const prev = window[CALLBACK_NAME];
      window[CALLBACK_NAME] = () => {
        prev?.();
        finish();
      };
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load reCAPTCHA script'))
      );
      return;
    }

    window[CALLBACK_NAME] = finish;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?onload=${CALLBACK_NAME}&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[CALLBACK_NAME];
      reject(new Error('Failed to load reCAPTCHA script'));
    };
    document.head.appendChild(script);
  });
};

const ReCaptcha: React.FC<ReCaptchaProps> = ({
  siteKey,
  onChange,
  theme = 'light',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    loadRecaptchaScript()
      .then(grecaptcha => {
        if (cancelled) return;
        const container = containerRef.current;
        if (!container) return;
        if (widgetIdRef.current !== null) return;

        try {
          widgetIdRef.current = grecaptcha.render(container, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => onChangeRef.current(token ?? null),
            'expired-callback': () => onChangeRef.current(null),
            'error-callback': () => onChangeRef.current(null),
          });
        } catch (err) {
          if (import.meta.env.DEV)
            console.error('reCAPTCHA render failed', err);
        }
      })
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      if (widgetId !== null && isGrecaptchaReady(window.grecaptcha)) {
        try {
          window.grecaptcha.reset(widgetId);
        } catch {
          // widget already torn down — safe to ignore
        }
      }
      widgetIdRef.current = null;
      onChangeRef.current(null);
    };
  }, [siteKey, theme]);

  return <div ref={containerRef} className={className} />;
};

export default ReCaptcha;
