import { DbClient } from '../db/client';
import { Attachment } from '../db/schema';
import {
    attachmentFilePath,
    deleteAttachmentFile,
    storeAttachmentFile,
} from '../lib/attachment-storage';
import { ValidationError } from '../lib/errors';
import { AttachmentModel } from '../models/attachment.model';

export class AttachmentService {
    private repository: AttachmentModel;
    private userId: string;

    constructor(db: DbClient, userId: string) {
        this.repository = new AttachmentModel(db);
        this.userId = userId;
    }

    async listAttachments(opts?: { userId?: string; limit?: number; offset?: number }) {
        const userId = opts?.userId || this.userId;
        return this.repository.listByUser(userId, opts?.limit ?? 100, opts?.offset ?? 0);
    }

    async createAttachments(files: File[], ownerUserId?: string) {
        if (!files.length) throw new ValidationError('No files provided');
        const targetUser = ownerUserId || this.userId;
        const created: Attachment[] = [];

        for (const file of files) {
            const originalName = (file as File).name || 'file';
            const stored = await storeAttachmentFile(file, originalName, targetUser);
            const att = await this.repository.createAttachment({
                filename: stored.filename,
                originalName,
                mimeType: stored.mimeType,
                size: stored.size,
                storagePath: stored.storagePath,
            });
            await this.repository.linkToUser(att.id, targetUser);
            created.push(att);
        }

        return created;
    }

    async getById(id: string) {
        return this.repository.findById(id);
    }

    async deleteAttachment(id: string) {
        const att = await this.repository.findById(id);
        if (!att) return null;
        await deleteAttachmentFile(att);
        return this.repository.deleteById(id);
    }
}
