// Must be the FIRST import in every test file: ES modules evaluate imports in order,
// so this runs before ../src/db.js opens its database.
// Points the server at a throwaway SQLite file and seeds it, so running the tests
// never writes test rows into the real brightloop.db.
import fs from 'fs';
import os from 'os';
import path from 'path';

const testDbPath = path.join(os.tmpdir(), 'brightloop_test.db');
for (const file of [testDbPath, `${testDbPath}-wal`, `${testDbPath}-shm`]) {
  fs.rmSync(file, { force: true });
}
process.env.BRIGHTLOOP_DB_PATH = testDbPath;

const { initDb } = await import('../src/db.js');
const { seedDatabase } = await import('../src/seed.js');
initDb();
await seedDatabase(true);
