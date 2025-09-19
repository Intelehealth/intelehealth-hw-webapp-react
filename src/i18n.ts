import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your JSON translations
import en from './locales/en.json';
import hi from './locales/hi.json';
import ru from './locales/ru.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import gu from './locales/gu.json';

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ru: { translation: ru },
    kn: { translation: kn },
    ml: { translation: ml },
    mr: { translation: mr },
    ta: { translation: ta },
    te: { translation: te },
    gu: { translation: gu },
  },
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Helper to get t() without useTranslation
export const t = (key: string) => i18n.t(key);

// Helper to change language globally
export const changeLanguage = (lang: string) => i18n.changeLanguage(lang);

// Export i18n if needed elsewhere
export default i18n;
