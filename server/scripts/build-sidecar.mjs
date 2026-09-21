/* eslint-disable no-undef */
// server/scripts/build-sidecar.mjs
//
// Builds the Hono server into a standalone .exe sidecar for Tauri.
// Usage: node scripts/build-sidecar.mjs

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = join(__dirname, '..');
const distDir = join(serverDir, 'dist');
const tauriBinariesDir = join(serverDir, '..', 'src-tauri', 'binaries');

// Change this if your Rust host triple differs — check with `rustc -vV`
const TARGET_TRIPLE = 'x86_64-pc-windows-msvc';
const OUTPUT_NAME = `hono-server-${TARGET_TRIPLE}.exe`;

const SEA_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

function run(cmd, options = {}) {
    console.log(`\n▶ ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: serverDir, ...options });
}

function step(label) {
    console.log(`\n=== ${label} ===`);
}

try {
    step('1. Clean previous build');
    if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });
    mkdirSync(distDir, { recursive: true });
    mkdirSync(tauriBinariesDir, { recursive: true });

    step('2. Bundle TypeScript/JS with esbuild');
    run(
        `npx esbuild src/index.ts --bundle --platform=node --target=node22 --outfile=dist/index.cjs --format=cjs`,
    );

    step('3. Generate SEA blob');
    const seaConfigPath = join(distDir, 'sea-config.json');
    run(
        `node -e "require('fs').writeFileSync('${
            seaConfigPath.replace(/\\/g, '\\\\')
        }', JSON.stringify({ main: 'dist/index.cjs', output: 'dist/sea-prep.blob', disableExperimentalSEAWarning: true }))"`,
    );
    run(`node --experimental-sea-config dist/sea-config.json`);

    step('4. Copy local Node binary as executable base');
    const exePath = join(distDir, 'hono-server.exe');
    copyFileSync(process.execPath, exePath);

    step('5. Inject SEA blob into executable (postject)');
    run(
        `npx postject "${exePath}" NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse ${SEA_FUSE}`,
    );

    step("6. Copy final binary into Tauri's binaries folder");
    const finalPath = join(tauriBinariesDir, OUTPUT_NAME);
    copyFileSync(exePath, finalPath);

    console.log(`\n✅ Sidecar built successfully: ${finalPath}`);
    console.log(`\nTest it standalone with:\n  "${finalPath}"`);
} catch (err) {
    console.error('\n❌ Sidecar build failed:', err.message);
    process.exit(1);
}
