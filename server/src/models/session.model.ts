import { and, desc, eq, isNull } from 'drizzle-orm';

import { DbClient } from '../db/client';
import { sessions } from '../db/schema';
import { BaseModel } from './base.model';

export class SessionModel extends BaseModel<typeof sessions> {
    protected table = sessions;

    constructor(db: DbClient) {
        super(db);
    }

    async getSessions() {
        return this.db
            .select()
            .from(sessions)
            .orderBy(desc(sessions.createdAt));
    }

    async getByUser(userId: string) {
        return this.db
            .select()
            .from(sessions)
            .where(eq(sessions.userId, userId))
            .orderBy(desc(sessions.createdAt));
    }

    async getByRefreshTokenHash(
        refreshTokenHash: string,
    ) {
        const [result] = await this.db
            .select()
            .from(sessions)
            .where(
                eq(
                    sessions.refreshTokenHash,
                    refreshTokenHash,
                ),
            );

        return result ?? null;
    }

    async getActiveSessions(userId: string) {
        return this.db
            .select()
            .from(sessions)
            .where(
                eq(sessions.userId, userId),
            )
            .orderBy(desc(sessions.createdAt));
    }

    async getValidSession(
        refreshTokenHash: string,
    ) {
        const [result] = await this.db
            .select()
            .from(sessions)
            .where(
                eq(
                    sessions.refreshTokenHash,
                    refreshTokenHash,
                ),
            );

        if (!result?.revokedAt) {
            return result;
        }

        return null;
    }

    async revoke(id: string) {
        const [updated] = await this.db
            .update(sessions)
            .set({
                revokedAt: new Date(),
            })
            .where(eq(sessions.id, id))
            .returning();

        return updated ?? null;
    }

    async revokeAllForUser(userId: string) {
        return this.db
            .update(sessions)
            .set({
                revokedAt: new Date(),
            })
            .where(
                and(
                    eq(sessions.userId, userId),
                    isNull(sessions.revokedAt),
                ),
            )
            .returning();
    }
}
