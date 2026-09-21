import crypto from 'crypto';

/**
 * Refresh tokens are opaque random strings, NOT JWTs. We store only a hash
 * of the token in the `sessions` table (sessions.refreshTokenHash already
 * exists in your schema). This means a DB leak doesn't expose usable
 * tokens, and we can revoke individual sessions or all sessions for a user
 * by deleting/marking rows — something a stateless JWT refresh token can't
 * do without an extra denylist anyway.
 */

const TOKEN_BYTES = 48;

export function generateRefreshToken(): string {
    return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

export function hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(): Date {
    const ttlMs = parseTtlToMs(process.env.JWT_REFRESH_TTL ?? '30d');
    return new Date(Date.now() + ttlMs);
}

function parseTtlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // default 30d
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
}
