import { and, asc, eq, ilike, sql } from 'drizzle-orm';
import { DbClient } from '../db/client';
import { products, stockEntries, stockExits } from '../db/schema';
import { BaseModel } from './base.model';

export class ProductModel extends BaseModel<typeof products> {
    protected table = products;

    constructor(db: DbClient) {
        super(db);
    }

    async getAll() {
        return this.db
            .select()
            .from(products)
            .orderBy(asc(products.name));
    }

    async getById(id: string) {
        return this.findById(id);
    }

    async getByName(name: string) {
        const rows = await this.db
            .select()
            .from(products)
            .where(eq(products.name, name))
            .limit(1);
        return rows[0] ?? null;
    }

    async search(query: string, limit = 50, offset = 0) {
        return this.db
            .select()
            .from(products)
            .where(ilike(products.name, `%${query}%`))
            .limit(limit)
            .offset(offset)
            .orderBy(asc(products.name));
    }

    /**
     * Returns products with computed current stock.
     * currentStock = SUM(entries.qty) - SUM(exits.qty)
     */
    async getWithStock(filters?: {
        query?: string;
        minStock?: number;
        maxStock?: number;
        limit?: number;
        offset?: number;
    }) {
        const limit = filters?.limit ?? 100;
        const offset = filters?.offset ?? 0;

        // Subquery for total entries
        const entriesAgg = this.db
            .select({
                productId: stockEntries.productId,
                totalIn: sql<string>`COALESCE(SUM(${stockEntries.quantity}), 0)`.as('total_in'),
            })
            .from(stockEntries)
            .groupBy(stockEntries.productId)
            .as('entries_agg');

        // Subquery for total exits
        const exitsAgg = this.db
            .select({
                productId: stockExits.productId,
                totalOut: sql<string>`COALESCE(SUM(${stockExits.quantity}), 0)`.as('total_out'),
            })
            .from(stockExits)
            .groupBy(stockExits.productId)
            .as('exits_agg');

        let q = this.db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                unit: products.unit,
                createdAt: products.createdAt,
                updatedAt: products.updatedAt,
                totalIn: sql<string>`COALESCE(${entriesAgg.totalIn}, 0)`,
                totalOut: sql<string>`COALESCE(${exitsAgg.totalOut}, 0)`,
                currentStock: sql<string>`COALESCE(${entriesAgg.totalIn}, 0) - COALESCE(${exitsAgg.totalOut}, 0)`,
            })
            .from(products)
            .leftJoin(entriesAgg, eq(products.id, entriesAgg.productId))
            .leftJoin(exitsAgg, eq(products.id, exitsAgg.productId))
            .$dynamic();

        const conditions = [];
        if (filters?.query) {
            conditions.push(ilike(products.name, `%${filters.query}%`));
        }
        if (filters?.minStock !== undefined) {
            conditions.push(
                sql`COALESCE(${entriesAgg.totalIn}, 0) - COALESCE(${exitsAgg.totalOut}, 0) >= ${filters.minStock}`,
            );
        }
        if (filters?.maxStock !== undefined) {
            conditions.push(
                sql`COALESCE(${entriesAgg.totalIn}, 0) - COALESCE(${exitsAgg.totalOut}, 0) <= ${filters.maxStock}`,
            );
        }

        if (conditions.length > 0) {
            q = q.where(and(...conditions));
        }

        return q
            .orderBy(asc(products.name))
            .limit(limit)
            .offset(offset);
    }

    async findOrCreate(name: string, createdBy?: string) {
        const existing = await this.getByName(name);
        if (existing) return existing;

        const [created] = await this.db
            .insert(products)
            .values({
                name: name.trim(),
                createdBy: createdBy ?? null,
            })
            .returning();
        return created;
    }
}
