import type { Context, Next } from 'hono';

import { AppVariables } from '../db/client';
import type { UserRole } from '../db/schema/users';

type AppContext = Context<{ Variables: AppVariables }>;

const ROLE_RANK: Record<UserRole, number> = {
    user: 2,
    admin: 3,
    owner: 4,
};

export function requireRole(minRole: UserRole) {
    return async (c: AppContext, next: Next) => {
        const role = c.get('role');

        if (!role || ROLE_RANK[role] < ROLE_RANK[minRole]) {
            return c.json({ error: `Requires ${minRole} role or higher in this organization` }, 403);
        }
        await next();
    };
}
