import { desc, eq, ilike, not, or } from 'drizzle-orm';

import { DbClient } from '../db/client';
import { UserRole, users } from '../db/schema';
import { BaseModel } from './base.model';

export class UserModel extends BaseModel<typeof users> {
    protected table = users;

    constructor(db: DbClient) {
        super(db);
    }

    async getUsers() {
        return this.db
            .select()
            .from(users)
            .where(not(eq(users.email, 'admin@warehouse.local')))
            .orderBy(desc(users.createdAt));
    }

    async getByEmail(email: string) {
        const [result] = await this.db
            .select()
            .from(users)
            .where(eq(users.email, email));

        return result ?? null;
    }

    async getByUsername(username: string) {
        const [result] = await this.db
            .select()
            .from(users)
            .where(eq(users.username, username));

        return result ?? null;
    }

    async getByRole(role: UserRole) {
        return this.db
            .select()
            .from(users)
            .where(eq(users.role, role))
            .orderBy(desc(users.createdAt));
    }

    async getActiveUsers() {
        return this.db
            .select()
            .from(users)
            .where(eq(users.isActive, true))
            .orderBy(desc(users.createdAt));
    }

    async search(
        query: string,
        limit = 20,
        offset = 0,
    ) {
        return this.db
            .select()
            .from(users)
            .where(
                or(
                    ilike(users.username, `%${query}%`),
                    ilike(users.firstName, `%${query}%`),
                    ilike(users.lastName, `%${query}%`),
                    ilike(users.email, `%${query}%`),
                ),
            )
            .limit(limit)
            .offset(offset)
            .orderBy(desc(users.createdAt));
    }
}
``;
