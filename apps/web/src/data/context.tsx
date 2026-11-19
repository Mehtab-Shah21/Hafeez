import { createContext, useContext, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@app/shared';
import type { Queries } from './queries';

const QueriesContext = createContext<Queries | null>(null);

export function QueriesProvider({ queries, children }: { queries: Queries; children: ReactNode }) {
  return <QueriesContext.Provider value={queries}>{children}</QueriesContext.Provider>;
}

export function useQueries(): Queries {
  const q = useContext(QueriesContext);
  if (!q) throw new Error('useQueries must be used inside QueriesProvider');
  return q;
}

/** Current locale from the `/:lang` URL segment. */
export function useLang(): Locale {
  const { lang } = useParams();
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}
