# نظام إدارة المستودع (Warehouse Management)

SolidJS + Hono + Drizzle + PostgreSQL

## التشغيل

```bash
# Frontend
npm install
npm run dev

# Backend
cd server
npm install
# أنشئ قاعدة البيانات أولاً:
#   psql -U postgres -c "CREATE DATABASE warehouse_mgmt;"
npm run db:push
npm run seed   # ينشئ مستخدم admin@warehouse.local / Admin123!
npm run dev
```

## الصفحات

| المسار | الوصف |
|--------|--------|
| `/` | لوحة الرئيسية |
| `/warehouse/entry` | إدخال منتجات |
| `/warehouse/exit` | إخراج منتجات |
| `/warehouse/stock` | مخزون المستودع |
| `/warehouse/history` | سجل الحركات (تعديل/حذف/Excel) |
| `/settings` | الإعدادات |

## الصلاحيات

- أي مستخدم مسجّل: عرض وإدخال وإخراج
- admin / owner: تعديل وحذف السجلات
