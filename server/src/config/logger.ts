import pino from 'pino';
import { env } from './env';

// 'fatal'
// 'error'
// 'warn'
// 'info'
// 'debug'
// 'trace'
export const logger = pino({
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
});
