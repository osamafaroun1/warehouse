// // src/lib/rate-limit.ts
// import { rateLimiter } from 'hono-rate-limiter';
// import { RedisStore } from 'hono-rate-limiter/redis';
// import Redis from 'ioredis';
// import { env } from '../config/env';

// let redisClient: Redis | undefined;
// if (env.redisUrl) {
//     redisClient = new Redis(env.redisUrl);
// }

// export const rateLimiterMiddleware = rateLimiter({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     limit: 100, // requests per window
//     keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip || 'anonymous',
//     store: redisClient ? new RedisStore({ client: redisClient }) : undefined, // fallback to in-memory
//     skip: (c) => c.req.path === '/health' || c.req.path === '/api/auth/login', // skip login and health
// });

// How to use

// import { rateLimiterMiddleware } from './lib/rate-limit';
// // After bodyLimit, before routes:
// app.use('/api/*', rateLimiterMiddleware);
