import { and, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { DbClient } from '../db/client';
import { products, stockExits } from '../db/schema';
import { BaseModel } from './base.model';

export class StockExitModel extends BaseModel<typeof stockExits> {
    protected table = stockExits;

    constructor(db: DbClient) {
        super(db);
    }

    async getAll(filters?: {
        productId?: string;
        query?: string;
        governorate?: string;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
    }) {
        const limit = filters?.limit ?? 100;
        const offset = filters?.offset ?? 0;

        let q = this.db
            .select({
                id: stockExits.id,
                productId: stockExits.productId,
                productName: products.name,
                quantity: stockExits.quantity,
                exitDate: stockExits.exitDate,
                receivedBy: stockExits.receivedBy,
                deliveredBy: stockExits.deliveredBy,
                governorate: stockExits.governorate,
                centerName: stockExits.centerName,
                notes: stockExits.notes,
                createdAt: stockExits.createdAt,
                createdBy: stockExits.createdBy,
            })
            .from(stockExits)
            .innerJoin(products, eq(stockExits.productId, products.id))
            .$dynamic();

        const conditions = [];
        if (filters?.productId) {
            conditions.push(eq(stockExits.productId, filters.productId));
        }
        if (filters?.query) {
            conditions.push(ilike(products.name, `%${filters.query}%`));
        }
        if (filters?.governorate) {
            conditions.push(eq(stockExits.governorate, filters.governorate));
        }
        if (filters?.fromDate) {
            conditions.push(gte(stockExits.exitDate, new Date(filters.fromDate)));
        }
        if (filters?.toDate) {
            conditions.push(lte(stockExits.exitDate, new Date(filters.toDate)));
        }

        if (conditions.length > 0) {
            q = q.where(and(...conditions));
        }

        return q
            .orderBy(desc(stockExits.exitDate))
            .limit(limit)
            .offset(offset);
    }

    async getById(id: string) {
        const rows = await this.db
            .select({
                id: stockExits.id,
                productId: stockExits.productId,
                productName: products.name,
                quantity: stockExits.quantity,
                exitDate: stockExits.exitDate,
                receivedBy: stockExits.receivedBy,
                deliveredBy: stockExits.deliveredBy,
                governorate: stockExits.governorate,
                centerName: stockExits.centerName,
                notes: stockExits.notes,
                createdAt: stockExits.createdAt,
                createdBy: stockExits.createdBy,
            })
            .from(stockExits)
            .innerJoin(products, eq(stockExits.productId, products.id))
            .where(eq(stockExits.id, id))
            .limit(1);
        return rows[0] ?? null;
    }

    async createExit(data: {
        productId: string;
        quantity: string | number;
        exitDate: Date | string;
        receivedBy: string;
        deliveredBy: string;
        governorate: string;
        centerName: string;
        notes?: string | null;
        createdBy?: string | null;
    }) {
        const [exit] = await this.db
            .insert(stockExits)
            .values({
                productId: data.productId,
                quantity: String(data.quantity),
                exitDate: typeof data.exitDate === 'string' ? new Date(data.exitDate) : data.exitDate,
                receivedBy: data.receivedBy,
                deliveredBy: data.deliveredBy,
                governorate: data.governorate,
                centerName: data.centerName,
                notes: data.notes ?? null,
                createdBy: data.createdBy ?? null,
            })
            .returning();

        return exit;
    }

    async updateExit(
        id: string,
        data: {
            quantity?: string | number;
            exitDate?: Date | string;
            receivedBy?: string;
            deliveredBy?: string;
            governorate?: string;
            centerName?: string;
            notes?: string | null;
        },
    ) {
        const values: Record<string, unknown> = {};
        if (data.quantity !== undefined) values.quantity = String(data.quantity);
        if (data.exitDate !== undefined) {
            values.exitDate = typeof data.exitDate === 'string' ? new Date(data.exitDate) : data.exitDate;
        }
        if (data.receivedBy !== undefined) values.receivedBy = data.receivedBy;
        if (data.deliveredBy !== undefined) values.deliveredBy = data.deliveredBy;
        if (data.governorate !== undefined) values.governorate = data.governorate;
        if (data.centerName !== undefined) values.centerName = data.centerName;
        if (data.notes !== undefined) values.notes = data.notes;

        const [updated] = await this.db
            .update(stockExits)
            .set(values)
            .where(eq(stockExits.id, id))
            .returning();
        return updated ?? null;
    }

    async deleteExit(id: string) {
        const [deleted] = await this.db
            .delete(stockExits)
            .where(eq(stockExits.id, id))
            .returning({ id: stockExits.id });
        return deleted ?? null;
    }
}
