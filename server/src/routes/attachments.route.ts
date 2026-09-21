import { Hono } from 'hono';
import { createReadStream } from 'node:fs';
import { z } from 'zod';
import { AppContext, AppVariables, db } from '../db/client';
import { attachmentFilePath } from '../lib/attachment-storage';
import { NotFoundError, ValidationError } from '../lib/errors';
import { requireRole } from '../middleware/rbac';
import { AttachmentService } from '../services/attachment.service';

const attachmentsRoute = new Hono<{ Variables: AppVariables }>();

function withService<T>(c: AppContext, cb: (s: AttachmentService) => Promise<T>) {
    return cb(new AttachmentService(db, c.get('userId')));
}

attachmentsRoute.get('/', async (c) => {
    const userId = c.req.query('userId') || c.get('userId');
    const limit = Number(c.req.query('limit') || 100);
    const offset = Number(c.req.query('offset') || 0);
    const result = await withService(c, (s) => s.listAttachments({ userId, limit, offset }));
    return c.json(result);
});

attachmentsRoute.post('/', async (c) => {
    const body = await c.req.parseBody({ all: true });
    const filesRaw = body['file'];
    const files: File[] = [];
    if (Array.isArray(filesRaw)) {
        for (const f of filesRaw) if (f instanceof File) files.push(f);
    } else if (filesRaw instanceof File) {
        files.push(filesRaw);
    }
    if (!files.length) throw new ValidationError('No files uploaded');

    const ownerUserId = (body['userId'] as string) || c.get('userId');
    const created = await withService(c, (s) => s.createAttachments(files, ownerUserId));
    return c.json(created, 201);
});

attachmentsRoute.get('/:attachmentId', async (c) => {
    const id = c.req.param('attachmentId');
    const att = await withService(c, (s) => s.getById(id));
    if (!att) throw new NotFoundError('Attachment not found');
    return c.json(att);
});

attachmentsRoute.get('/:attachmentId/download', async (c) => {
    const id = c.req.param('attachmentId');
    const att = await withService(c, (s) => s.getById(id));
    if (!att) throw new NotFoundError('Attachment not found');
    const filePath = attachmentFilePath(att);
    const stream = createReadStream(filePath);
    return new Response(stream as any, {
        headers: {
            'Content-Type': att.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(att.originalName)}"`,
        },
    });
});

attachmentsRoute.delete('/:attachmentId', requireRole('admin'), async (c) => {
    const id = c.req.param('attachmentId') ?? '';
    const deleted = await withService(c, (s) => s.deleteAttachment(id));
    if (!deleted) throw new NotFoundError('Attachment not found');
    return c.json({ success: true, id });
});

export default attachmentsRoute;
