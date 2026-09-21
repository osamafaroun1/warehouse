import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';

import { AppVariables, db } from '../db/client';
import { verifyAccessToken } from '../lib/jwt';
// import { and, eq, isNull, gt } from 'drizzle-orm';
// import { sessions } from '../db/schema';

type AppContext = Context<{ Variables: AppVariables }>;

export async function authMiddleware(c: AppContext, next: Next) {
    const authHeader = c.req.header('authorization');

    const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : null;

    const cookieToken = getCookie(c, 'accessToken');

    const token = bearerToken ?? cookieToken;

    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const payload = verifyAccessToken(token);
        // Check session validity
        // const [session] = await db
        //     .select()
        //     .from(sessions)
        //     .where(
        //         and(
        //             eq(sessions.id, payload.sessionId),
        //             eq(sessions.userId, payload.userId),
        //             isNull(sessions.revokedAt),
        //             gt(sessions.expiresAt, new Date())
        //         )
        //     )
        //     .limit(1);

        // if (!session) {
        //     return c.json({ error: 'Session expired or revoked' }, 401);
        // }

        c.set('userId', payload.userId);
        c.set('role', payload.role);
        c.set('sessionId', payload.sessionId);
    } catch {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }

    await next();
}
