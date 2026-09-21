import { and, desc, eq, inArray } from 'drizzle-orm';
import { DbClient } from '../db/client';
import { attachment, userAttachment } from '../db/schema';
import { BaseModel } from './base.model';

export type AttachmentOwnerFilters = {
    userId?: string;
};

export type AttachmentOwnerType = 'user';

export class AttachmentModel extends BaseModel<typeof attachment> {
    protected table = attachment;

    constructor(db: DbClient) {
        super(db);
    }

    async createAttachment(data: {
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        storagePath?: string | null;
    }) {
        const [row] = await this.db.insert(attachment).values(data).returning();
        return row;
    }

    async linkToUser(attachmentId: string, userId: string) {
        await this.db.insert(userAttachment).values({ attachmentId, userId }).onConflictDoNothing();
    }

    async listByUser(userId: string, limit = 100, offset = 0) {
        return this.db
            .select({
                id: attachment.id,
                filename: attachment.filename,
                originalName: attachment.originalName,
                mimeType: attachment.mimeType,
                size: attachment.size,
                storagePath: attachment.storagePath,
                uploadedAt: attachment.uploadedAt,
            })
            .from(attachment)
            .innerJoin(userAttachment, eq(userAttachment.attachmentId, attachment.id))
            .where(eq(userAttachment.userId, userId))
            .orderBy(desc(attachment.uploadedAt))
            .limit(limit)
            .offset(offset);
    }

    async findById(id: string) {
        const rows = await this.db.select().from(attachment).where(eq(attachment.id, id)).limit(1);
        return rows[0] ?? null;
    }

    async deleteById(id: string) {
        await this.db.delete(userAttachment).where(eq(userAttachment.attachmentId, id));
        const [deleted] = await this.db.delete(attachment).where(eq(attachment.id, id)).returning({ id: attachment.id });
        return deleted ?? null;
    }

    async deleteMany(ids: string[]) {
        if (!ids.length) return;
        await this.db.delete(userAttachment).where(inArray(userAttachment.attachmentId, ids));
        await this.db.delete(attachment).where(inArray(attachment.id, ids));
    }
}
