import type { Context, Next } from 'hono';
import z from 'zod';
import { ValidationError } from '../lib/errors';

/**
 * Validates the JSON body against `schema` and stores the parsed,
 * type-safe result on context under `validatedBody`. The schemas in
 * lib/validation.ts were already written but never actually called from
 * any route — this is what wires them in.
 */
export function validateBody<T>(schema: z.ZodType<T>) {
    return async (c: Context, next: Next) => {
        let raw: unknown;
        try {
            raw = await c.req.json();
        } catch {
            throw new ValidationError('Request body must be valid JSON');
        }

        const result = schema.safeParse(raw);
        if (!result.success) {
            throw new ValidationError('Validation failed', {
                issues: result.error.issues.map((i) => ({
                    path: i.path.join('.'),
                    message: i.message,
                })),
            });
        }

        c.set('validatedBody', result.data);
        await next();
    };
}

export function validateQuery<T>(schema: z.ZodType<T>) {
    return async (c: Context, next: Next) => {
        const raw = Object.fromEntries(new URL(c.req.url).searchParams);
        const result = schema.safeParse(raw);
        if (!result.success) {
            throw new ValidationError('Invalid query parameters', {
                issues: result.error.issues.map((i) => ({
                    path: i.path.join('.'),
                    message: i.message,
                })),
            });
        }
        c.set('validatedQuery', result.data);
        await next();
    };
}
