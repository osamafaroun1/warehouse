// base.model.ts
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { DbClient } from '../db/client';

export abstract class BaseModel<_T> {
    protected db: DbClient;
    protected abstract table: PgTableWithColumns<any>;
    // protected abstract deletedAtColumn?: AnyPgColumn;

    constructor(db: DbClient) {
        this.db = db;
    }

    async findById(id: string) {
        const result = await this.db
            .select()
            .from(this.table)
            .where(and(eq((this.table as any).id, id)))
            .limit(1);
        return result[0] || null;
    }

    /**
     * Paginated by default — previously unbounded, which is a problem once
     * any tenant accumulates more than a trivial number of rows (perf,
     * memory, and an easy unintentional DoS vector).
     */
    async findAll(options: { limit?: number; offset?: number } = {}) {
        const limit = Math.min(options.limit ?? 20, 100);
        const offset = Math.max(options.offset ?? 0, 0);
        if (options.limit === undefined || options.offset === undefined) {
            return this.db.select().from(this.table);
        }
        return this.db.select().from(this.table).limit(limit).offset(offset);
    }

    async create(data: any) {
        const result = await this.db
            .insert(this.table)
            .values(data)
            .returning();
        return result[0];
    }

    async update(id: string, data: any) {
        const hasUpdatedAt = 'updatedAt' in this.table;

        const result = await this.db
            .update(this.table)
            .set(hasUpdatedAt ? { ...data, updatedAt: new Date() } : data)
            .where(and(eq((this.table as any).id, id)))
            .returning();
        return result[0] || null;
    }

    async hardDelete(id: string) {
        await this.db.delete(this.table)
            .where(
                and(eq((this.table as any).id, id)),
            );
    }

    /**
     * Bulk delete multiple records by IDs
     * @param ids - Array of record IDs to delete
     * @returns Number of deleted records
     */
    async bulkDelete(ids: string[]) {
        if (!ids || ids.length === 0) {
            return 0;
        }

        const result = await this.db
            .delete(this.table)
            .where(
                inArray((this.table as any).id, ids),
            )
            .returning({ id: (this.table as any).id });

        return result.length;
    }

    /**
     * Bulk delete with additional condition
     * @param ids - Array of record IDs to delete
     * @param condition - Additional where condition
     * @returns Number of deleted records
     */
    async bulkDeleteWithCondition(ids: string[], condition: any) {
        if (!ids || ids.length === 0) {
            return 0;
        }

        const result = await this.db
            .delete(this.table)
            .where(
                and(
                    inArray((this.table as any).id, ids),
                    condition,
                ),
            )
            .returning({ id: (this.table as any).id });

        return result.length;
    }

    /**
     * Soft delete multiple records by IDs
     * @param ids - Array of record IDs to soft delete
     * @param deletedAtColumn - The column name for deleted_at
     * @returns Number of soft deleted records
     */
    async bulkSoftDelete(ids: string[], deletedAtColumn: string = 'deletedAt') {
        if (!ids || ids.length === 0) {
            return 0;
        }

        const hasDeletedAt = deletedAtColumn in this.table;
        if (!hasDeletedAt) {
            return this.bulkDelete(ids);
        }

        const result = await this.db
            .update(this.table)
            .set({ [deletedAtColumn]: new Date() })
            .where(
                inArray((this.table as any).id, ids),
            )
            .returning({ id: (this.table as any).id });

        return result.length;
    }

    async count() {
        const result = await this.db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(this.table);
        return result[0]?.count || 0;
    }

    async deleteMany(ids: string[]) {
        if (!ids.length) return;
        await this.db.delete(this.table).where(inArray(this.table.id, ids));
    }

    async findManyByIds(ids: string[]) {
        if (!ids.length) return [];
        return this.db.select().from(this.table).where(inArray(this.table.id, ids));
    }

    async getPaginated(
        limit = 20,
        offset = 0,
    ) {
        return this.db
            .select()
            .from(this.table)
            .orderBy(desc(this.table.createdAt))
            .limit(limit)
            .offset(offset);
    }
}
