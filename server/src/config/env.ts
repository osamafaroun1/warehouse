import 'dotenv/config';

const DEFAULT_PORT = 3000;

const parsePort = (value: string | undefined) => {
    if (!value) return DEFAULT_PORT;
    const port = Number(value);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error('PORT must be a positive integer');
    }
    return port;
};

function required(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/**
 * ENCRYPTION_KEY must be a 32-byte key, base64 encoded.
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
function loadEncryptionKey(): Buffer {
    const raw = required('ENCRYPTION_KEY');
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== 32) {
        throw new Error(
            'ENCRYPTION_KEY must decode to exactly 32 bytes (base64-encoded). '
                + "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
        );
    }
    return buf;
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parsePort(process.env.PORT),

    // Database
    // The app's runtime DB connection. Prefers APP_DATABASE_URL (the
    // app_user role created by drizzle/0001_app_user_setup.sql, which RLS
    // policies actually apply to) and falls back to DATABASE_URL if unset
    // — falling back keeps local dev usable before you've run that setup
    // script, but means RLS is NOT enforced until you do. DATABASE_URL
    // itself is still what `npm run push`/`generate`/`migrate` use, since
    // those need owner privileges to alter schema.
    databaseUrl: () => process.env.APP_DATABASE_URL ?? required('DATABASE_URL'),

    // The DB role used at runtime MUST be a non-owner role with RLS forced.
    // See db/migrations/001_app_user_rls.sql
    dbAppUser: process.env.DB_APP_USER, // optional override if not embedded in DATABASE_URL

    // Auth secrets - separate secrets for access/refresh so a leaked access
    // token signing key can't be used to forge refresh tokens.
    jwtAccessSecret: () => required('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: () => required('JWT_REFRESH_SECRET'),
    jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',

    // Encryption (PII at rest)
    encryptionKey: () => loadEncryptionKey(),

    // Redis (rate limiting). Optional — if unset, rate limiting falls back
    // to an in-memory counter (fine for a single process / local dev; set
    // this once you run more than one instance).
    redisUrl: process.env.REDIS_URL,

    // CORS
    corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
};

/**
 * Call this once at process startup (before serve()) so the process fails
 * fast and loudly instead of crashing on the first request that needs a
 * missing secret.
 */
export function assertEnv() {
    required('DATABASE_URL');
    required('JWT_ACCESS_SECRET');
    required('JWT_REFRESH_SECRET');
    loadEncryptionKey();

    if (env.jwtAccessSecret() === env.jwtRefreshSecret()) {
        throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
    }
}

// Backwards-compat helper used by db/index.ts
export const getDatabaseUrl = () => env.databaseUrl();
