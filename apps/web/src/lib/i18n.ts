import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Locale } from '@app/shared';
import ar from '@/locales/ar';
import en from '@/locales/en';

/**
 * One i18next instance per SSR request (no shared mutable language between concurrent requests)
 * and one in the browser. Resources are bundled (small), so init is synchronous.
 */
export function createI18n(lang: Locale): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'en',
    resources: { en: { translation: en }, ar: { translation: ar } },
    interpolation: { escapeValue: false }, // React escapes
    initImmediate: false,
    returnNull: false,
  });
  return instance;
}
