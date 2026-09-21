import { relations } from 'drizzle-orm';
import { attachment } from './attachment';
import { products, stockEntries, stockEntryAttachment, stockExits } from './warehouse';
import { sessions, users } from './users';

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const productsRelations = relations(products, ({ many }) => ({
    entries: many(stockEntries),
    exits: many(stockExits),
}));

export const stockEntriesRelations = relations(stockEntries, ({ one, many }) => ({
    product: one(products, {
        fields: [stockEntries.productId],
        references: [products.id],
    }),
    attachments: many(stockEntryAttachment),
}));

export const stockExitsRelations = relations(stockExits, ({ one }) => ({
    product: one(products, {
        fields: [stockExits.productId],
        references: [products.id],
    }),
}));

export const stockEntryAttachmentRelations = relations(stockEntryAttachment, ({ one }) => ({
    entry: one(stockEntries, {
        fields: [stockEntryAttachment.entryId],
        references: [stockEntries.id],
    }),
    attachment: one(attachment, {
        fields: [stockEntryAttachment.attachmentId],
        references: [attachment.id],
    }),
}));
