import {
    index,
    integer,
    numeric,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';
import { attachment } from './attachment';
import { users } from './users';

/**
 * Products master list
 */
export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    unit: text('unit').default('قطعة').notNull(), // وحدة القياس
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
    index('products_name_idx').on(table.name),
]);

/**
 * Stock entries (إدخال مستودع)
 */
export const stockEntries = pgTable('stock_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
        .notNull()
        .references(() => products.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    entryDate: timestamp('entry_date', { withTimezone: true }).notNull(),
    receivedBy: text('received_by').notNull(), // المستلم
    deliveredBy: text('delivered_by').notNull(), // المسلم
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
    index('stock_entries_product_id_idx').on(table.productId),
    index('stock_entries_entry_date_idx').on(table.entryDate),
]);

/**
 * Stock exits (إخراج مستودع)
 */
export const stockExits = pgTable('stock_exits', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
        .notNull()
        .references(() => products.id, { onDelete: 'restrict' }),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    exitDate: timestamp('exit_date', { withTimezone: true }).notNull(),
    receivedBy: text('received_by').notNull(), // المستلم
    deliveredBy: text('delivered_by').notNull(), // المسلم
    governorate: text('governorate').notNull(), // المحافظة
    centerName: text('center_name').notNull(), // اسم المركز ضمن المحافظة
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
    index('stock_exits_product_id_idx').on(table.productId),
    index('stock_exits_exit_date_idx').on(table.exitDate),
    index('stock_exits_governorate_idx').on(table.governorate),
]);

/**
 * Join table: stock entry <-> attachments (receipts)
 */
export const stockEntryAttachment = pgTable('stock_entry_attachment', {
    entryId: uuid('entry_id')
        .notNull()
        .references(() => stockEntries.id, { onDelete: 'cascade' }),
    attachmentId: uuid('attachment_id')
        .notNull()
        .references(() => attachment.id, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.entryId, table.attachmentId] }),
    index('stock_entry_attachment_entry_id_idx').on(table.entryId),
    index('stock_entry_attachment_attachment_id_idx').on(table.attachmentId),
]);
