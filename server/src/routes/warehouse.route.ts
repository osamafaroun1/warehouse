import { Hono } from 'hono';
import { z } from 'zod';
import { AppContext, AppVariables, db } from '../db/client';
import { NotFoundError, ValidationError } from '../lib/errors';
import { requireRole } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import { ProductModel } from '../models/product.model';
import { StockEntryModel } from '../models/stock-entry.model';
import { StockExitModel } from '../models/stock-exit.model';

const warehouseRoute = new Hono<{ Variables: AppVariables }>();

// Syrian governorates
export const SYRIAN_GOVERNORATES = [
    'دمشق',
    'ريف دمشق',
    'حلب',
    'حمص',
    'حماة',
    'اللاذقية',
    'طرطوس',
    'إدلب',
    'دير الزور',
    'الرقة',
    'الحسكة',
    'السويداء',
    'درعا',
    'القنيطرة',
] as const;

// ---------- Validation schemas ----------
const paginationSchema = z.object({
    query: z.string().optional(),
    limit: z.coerce.number().min(1).max(500).optional().default(100),
    offset: z.coerce.number().min(0).optional().default(0),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    productId: z.string().uuid().optional(),
    governorate: z.string().optional(),
    minStock: z.coerce.number().optional(),
    maxStock: z.coerce.number().optional(),
});

const createEntrySchema = z.object({
    productName: z.string().min(1, 'اسم المنتج مطلوب'),
    quantity: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'الكمية يجب أن تكون أكبر من صفر'),
    entryDate: z.string().min(1, 'تاريخ الإدخال مطلوب'),
    receivedBy: z.string().min(1, 'المستلم مطلوب'),
    deliveredBy: z.string().min(1, 'المسلم مطلوب'),
    notes: z.string().optional().nullable(),
    attachmentIds: z.array(z.string().uuid()).optional().default([]),
});

const updateEntrySchema = z.object({
    quantity: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'الكمية يجب أن تكون أكبر من صفر').optional(),
    entryDate: z.string().optional(),
    receivedBy: z.string().min(1).optional(),
    deliveredBy: z.string().min(1).optional(),
    notes: z.string().optional().nullable(),
});

const createExitSchema = z.object({
    productName: z.string().min(1, 'اسم المنتج مطلوب'),
    quantity: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'الكمية يجب أن تكون أكبر من صفر'),
    exitDate: z.string().min(1, 'تاريخ الإخراج مطلوب'),
    receivedBy: z.string().min(1, 'المستلم مطلوب'),
    deliveredBy: z.string().min(1, 'المسلم مطلوب'),
    governorate: z.enum(SYRIAN_GOVERNORATES, { error: 'المحافظة غير صحيحة' }),
    centerName: z.string().min(1, 'اسم المركز مطلوب'),
    notes: z.string().optional().nullable(),
});

const updateExitSchema = z.object({
    quantity: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, 'الكمية يجب أن تكون أكبر من صفر').optional(),
    exitDate: z.string().optional(),
    receivedBy: z.string().min(1).optional(),
    deliveredBy: z.string().min(1).optional(),
    governorate: z.enum(SYRIAN_GOVERNORATES, { error: 'المحافظة غير صحيحة' }).optional(),
    centerName: z.string().min(1).optional(),
    notes: z.string().optional().nullable(),
});

// ---------- Helpers ----------
function withProductModel<T>(_c: AppContext, cb: (m: ProductModel) => Promise<T>) {
    return cb(new ProductModel(db));
}
function withEntryModel<T>(_c: AppContext, cb: (m: StockEntryModel) => Promise<T>) {
    return cb(new StockEntryModel(db));
}
function withExitModel<T>(_c: AppContext, cb: (m: StockExitModel) => Promise<T>) {
    return cb(new StockExitModel(db));
}

// ---------- Governorates ----------
warehouseRoute.get('/governorates', (c) => {
    return c.json(SYRIAN_GOVERNORATES);
});

// ---------- Products with stock ----------
warehouseRoute.get('/products', validateQuery(paginationSchema), async (c) => {
    const q = c.get('validatedQuery') as z.infer<typeof paginationSchema>;
    const result = await withProductModel(c, (model) =>
        model.getWithStock({
            query: q.query,
            minStock: q.minStock,
            maxStock: q.maxStock,
            limit: q.limit,
            offset: q.offset,
        }),
    );
    return c.json(result);
});

warehouseRoute.get('/products/:id', async (c) => {
    const id = c.req.param('id') ?? '';
    const product = await withProductModel(c, (m) => m.getById(id));
    if (!product) throw new NotFoundError('المنتج غير موجود');
    return c.json(product);
});

// ---------- Stock Entries (إدخال) ----------
warehouseRoute.get('/entries', validateQuery(paginationSchema), async (c) => {
    const q = c.get('validatedQuery') as z.infer<typeof paginationSchema>;
    const result = await withEntryModel(c, (m) =>
        m.getAll({
            productId: q.productId,
            query: q.query,
            fromDate: q.fromDate,
            toDate: q.toDate,
            limit: q.limit,
            offset: q.offset,
        }),
    );
    return c.json(result);
});

warehouseRoute.get('/entries/:id', async (c) => {
    const id = c.req.param('id') ?? '';
    const entry = await withEntryModel(c, (m) => m.getById(id));
    if (!entry) throw new NotFoundError('سجل الإدخال غير موجود');
    return c.json(entry);
});

// Create: any authenticated user
warehouseRoute.post('/entries', validateBody(createEntrySchema), async (c) => {
    const body = c.get('validatedBody') as z.infer<typeof createEntrySchema>;
    const userId = c.get('userId');

    const product = await withProductModel(c, (m) =>
        m.findOrCreate(body.productName.trim(), userId),
    );

    const entry = await withEntryModel(c, (m) =>
        m.createEntry({
            productId: product.id,
            quantity: body.quantity,
            entryDate: body.entryDate,
            receivedBy: body.receivedBy.trim(),
            deliveredBy: body.deliveredBy.trim(),
            notes: body.notes,
            createdBy: userId,
            attachmentIds: body.attachmentIds,
        }),
    );

    return c.json(entry, 201);
});

// Update: admin+
warehouseRoute.patch('/entries/:id', requireRole('admin'), validateBody(updateEntrySchema), async (c) => {
    const id = c.req.param('id') ?? '';
    const body = c.get('validatedBody') as z.infer<typeof updateEntrySchema>;

    const existing = await withEntryModel(c, (m) => m.getById(id));
    if (!existing) throw new NotFoundError('سجل الإدخال غير موجود');

    const updated = await withEntryModel(c, (m) => m.updateEntry(id, body));
    return c.json(updated);
});

// Delete: admin+
warehouseRoute.delete('/entries/:id', requireRole('admin'), async (c) => {
    const id = c.req.param('id') ?? '';
    const existing = await withEntryModel(c, (m) => m.getById(id));
    if (!existing) throw new NotFoundError('سجل الإدخال غير موجود');

    await withEntryModel(c, (m) => m.deleteEntry(id));
    return c.json({ success: true, id });
});

// ---------- Stock Exits (إخراج) ----------
warehouseRoute.get('/exits', validateQuery(paginationSchema), async (c) => {
    const q = c.get('validatedQuery') as z.infer<typeof paginationSchema>;
    const result = await withExitModel(c, (m) =>
        m.getAll({
            productId: q.productId,
            query: q.query,
            governorate: q.governorate,
            fromDate: q.fromDate,
            toDate: q.toDate,
            limit: q.limit,
            offset: q.offset,
        }),
    );
    return c.json(result);
});

warehouseRoute.get('/exits/:id', async (c) => {
    const id = c.req.param('id') ?? '';
    const exit = await withExitModel(c, (m) => m.getById(id));
    if (!exit) throw new NotFoundError('سجل الإخراج غير موجود');
    return c.json(exit);
});

// Create: any authenticated user
warehouseRoute.post('/exits', validateBody(createExitSchema), async (c) => {
    const body = c.get('validatedBody') as z.infer<typeof createExitSchema>;
    const userId = c.get('userId');

    const product = await withProductModel(c, (m) =>
        m.findOrCreate(body.productName.trim(), userId),
    );

    const stockRows = await withProductModel(c, (m) =>
        m.getWithStock({ query: product.name, limit: 1 }),
    );
    const current = stockRows[0] ? Number(stockRows[0].currentStock) : 0;
    const qty = Number(body.quantity);
    if (qty > current) {
        throw new ValidationError(
            `الكمية المطلوبة (${qty}) أكبر من الرصيد الحالي (${current}) للمنتج "${product.name}"`,
        );
    }

    const exit = await withExitModel(c, (m) =>
        m.createExit({
            productId: product.id,
            quantity: body.quantity,
            exitDate: body.exitDate,
            receivedBy: body.receivedBy.trim(),
            deliveredBy: body.deliveredBy.trim(),
            governorate: body.governorate,
            centerName: body.centerName.trim(),
            notes: body.notes,
            createdBy: userId,
        }),
    );

    return c.json(exit, 201);
});

// Update: admin+
warehouseRoute.patch('/exits/:id', requireRole('admin'), validateBody(updateExitSchema), async (c) => {
    const id = c.req.param('id') ?? '';
    const body = c.get('validatedBody') as z.infer<typeof updateExitSchema>;

    const existing = await withExitModel(c, (m) => m.getById(id));
    if (!existing) throw new NotFoundError('سجل الإخراج غير موجود');

    // If quantity is increasing, re-check stock
    if (body.quantity !== undefined) {
        const stockRows = await withProductModel(c, (m) =>
            m.getWithStock({ query: existing.productName, limit: 1 }),
        );
        const current = stockRows[0] ? Number(stockRows[0].currentStock) : 0;
        // Add back the old quantity then subtract the new one
        const available = current + Number(existing.quantity);
        const newQty = Number(body.quantity);
        if (newQty > available) {
            throw new ValidationError(
                `الكمية المطلوبة (${newQty}) أكبر من الرصيد المتاح (${available}) للمنتج "${existing.productName}"`,
            );
        }
    }

    const updated = await withExitModel(c, (m) => m.updateExit(id, body));
    return c.json(updated);
});

// Delete: admin+
warehouseRoute.delete('/exits/:id', requireRole('admin'), async (c) => {
    const id = c.req.param('id') ?? '';
    const existing = await withExitModel(c, (m) => m.getById(id));
    if (!existing) throw new NotFoundError('سجل الإخراج غير موجود');

    await withExitModel(c, (m) => m.deleteExit(id));
    return c.json({ success: true, id });
});

export default warehouseRoute;
