import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const attachment = pgTable('attachment', {
    id: uuid('id').primaryKey().defaultRandom(),
    filename: text('filename').notNull(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    storagePath: text('storage_path'),
    uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
});

/** Link attachments to a user (e.g. uploaded receipts before linking to an entry) */
export const userAttachment = pgTable('user_attachment', {
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    attachmentId: uuid('attachment_id')
        .notNull()
        .references(() => attachment.id, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.userId, table.attachmentId] }),
    index('user_attachment_user_id_idx').on(table.userId),
    index('user_attachment_attachment_id_idx').on(table.attachmentId),
]);

export type Attachment = typeof attachment.$inferSelect;
export type NewAttachment = typeof attachment.$inferInsert;
