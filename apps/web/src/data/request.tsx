import { createContext, useContext, type ReactNode } from 'react';

/** Per-request flags decided by the server and replayed on the client so hydration matches. */
export interface RequestFlags {
  showPreloader: boolean;
}

const RequestContext = createContext<RequestFlags>({ showPreloader: false });

export function RequestProvider({ flags, children }: { flags: RequestFlags; children: ReactNode }) {
  return <RequestContext.Provider value={flags}>{children}</RequestContext.Provider>;
}

export const useRequestFlags = () => useContext(RequestContext);
