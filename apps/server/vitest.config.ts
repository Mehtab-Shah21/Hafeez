import { defineConfig } from 'vitest/config';

// Test-only values. The test database is a throwaway SQLite file (prisma/test.db, git-ignored).
export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./test/globalSetup.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'file:./test.db',
      JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret-0001',
      JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret-01',
      CSRF_SECRET: 'test-csrf-secret-test-csrf-secret-000000001',
    },
  },
});
