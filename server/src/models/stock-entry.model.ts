import { and, desc, eq, gte, ilike, lte } from 'drizzle-orm';
import { DbClient } from '../db/client';
import { products, stockEntries, stockEntryAttachment } from '../db/schema';
import { BaseModel } from './base.model';

export class StockEntryModel extends BaseModel<typeof stockEntries> {
    protected table = stockEntries;

    constructor(db: DbClient) {
        super(db);
    }

    async getAll(filters?: {
        productId?: string;
        query?: string;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
    }) {
        const limit = filters?.limit ?? 100;
        const offset = filters?.offset ?? 0;

        let q = this.db
            .select({
                id: stockEntries.id,
                productId: stockEntries.productId,
                productName: products.name,
                quantity: stockEntries.quantity,
                entryDate: stockEntries.entryDate,
                receivedBy: stockEntries.receivedBy,
                deliveredBy: stockEntries.deliveredBy,
                notes: stockEntries.notes,
                createdAt: stockEntries.createdAt,
                createdBy: stockEntries.createdBy,
            })
            .from(stockEntries)
            .innerJoin(products, eq(stockEntries.productId, products.id))
            .$dynamic();

        const conditions = [];
        if (filters?.productId) {
            conditions.push(eq(stockEntries.productId, filters.productId));
        }
        if (filters?.query) {
            conditions.push(ilike(products.name, `%${filters.query}%`));
        }
        if (filters?.fromDate) {
            conditions.push(gte(stockEntries.entryDate, new Date(filters.fromDate)));
        }
        if (filters?.toDate) {
            conditions.push(lte(stockEntries.entryDate, new Date(filters.toDate)));
        }

        if (conditions.length > 0) {
            q = q.where(and(...conditions));
        }

        return q
            .orderBy(desc(stockEntries.entryDate))
            .limit(limit)
            .offset(offset);
    }

    async getById(id: string) {
        const rows = await this.db
            .select({
                id: stockEntries.id,
                productId: stockEntries.productId,
                productName: products.name,
                quantity: stockEntries.quantity,
                entryDate: stockEntries.entryDate,
                receivedBy: stockEntries.receivedBy,
                deliveredBy: stockEntries.deliveredBy,
                notes: stockEntries.notes,
                createdAt: stockEntries.createdAt,
                createdBy: stockEntries.createdBy,
            })
            .from(stockEntries)
            .innerJoin(products, eq(stockEntries.productId, products.id))
            .where(eq(stockEntries.id, id))
            .limit(1);
        return rows[0] ?? null;
    }

    async createEntry(data: {
        productId: string;
        quantity: string | number;
        entryDate: Date | string;
        receivedBy: string;
        deliveredBy: string;
        notes?: string | null;
        createdBy?: string | null;
        attachmentIds?: string[];
    }) {
        const [entry] = await this.db
            .insert(stockEntries)
            .values({
                productId: data.productId,
                quantity: String(data.quantity),
                entryDate: typeof data.entryDate === 'string' ? new Date(data.entryDate) : data.entryDate,
                receivedBy: data.receivedBy,
                deliveredBy: data.deliveredBy,
                notes: data.notes ?? null,
                createdBy: data.createdBy ?? null,
            })
            .returning();

        if (data.attachmentIds && data.attachmentIds.length > 0) {
            await this.db.insert(stockEntryAttachment).values(
                data.attachmentIds.map((attachmentId) => ({
                    entryId: entry.id,
                    attachmentId,
                })),
            );
        }

        return entry;
    }

    async updateEntry(
        id: string,
        data: {
            quantity?: string | number;
            entryDate?: Date | string;
            receivedBy?: string;
            deliveredBy?: string;
            notes?: string | null;
        },
    ) {
        const values: Record<string, unknown> = {};
        if (data.quantity !== undefined) values.quantity = String(data.quantity);
        if (data.entryDate !== undefined) {
            values.entryDate = typeof data.entryDate === 'string' ? new Date(data.entryDate) : data.entryDate;
        }
        if (data.receivedBy !== undefined) values.receivedBy = data.receivedBy;
        if (data.deliveredBy !== undefined) values.deliveredBy = data.deliveredBy;
        if (data.notes !== undefined) values.notes = data.notes;

        const [updated] = await this.db
            .update(stockEntries)
            .set(values)
            .where(eq(stockEntries.id, id))
            .returning();
        return updated ?? null;
    }

    async deleteEntry(id: string) {
        await this.db.delete(stockEntryAttachment).where(eq(stockEntryAttachment.entryId, id));
        const [deleted] = await this.db
            .delete(stockEntries)
            .where(eq(stockEntries.id, id))
            .returning({ id: stockEntries.id });
        return deleted ?? null;
    }

    async getAttachments(entryId: string) {
        return this.db
            .select()
            .from(stockEntryAttachment)
            .where(eq(stockEntryAttachment.entryId, entryId));
    }
}
