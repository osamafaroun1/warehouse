import { Hono } from 'hono';
import { z } from 'zod';

import { AppContext, AppVariables, db } from '../db/client';
import { UserService } from '../services/user.service';

import {
    changePasswordSchema,
    PaginationSchema,
    usersCreateInputSchema,
    usersSelfUpdateSchema,
    usersUpdateSchema,
} from '../db/schemaValidation';

import { UserRole } from '../db/schema';
import { NotFoundError } from '../lib/errors';
import { requireRole } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';

const usersRoute = new Hono<{
    Variables: AppVariables;
}>();

function withUserService<T>(
    c: AppContext,
    callback: (service: UserService) => Promise<T>,
): Promise<T> {
    const userId = c.get('userId');
    const role = c.get('role');

    const service = new UserService(
        db,
        userId,
        role,
    );

    return callback(service);
}

usersRoute.get(
    '/',
    validateQuery(PaginationSchema),
    async (c) => {
        const query = c.get('validatedQuery') as z.infer<typeof PaginationSchema>;

        const users = await withUserService(
            c,
            async (service) => {
                if (query.query) {
                    return service.searchUsers(
                        query.query,
                        {
                            limit: query.limit,
                            offset: query.offset,
                        },
                    );
                }

                return service.listUsers();
            },
        );

        return c.json(users);
    },
);

usersRoute.get(
    '/role/:role',
    async (c) => {
        const role = c.req.param('role') as UserRole;

        const users = await withUserService(
            c,
            async (service) =>
                service.getUsersByRole(
                    role,
                ),
        );

        return c.json(users);
    },
);

usersRoute.get(
    '/active',
    async (c) => {
        const users = await withUserService(
            c,
            async (service) => service.getActiveUsers(),
        );

        return c.json(users);
    },
);

/**
 * Self-service profile update - any authenticated user may edit their own
 * basic info, but never their own role or active status.
 */
usersRoute.patch(
    '/me',
    validateBody(usersSelfUpdateSchema),
    async (c) => {
        const userId = c.get('userId');
        const body = c.get('validatedBody') as z.infer<typeof usersSelfUpdateSchema>;

        const user = await withUserService(
            c,
            async (service) => service.updateUser(userId, body),
        );

        return c.json(user);
    },
);

/**
 * Self-service password change - requires the current password to be
 * supplied and verified before a new one is set.
 */
usersRoute.patch(
    '/me/change-password',
    validateBody(changePasswordSchema),
    async (c) => {
        const userId = c.get('userId');
        const body = c.get('validatedBody') as z.infer<typeof changePasswordSchema>;

        const user = await withUserService(
            c,
            async (service) =>
                service.changeOwnPassword(
                    userId,
                    body.currentPassword,
                    body.newPassword,
                ),
        );

        return c.json(user);
    },
);

usersRoute.get(
    '/:userId',
    async (c) => {
        const userId = c.req.param('userId');

        const user = await withUserService(
            c,
            async (service) =>
                service.getUserById(
                    userId,
                ),
        );

        if (!user) {
            throw new NotFoundError(
                'User not found',
            );
        }

        return c.json(user);
    },
);

usersRoute.post(
    '/',
    requireRole('admin'),
    validateBody(usersCreateInputSchema),
    async (c) => {
        const body = c.get(
            'validatedBody',
        ) as z.infer<typeof usersCreateInputSchema>;

        const user = await withUserService(
            c,
            async (service) =>
                service.createUser(
                    body,
                ),
        );

        return c.json(user, 201);
    },
);

usersRoute.patch(
    '/:userId',
    requireRole('admin'),
    validateBody(usersUpdateSchema),
    async (c) => {
        const userId = c.req.param('userId') ?? '';
        const body = c.get(
            'validatedBody',
        ) as z.infer<typeof usersUpdateSchema>;

        const user = await withUserService(
            c,
            async (service) =>
                service.updateUser(
                    userId,
                    body,
                ),
        );

        return c.json(user);
    },
);

usersRoute.patch(
    '/:userId/activate',
    requireRole('admin'),
    async (c) => {
        const userId = c.req.param('userId') ?? '';

        const user = await withUserService(
            c,
            async (service) =>
                service.activateUser(
                    userId,
                ),
        );

        return c.json(user);
    },
);

usersRoute.patch(
    '/:userId/deactivate',
    requireRole('admin'),
    async (c) => {
        const userId = c.req.param('userId') ?? '';

        const user = await withUserService(
            c,
            async (service) =>
                service.deactivateUser(
                    userId,
                ),
        );

        return c.json(user);
    },
);

usersRoute.delete(
    '/:userId',
    requireRole('admin'),
    async (c) => {
        const userId = c.req.param('userId') ?? '';

        await withUserService(
            c,
            async (service) =>
                service.deleteUser(
                    userId,
                ),
        );

        return c.json({
            success: true,
        });
    },
);

export default usersRoute;
