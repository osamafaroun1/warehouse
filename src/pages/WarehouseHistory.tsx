import { Component, createSignal, For, onMount, Show } from 'solid-js';
import {
    deleteStockEntry,
    deleteStockExit,
    getGovernorates,
    getStockEntries,
    getStockExits,
    StockEntry,
    StockExit,
    updateStockEntry,
    updateStockExit,
} from '../api/warehouse.api';
import { showConfirmDialog } from '../components/dialog/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Icon } from '../components/ui';
import { useAuthContext } from '../context/AuthContext';
import { exportCSV2 } from '../utils/export';
import { ToastMessage } from '../utils/ToastMessage';

type Tab = 'entries' | 'exits';

const WarehouseHistory: Component = () => {
    const { user } = useAuthContext();
    const isAdmin = () => {
        const role = user()?.role;
        return role === 'admin' || role === 'owner';
    };

    const [tab, setTab] = createSignal<Tab>('entries');
    const [entries, setEntries] = createSignal<StockEntry[]>([]);
    const [exits, setExits] = createSignal<StockExit[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [governorates, setGovernorates] = createSignal<string[]>([]);

    // filters
    const [query, setQuery] = createSignal('');
    const [fromDate, setFromDate] = createSignal('');
    const [toDate, setToDate] = createSignal('');
    const [govFilter, setGovFilter] = createSignal('');

    // edit modal state
    const [editingEntry, setEditingEntry] = createSignal<StockEntry | null>(null);
    const [editingExit, setEditingExit] = createSignal<StockExit | null>(null);
    const [editForm, setEditForm] = createSignal<Record<string, string>>({});
    const [saving, setSaving] = createSignal(false);

    onMount(async () => {
        try {
            setGovernorates(await getGovernorates());
        } catch {
            setGovernorates([
                'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس',
                'إدلب', 'دير الزور', 'الرقة', 'الحسكة', 'السويداء', 'درعا', 'القنيطرة',
            ]);
        }
        load();
    });

    const load = async () => {
        setLoading(true);
        try {
            if (tab() === 'entries') {
                const data = await getStockEntries({
                    query: query().trim() || undefined,
                    fromDate: fromDate() || undefined,
                    toDate: toDate() || undefined,
                    limit: 300,
                });
                setEntries(data);
            } else {
                const data = await getStockExits({
                    query: query().trim() || undefined,
                    fromDate: fromDate() || undefined,
                    toDate: toDate() || undefined,
                    governorate: govFilter() || undefined,
                    limit: 300,
                });
                setExits(data);
            }
        } catch (err: any) {
            ToastMessage.error(err?.message || 'فشل التحميل');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString('ar-SY', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    const formatQty = (v: string | number) => {
        const n = Number(v);
        if (Number.isNaN(n)) return String(v);
        return n.toLocaleString('ar-SY', { maximumFractionDigits: 3 });
    };

    // ---------- Delete ----------
    const onDeleteEntry = (entry: StockEntry) => {
        if (!isAdmin()) {
            ToastMessage.error('ليس لديك صلاحية الحذف');
            return;
        }
        showConfirmDialog({
            itemName: `إدخال ${entry.productName} (${formatQty(entry.quantity)})`,
            done: async () => {
                try {
                    await deleteStockEntry(entry.id);
                    setEntries((list) => list.filter((e) => e.id !== entry.id));
                    ToastMessage.success('تم حذف سجل الإدخال');
                } catch (err: any) {
                    ToastMessage.error(err?.message || 'فشل الحذف');
                }
            },
        });
    };

    const onDeleteExit = (exit: StockExit) => {
        if (!isAdmin()) {
            ToastMessage.error('ليس لديك صلاحية الحذف');
            return;
        }
        showConfirmDialog({
            itemName: `إخراج ${exit.productName} (${formatQty(exit.quantity)})`,
            done: async () => {
                try {
                    await deleteStockExit(exit.id);
                    setExits((list) => list.filter((e) => e.id !== exit.id));
                    ToastMessage.success('تم حذف سجل الإخراج');
                } catch (err: any) {
                    ToastMessage.error(err?.message || 'فشل الحذف');
                }
            },
        });
    };

    // ---------- Edit ----------
    const openEditEntry = (entry: StockEntry) => {
        if (!isAdmin()) {
            ToastMessage.error('ليس لديك صلاحية التعديل');
            return;
        }
        setEditingEntry(entry);
        setEditForm({
            quantity: String(entry.quantity),
            entryDate: entry.entryDate.slice(0, 16),
            receivedBy: entry.receivedBy,
            deliveredBy: entry.deliveredBy,
            notes: entry.notes || '',
        });
    };

    const openEditExit = (exit: StockExit) => {
        if (!isAdmin()) {
            ToastMessage.error('ليس لديك صلاحية التعديل');
            return;
        }
        setEditingExit(exit);
        setEditForm({
            quantity: String(exit.quantity),
            exitDate: exit.exitDate.slice(0, 16),
            receivedBy: exit.receivedBy,
            deliveredBy: exit.deliveredBy,
            governorate: exit.governorate,
            centerName: exit.centerName,
            notes: exit.notes || '',
        });
    };

    const saveEditEntry = async () => {
        const entry = editingEntry();
        if (!entry) return;
        setSaving(true);
        try {
            const f = editForm();
            const updated = await updateStockEntry(entry.id, {
                quantity: Number(f.quantity),
                entryDate: new Date(f.entryDate).toISOString(),
                receivedBy: f.receivedBy,
                deliveredBy: f.deliveredBy,
                notes: f.notes || null,
            });
            // merge productName etc.
            setEntries((list) =>
                list.map((e) =>
                    e.id === entry.id
                        ? { ...e, ...updated, productName: e.productName }
                        : e,
                ),
            );
            setEditingEntry(null);
            ToastMessage.success('تم تحديث سجل الإدخال');
            load();
        } catch (err: any) {
            ToastMessage.error(err?.message || 'فشل التحديث');
        } finally {
            setSaving(false);
        }
    };

    const saveEditExit = async () => {
        const exit = editingExit();
        if (!exit) return;
        setSaving(true);
        try {
            const f = editForm();
            await updateStockExit(exit.id, {
                quantity: Number(f.quantity),
                exitDate: new Date(f.exitDate).toISOString(),
                receivedBy: f.receivedBy,
                deliveredBy: f.deliveredBy,
                governorate: f.governorate,
                centerName: f.centerName,
                notes: f.notes || null,
            });
            setEditingExit(null);
            ToastMessage.success('تم تحديث سجل الإخراج');
            load();
        } catch (err: any) {
            ToastMessage.error(err?.message || 'فشل التحديث');
        } finally {
            setSaving(false);
        }
    };

    // ---------- Excel export ----------
    const exportEntries = () => {
        const rows = entries().map((e) => ({
            productName: e.productName,
            quantity: e.quantity,
            entryDate: formatDate(e.entryDate),
            receivedBy: e.receivedBy,
            deliveredBy: e.deliveredBy,
            notes: e.notes || '',
            createdAt: formatDate(e.createdAt),
        }));
        exportCSV2('warehouse-entries', rows as any[], [
            { key: 'productName', label: 'اسم المنتج' },
            { key: 'quantity', label: 'الكمية' },
            { key: 'entryDate', label: 'تاريخ الإدخال' },
            { key: 'receivedBy', label: 'المستلم' },
            { key: 'deliveredBy', label: 'المسلم' },
            { key: 'notes', label: 'ملاحظات' },
            { key: 'createdAt', label: 'تاريخ التسجيل' },
        ]);
        ToastMessage.success('تم تصدير سجل الإدخالات');
    };

    const exportExits = () => {
        const rows = exits().map((e) => ({
            productName: e.productName,
            quantity: e.quantity,
            exitDate: formatDate(e.exitDate),
            receivedBy: e.receivedBy,
            deliveredBy: e.deliveredBy,
            governorate: e.governorate,
            centerName: e.centerName,
            notes: e.notes || '',
            createdAt: formatDate(e.createdAt),
        }));
        exportCSV2('warehouse-exits', rows as any[], [
            { key: 'productName', label: 'اسم المنتج' },
            { key: 'quantity', label: 'الكمية' },
            { key: 'exitDate', label: 'تاريخ الإخراج' },
            { key: 'receivedBy', label: 'المستلم' },
            { key: 'deliveredBy', label: 'المسلم' },
            { key: 'governorate', label: 'المحافظة' },
            { key: 'centerName', label: 'المركز' },
            { key: 'notes', label: 'ملاحظات' },
            { key: 'createdAt', label: 'تاريخ التسجيل' },
        ]);
        ToastMessage.success('تم تصدير سجل الإخراجات');
    };

    const switchTab = (t: Tab) => {
        setTab(t);
        setTimeout(load, 0);
    };

    return (
        <div class='space-y-6 p-4 md:p-6'>
            <div class='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div class='flex items-center gap-3'>
                    <div class='flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400'>
                        <Icon name='history' size={24} />
                    </div>
                    <div>
                        <h1 class='text-xl font-bold text-zinc-900 dark:text-zinc-50'>
                            سجل الإدخالات والإخراجات
                        </h1>
                        <p class='text-sm text-zinc-500 dark:text-zinc-400'>
                            عرض وتعديل وتصدير حركات المستودع
                        </p>
                    </div>
                </div>
                <div class='flex gap-2'>
                    <Show when={tab() === 'entries'}>
                        <Button variant='outline' leftIcon='download' onClick={exportEntries} disabled={entries().length === 0}>
                            تصدير Excel
                        </Button>
                    </Show>
                    <Show when={tab() === 'exits'}>
                        <Button variant='outline' leftIcon='download' onClick={exportExits} disabled={exits().length === 0}>
                            تصدير Excel
                        </Button>
                    </Show>
                </div>
            </div>

            {/* Tabs */}
            <div class='flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900/60 w-fit'>
                <button
                    class={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        tab() === 'entries'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                    onClick={() => switchTab('entries')}
                >
                    الإدخالات
                </button>
                <button
                    class={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        tab() === 'exits'
                            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                    onClick={() => switchTab('exits')}
                >
                    الإخراجات
                </button>
            </div>

            {/* Filters */}
            <Card class='p-4'>
                <div class='flex flex-col md:flex-row gap-3 items-end flex-wrap'>
                    <div class='flex-1 min-w-[160px]'>
                        <label class='mb-1 block text-xs font-medium text-zinc-500'>بحث بالمنتج</label>
                        <Input
                            value={query()}
                            onInput={(e) => setQuery(e.currentTarget.value)}
                            placeholder='اسم المنتج...'
                            icon='search'
                        />
                    </div>
                    <div class='w-full md:w-40'>
                        <label class='mb-1 block text-xs font-medium text-zinc-500'>من تاريخ</label>
                        <Input type='date' value={fromDate()} onInput={(e) => setFromDate(e.currentTarget.value)} />
                    </div>
                    <div class='w-full md:w-40'>
                        <label class='mb-1 block text-xs font-medium text-zinc-500'>إلى تاريخ</label>
                        <Input type='date' value={toDate()} onInput={(e) => setToDate(e.currentTarget.value)} />
                    </div>
                    <Show when={tab() === 'exits'}>
                        <div class='w-full md:w-40'>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>المحافظة</label>
                            <select
                                class='w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100'
                                value={govFilter()}
                                onChange={(e) => setGovFilter(e.currentTarget.value)}
                            >
                                <option value=''>الكل</option>
                                <For each={governorates()}>
                                    {(g) => <option value={g}>{g}</option>}
                                </For>
                            </select>
                        </div>
                    </Show>
                    <Button variant='primary' leftIcon='filter_list' onClick={load}>
                        تطبيق
                    </Button>
                </div>
            </Card>

            {/* Tables */}
            <Card class='overflow-hidden'>
                <Show when={loading()}>
                    <div class='flex items-center justify-center py-16 text-zinc-400'>
                        <Icon name='progress_activity' size={28} class='animate-spin' />
                        <span class='ms-2'>جاري التحميل...</span>
                    </div>
                </Show>

                {/* Entries table */}
                <Show when={!loading() && tab() === 'entries'}>
                    <Show when={entries().length === 0}>
                        <div class='flex flex-col items-center justify-center py-16 text-zinc-400'>
                            <Icon name='inbox' size={48} class='mb-3 opacity-40' />
                            <p>لا توجد سجلات إدخال</p>
                        </div>
                    </Show>
                    <Show when={entries().length > 0}>
                        <div class='overflow-x-auto'>
                            <table class='w-full text-sm text-right'>
                                <thead class='bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10'>
                                    <tr>
                                        <th class='px-4 py-3 font-medium'>المنتج</th>
                                        <th class='px-4 py-3 font-medium'>الكمية</th>
                                        <th class='px-4 py-3 font-medium'>تاريخ الإدخال</th>
                                        <th class='px-4 py-3 font-medium'>المستلم</th>
                                        <th class='px-4 py-3 font-medium'>المسلم</th>
                                        <th class='px-4 py-3 font-medium'>ملاحظات</th>
                                        <Show when={isAdmin()}>
                                            <th class='px-4 py-3 font-medium'>إجراءات</th>
                                        </Show>
                                    </tr>
                                </thead>
                                <tbody class='divide-y divide-zinc-100 dark:divide-white/5'>
                                    <For each={entries()}>
                                        {(e) => (
                                            <tr class='hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40'>
                                                <td class='px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100'>{e.productName}</td>
                                                <td class='px-4 py-3'>{formatQty(e.quantity)}</td>
                                                <td class='px-4 py-3 text-zinc-500'>{formatDate(e.entryDate)}</td>
                                                <td class='px-4 py-3'>{e.receivedBy}</td>
                                                <td class='px-4 py-3'>{e.deliveredBy}</td>
                                                <td class='px-4 py-3 text-zinc-500 max-w-[160px] truncate'>{e.notes || '—'}</td>
                                                <Show when={isAdmin()}>
                                                    <td class='px-4 py-3'>
                                                        <div class='flex gap-1'>
                                                            <Button size='sm' variant='ghost' leftIcon='edit' onClick={() => openEditEntry(e)} />
                                                            <Button size='sm' variant='ghost' leftIcon='delete' class='text-rose-500' onClick={() => onDeleteEntry(e)} />
                                                        </div>
                                                    </td>
                                                </Show>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                        <div class='px-4 py-3 border-t border-zinc-100 dark:border-white/5 text-xs text-zinc-500'>
                            عدد السجلات: {entries().length}
                        </div>
                    </Show>
                </Show>

                {/* Exits table */}
                <Show when={!loading() && tab() === 'exits'}>
                    <Show when={exits().length === 0}>
                        <div class='flex flex-col items-center justify-center py-16 text-zinc-400'>
                            <Icon name='outbox' size={48} class='mb-3 opacity-40' />
                            <p>لا توجد سجلات إخراج</p>
                        </div>
                    </Show>
                    <Show when={exits().length > 0}>
                        <div class='overflow-x-auto'>
                            <table class='w-full text-sm text-right'>
                                <thead class='bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10'>
                                    <tr>
                                        <th class='px-4 py-3 font-medium'>المنتج</th>
                                        <th class='px-4 py-3 font-medium'>الكمية</th>
                                        <th class='px-4 py-3 font-medium'>تاريخ الإخراج</th>
                                        <th class='px-4 py-3 font-medium'>المستلم</th>
                                        <th class='px-4 py-3 font-medium'>المسلم</th>
                                        <th class='px-4 py-3 font-medium'>المحافظة</th>
                                        <th class='px-4 py-3 font-medium'>المركز</th>
                                        <Show when={isAdmin()}>
                                            <th class='px-4 py-3 font-medium'>إجراءات</th>
                                        </Show>
                                    </tr>
                                </thead>
                                <tbody class='divide-y divide-zinc-100 dark:divide-white/5'>
                                    <For each={exits()}>
                                        {(e) => (
                                            <tr class='hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40'>
                                                <td class='px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100'>{e.productName}</td>
                                                <td class='px-4 py-3'>{formatQty(e.quantity)}</td>
                                                <td class='px-4 py-3 text-zinc-500'>{formatDate(e.exitDate)}</td>
                                                <td class='px-4 py-3'>{e.receivedBy}</td>
                                                <td class='px-4 py-3'>{e.deliveredBy}</td>
                                                <td class='px-4 py-3'>{e.governorate}</td>
                                                <td class='px-4 py-3'>{e.centerName}</td>
                                                <Show when={isAdmin()}>
                                                    <td class='px-4 py-3'>
                                                        <div class='flex gap-1'>
                                                            <Button size='sm' variant='ghost' leftIcon='edit' onClick={() => openEditExit(e)} />
                                                            <Button size='sm' variant='ghost' leftIcon='delete' class='text-rose-500' onClick={() => onDeleteExit(e)} />
                                                        </div>
                                                    </td>
                                                </Show>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                        <div class='px-4 py-3 border-t border-zinc-100 dark:border-white/5 text-xs text-zinc-500'>
                            عدد السجلات: {exits().length}
                        </div>
                    </Show>
                </Show>
            </Card>

            {/* Edit Entry Modal */}
            <Show when={editingEntry()}>
                <div class='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
                    <Card class='w-full max-w-md p-5 space-y-4'>
                        <h2 class='text-lg font-bold'>تعديل سجل إدخال</h2>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>الكمية</label>
                            <Input type='number' step='any' value={editForm().quantity || ''} onInput={(e) => setEditForm({ ...editForm(), quantity: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>تاريخ الإدخال</label>
                            <Input type='datetime-local' value={editForm().entryDate || ''} onInput={(e) => setEditForm({ ...editForm(), entryDate: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>المستلم</label>
                            <Input value={editForm().receivedBy || ''} onInput={(e) => setEditForm({ ...editForm(), receivedBy: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>المسلم</label>
                            <Input value={editForm().deliveredBy || ''} onInput={(e) => setEditForm({ ...editForm(), deliveredBy: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>ملاحظات</label>
                            <Input value={editForm().notes || ''} onInput={(e) => setEditForm({ ...editForm(), notes: e.currentTarget.value })} />
                        </div>
                        <div class='flex justify-end gap-2 pt-2'>
                            <Button variant='outline' onClick={() => setEditingEntry(null)} disabled={saving()}>إلغاء</Button>
                            <Button variant='primary' loading={saving()} onClick={saveEditEntry}>حفظ</Button>
                        </div>
                    </Card>
                </div>
            </Show>

            {/* Edit Exit Modal */}
            <Show when={editingExit()}>
                <div class='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
                    <Card class='w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto'>
                        <h2 class='text-lg font-bold'>تعديل سجل إخراج</h2>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>الكمية</label>
                            <Input type='number' step='any' value={editForm().quantity || ''} onInput={(e) => setEditForm({ ...editForm(), quantity: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>تاريخ الإخراج</label>
                            <Input type='datetime-local' value={editForm().exitDate || ''} onInput={(e) => setEditForm({ ...editForm(), exitDate: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>المستلم</label>
                            <Input value={editForm().receivedBy || ''} onInput={(e) => setEditForm({ ...editForm(), receivedBy: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>المسلم</label>
                            <Input value={editForm().deliveredBy || ''} onInput={(e) => setEditForm({ ...editForm(), deliveredBy: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>المحافظة</label>
                            <select
                                class='w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-900/60'
                                value={editForm().governorate || ''}
                                onChange={(e) => setEditForm({ ...editForm(), governorate: e.currentTarget.value })}
                            >
                                <For each={governorates()}>
                                    {(g) => <option value={g}>{g}</option>}
                                </For>
                            </select>
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>اسم المركز</label>
                            <Input value={editForm().centerName || ''} onInput={(e) => setEditForm({ ...editForm(), centerName: e.currentTarget.value })} />
                        </div>
                        <div>
                            <label class='mb-1 block text-xs font-medium text-zinc-500'>ملاحظات</label>
                            <Input value={editForm().notes || ''} onInput={(e) => setEditForm({ ...editForm(), notes: e.currentTarget.value })} />
                        </div>
                        <div class='flex justify-end gap-2 pt-2'>
                            <Button variant='outline' onClick={() => setEditingExit(null)} disabled={saving()}>إلغاء</Button>
                            <Button variant='primary' loading={saving()} onClick={saveEditExit}>حفظ</Button>
                        </div>
                    </Card>
                </div>
            </Show>
        </div>
    );
};

export default WarehouseHistory;
