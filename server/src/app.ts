import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './config/env';
import { AppVariables, pool } from './db/client';
import { AppError, ErrorCode, formatErrorResponse } from './lib/errors';
import { authMiddleware } from './middleware/auth';
import attachmentsRoute from './routes/attachments.route';
import authRoutes from './routes/auth.route';
import usersRoute from './routes/users.route';
import warehouseRoute from './routes/warehouse.route';

const app = new Hono<{ Variables: AppVariables }>();

app.onError((error, c) => {
    if (error instanceof AppError) {
        return c.json(formatErrorResponse(error), error.statusCode as any);
    }

    const dbError = (error as any)?.cause ?? error;

    if (dbError?.code) {
        switch (dbError.code) {
            case '23505':
                return c.json(
                    {
                        code: ErrorCode.DUPLICATE_ENTRY,
                        message: 'A record with this value already exists',
                        details: { constraint: dbError.constraint },
                        statusCode: 409,
                    },
                    409 as any,
                );
            case '23503':
                return c.json(
                    {
                        code: ErrorCode.INVALID_REFERENCE,
                        message: 'Referenced record does not exist',
                        details: { constraint: dbError.constraint },
                        statusCode: 400,
                    },
                    400 as any,
                );
        }
    }

    if (error instanceof SyntaxError) {
        return c.json(
            {
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Invalid JSON in request body',
                statusCode: 400,
            },
            400 as any,
        );
    }

    console.error('error.message', error.message);

    return c.json(
        {
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: error.message,
            statusCode: 500,
        },
        500 as any,
    );
});

app.use('*', logger());
app.use('*', secureHeaders());

app.use(
    '*',
    cors({
        origin: env.corsOrigins.length ? env.corsOrigins : ['http://localhost:1420', 'http://localhost:3000'],
        credentials: true,
    }),
);

app.use(
    '*',
    bodyLimit({
        maxSize: 50 * 1024 * 1024, // 50MB
    }),
);

app.use('/uploads/*', serveStatic({ root: './' }));

app.route('/api/auth', authRoutes);

const authenticatedApi = new Hono<{ Variables: AppVariables }>();
authenticatedApi.use('*', authMiddleware);

authenticatedApi.route('/attachments', attachmentsRoute);
authenticatedApi.route('/users', usersRoute);
authenticatedApi.route('/warehouse', warehouseRoute);

app.route('/api', authenticatedApi);

app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
});

export default app;
