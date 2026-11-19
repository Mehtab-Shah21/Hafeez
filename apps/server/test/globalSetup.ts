import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
const dbFile = resolve(root, 'prisma/test.db');

/** Fresh test database for every run, built from the real migrations. */
export default function setup() {
  rmSync(dbFile, { force: true });
  // Test-only seed admin; the throwaway DB is deleted after the run.
  const env = {
    ...process.env,
    DATABASE_URL: 'file:./test.db',
    SEED_ADMIN_EMAIL: 'seed-admin@test.local',
    SEED_ADMIN_PASSWORD: 'test-only-seed-password-123',
  };
  execSync('npx prisma migrate deploy', { cwd: root, stdio: 'pipe', env });
  execSync('npx tsx prisma/seed.ts', { cwd: root, stdio: 'pipe', env });
  return () => rmSync(dbFile, { force: true });
}
