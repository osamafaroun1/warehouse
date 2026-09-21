import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import type { UserRole } from '../db/schema/users';

export interface AccessTokenPayload {
    userId: string;
    organizationId: string;
    role: UserRole;
    sessionId: string;
    type: 'access';
}

export function signAccessToken(options: {
    userId: string;
    organizationId: string;
    role: UserRole;
    sessionId: string;
}): string {
    const payload: AccessTokenPayload = {
        userId: options.userId,
        organizationId: options.organizationId,
        role: options.role,
        sessionId: options.sessionId,
        type: 'access',
    };

    return jwt.sign(payload, env.jwtAccessSecret(), {
        expiresIn: env.jwtAccessTtl,
        algorithm: 'HS256',
    } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, env.jwtAccessSecret(), {
        algorithms: ['HS256'],
    }) as jwt.JwtPayload;

    if (
        decoded.type !== 'access'
        || typeof decoded.userId !== 'string'
        || typeof decoded.organizationId !== 'string'
        || typeof decoded.role !== 'string'
        || typeof decoded.sessionId !== 'string'
    ) {
        throw new Error('Invalid token payload');
    }

    return {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role as UserRole,
        sessionId: decoded.sessionId,
        type: 'access',
    };
}
