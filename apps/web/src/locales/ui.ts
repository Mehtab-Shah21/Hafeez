import type { Locale } from '@app/shared';

/**
 * UI chrome strings only (buttons, labels, system messages). Business content comes from the DB.
 * Step 3 moves these into react-i18next resources; the keys stay the same.
 */
export const ui = {
  en: {
    skip: 'Skip to content',
    notFoundTitle: 'Page not found',
    notFoundBody: 'The page you are looking for has moved or no longer exists.',
    backHome: 'Back to home',
    ourServices: 'Our services',
    viewService: 'View service',
    errorTitle: 'Something went wrong',
    errorBody: 'Please refresh the page, or call us if the problem continues.',
  },
  ar: {
    skip: 'انتقل إلى المحتوى',
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundBody: 'الصفحة التي تبحث عنها نُقلت أو لم تعد موجودة.',
    backHome: 'العودة إلى الرئيسية',
    ourServices: 'خدماتنا',
    viewService: 'عرض الخدمة',
    errorTitle: 'حدث خطأ ما',
    errorBody: 'يرجى تحديث الصفحة، أو الاتصال بنا إذا استمرت المشكلة.',
  },
} satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['en'];
export const t = (lang: Locale, key: UiKey): string => ui[lang][key];
