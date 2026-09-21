import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Attachment } from '../db/schema';

function resolveAttachmentsDir(): string {
    const configured = process.env.ATTACHMENTS_DIR;
    if (configured) return configured;
    const fallback = path.join(process.cwd(), 'attachments');
    console.warn(`[attachments] ATTACHMENTS_DIR not set — falling back to ${fallback}.`);
    return fallback;
}

const attachmentsDir = resolveAttachmentsDir();

export async function ensureAttachmentsDir() {
    await fs.mkdir(attachmentsDir, { recursive: true });
}

export async function storeAttachmentFile(
    file: File | Blob,
    originalName: string,
    userId: string,
): Promise<{ filename: string; storagePath: string; size: number; mimeType: string }> {
    await ensureAttachmentsDir();
    const ext = path.extname(originalName) || '';
    const filename = `${randomUUID()}${ext}`;
    const relativeDir = path.join('users', userId);
    const absDir = path.join(attachmentsDir, relativeDir);
    await fs.mkdir(absDir, { recursive: true });
    const absPath = path.join(absDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, buffer);
    return {
        filename,
        storagePath: path.join(relativeDir, filename).replace(/\\/g, '/'),
        size: buffer.length,
        mimeType: (file as File).type || 'application/octet-stream',
    };
}

export function attachmentFilePath(att: Attachment): string {
    if (att.storagePath) {
        return path.join(attachmentsDir, att.storagePath);
    }
    // legacy fallback
    return path.join(attachmentsDir, att.id, att.filename);
}

export async function deleteAttachmentFile(att: Attachment) {
    try {
        await fs.unlink(attachmentFilePath(att));
    } catch {
        // ignore missing files
    }
}
