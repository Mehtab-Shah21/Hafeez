import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
const dbFile = resolve(root, 'prisma/test.db');

/** Fresh test database for every run, built from the real migrations. */
export default function setup() {
  rmSync(dbFile, { force: true });
  execSync('npx prisma migrate deploy', {
    cwd: root,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
  return () => rmSync(dbFile, { force: true });
}
