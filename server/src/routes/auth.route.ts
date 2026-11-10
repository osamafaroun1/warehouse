import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';

import { env } from '../config/env';
import { AppContext, AppVariables } from '../db/client';
import { AuthSchema } from '../db/schemaValidation';
import { UnauthorizedError } from '../lib/errors';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AuthService } from '../services/auth.service';

const authRoutes = new Hono<{ Variables: AppVariables }>();
const authService = new AuthService();

function setAuthCookies(
    c: AppContext,
    tokens: {
        accessToken: string;
        refreshToken: string;
    },
) {
    setCookie(c, 'accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: 'Lax',
        path: '/',
        maxAge: 15 * 60,
    });

    setCookie(c, 'refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: 'Lax',
        path: '/api/auth',
        maxAge: 30 * 24 * 60 * 60,
    });
}

function clearAuthCookies(c: AppContext) {
    deleteCookie(c, 'accessToken', {
        path: '/',
    });

    deleteCookie(c, 'refreshToken', {
        path: '/api/auth',
    });
}

authRoutes.post(
    '/register',
    validateBody(AuthSchema.register),
    async (c) => {
        const {
            email,
            password,
            firstName,
            lastName,
        } = c.get('validatedBody') as z.infer<typeof AuthSchema.register>;

        const result = await authService.register(c, {
            email,
            password,
            firstName,
            lastName,
        });

        setAuthCookies(c, {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });

        return c.json({
            user: result.user,
        }, 201);
    },
);

authRoutes.post(
    '/login',
    validateBody(AuthSchema.login),
    async (c) => {
        const { email, password } = c.get('validatedBody') as z.infer<typeof AuthSchema.login>;

        const result = await authService.login(c, {
            email,
            password,
        });

        setAuthCookies(c, {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });

        return c.json({
            user: result.user,
        });
    },
);

/**
 * Checks current accessToken cookie only.
 * Does NOT rotate refresh token.
 * Does NOT create/update session row.
 */
authRoutes.get('/me', authMiddleware, async (c) => {
    const userId = c.get('userId');
    const sessionId = c.get('sessionId');

    const user = await authService.getCurrentUser(userId, sessionId);

    return c.json({
        user,
    });
});

/**
 * Uses refreshToken cookie.
 * Updates the existing session row.
 * Sets new accessToken + refreshToken cookies.
 */
authRoutes.post('/refresh', async (c) => {
    const refreshToken = getCookie(c, 'refreshToken');

    if (!refreshToken) {
        throw new UnauthorizedError('Missing refresh token');
    }

    const result = await authService.refresh(c, {
        refreshToken,
    });

    setAuthCookies(c, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    });

    return c.json({
        user: result.user,
    });
});

authRoutes.post('/logout', async (c) => {
    const refreshToken = getCookie(c, 'refreshToken');

    if (refreshToken) {
        await authService.logout({
            refreshToken,
        });
    }

    clearAuthCookies(c);

    return c.json({ success: true });
});

export default authRoutes;
