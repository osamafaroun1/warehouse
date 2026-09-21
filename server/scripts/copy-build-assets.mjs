/* eslint-disable no-undef */
// server/scripts/copy-build-assets.mjs

import { cpSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = join(__dirname, '..');
const distDir = join(serverDir, 'dist');

// Copy only migration assets required by the production runner.
const migrationsSource = join(serverDir, 'drizzle');
const migrationsDest = join(distDir, 'drizzle');
if (!existsSync(migrationsSource)) {
    console.error(`❌ drizzle migrations folder not found at ${migrationsSource}`);
    process.exit(1);
}

cpSync(migrationsSource, migrationsDest, { recursive: true });
console.log(`✅ Copied drizzle migrations to ${migrationsDest}`);

// CRITICAL: the packaged .exe has no other way to get DATABASE_URL,
// JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, CORS_ORIGINS, etc.
// src-tauri only sets NODE_ENV/ATTACHMENTS_DIR when it spawns node — every
// other required var comes from `dotenv/config` loading this file at
// runtime (cwd is set to this dist/ folder). Without this step the built
// app's assertEnv() throws "Missing required environment variable:
// DATABASE_URL" and the server process exits immediately after launch.
const realEnv = join(serverDir, '.env');
const exampleEnv = join(serverDir, '.env.example');
const envDest = join(distDir, '.env');

if (existsSync(realEnv)) {
    copyFileSync(realEnv, envDest);
    console.log(`✅ Copied server/.env -> ${envDest}`);
} else if (existsSync(exampleEnv)) {
    copyFileSync(exampleEnv, envDest);
    console.warn(
        `⚠️  server/.env not found — copied .env.example instead. `
            + `The bundled placeholder secrets/DB will NOT work; create a real server/.env and rebuild before shipping.`,
    );
} else {
    console.error(
        '❌ Neither server/.env nor server/.env.example found. The built app will have no DATABASE_URL/JWT secrets and will crash on launch.',
    );
    process.exit(1);
}

