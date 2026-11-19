import { fileURLToPath } from 'node:url';

// Explicit config path: in dev, Vite runs inside the Express process whose cwd is the repo root,
// and Tailwind would otherwise look for tailwind.config.* relative to the cwd.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)) },
    autoprefixer: {},
  },
};
