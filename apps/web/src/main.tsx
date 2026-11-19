import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';

/**
 * Temporary client entry for Step 1. Step 2 replaces it with entry-client.tsx / entry-server.tsx
 * (SSR + hydration). The styleguide is dev-only: production builds tree-shake it away.
 */
const Styleguide = import.meta.env.DEV ? lazy(() => import('./dev/Styleguide')) : null;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      {Styleguide ? (
        <Suspense fallback={null}>
          <Styleguide />
        </Suspense>
      ) : (
        <p style={{ padding: 24 }}>Site coming in Step 2.</p>
      )}
    </StrictMode>,
  );
}
