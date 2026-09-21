import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import { getProductsWithStock, ProductWithStock } from '../api/warehouse.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Icon } from '../components/ui';
import { exportCSV2 } from '../utils/export';
import { ToastMessage } from '../utils/ToastMessage';

const WarehouseStock: Component = () => {
    const [products, setProducts] = createSignal<ProductWithStock[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [query, setQuery] = createSignal('');
    const [minStock, setMinStock] = createSignal('');
    const [maxStock, setMaxStock] = createSignal('');

    const load = async () => {
        setLoading(true);
        try {
            const data = await getProductsWithStock({
                query: query().trim() || undefined,
                minStock: minStock() !== '' ? Number(minStock()) : undefined,
                maxStock: maxStock() !== '' ? Number(maxStock()) : undefined,
                limit: 200,
            });
            setProducts(data);
        } catch (err: any) {
            ToastMessage.error(err?.message || 'فشل تحميل المنتجات');
        } finally {
            setLoading(false);
        }
    };

    createEffect(() => {
        // initial load
        load();
    });

    const handleFilter = (e: Event) => {
        e.preventDefault();
        load();
    };

    const clearFilters = () => {
        setQuery('');
        setMinStock('');
        setMaxStock('');
        setTimeout(load, 0);
    };

    const formatQty = (v: string | number) => {
        const n = Number(v);
        if (Number.isNaN(n)) return v;
        return n.toLocaleString('ar-SY', { maximumFractionDigits: 3 });
    };

    const exportStock = () => {
        const rows = products().map((p) => ({
            name: p.name,
            unit: p.unit,
            totalIn: p.totalIn,
            totalOut: p.totalOut,
            currentStock: p.currentStock,
        }));
        exportCSV2('warehouse-stock', rows as any[], [
            { key: 'name', label: 'اسم المنتج' },
            { key: 'unit', label: 'الوحدة' },
            { key: 'totalIn', label: 'إجمالي الإدخال' },
            { key: 'totalOut', label: 'إجمالي الإخراج' },
            { key: 'currentStock', label: 'الرصيد الحالي' },
        ]);
        ToastMessage.success('تم تصدير المخزون');
    };

    return (
        <div class='space-y-6 p-4 md:p-6'>
            <div class='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div class='flex items-center gap-3'>
                    <div class='flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'>
                        <Icon name='inventory_2' size={24} />
                    </div>
                    <div>
                        <h1 class='text-xl font-bold text-zinc-900 dark:text-zinc-50'>
                            مخزون المستودع
                        </h1>
                        <p class='text-sm text-zinc-500 dark:text-zinc-400'>
                            عرض المنتجات والرصيد الحالي مع إمكانية الفلترة
                        </p>
                    </div>
                </div>
                <div class='flex gap-2'>
                    <Button
                        variant='outline'
                        leftIcon='download'
                        onClick={exportStock}
                        disabled={loading() || products().length === 0}
                    >
                        تصدير Excel
                    </Button>
                    <Button
                        variant='outline'
                        leftIcon='refresh'
                        onClick={load}
                        disabled={loading()}
                    >
                        تحديث
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card class='p-4'>
                <form onSubmit={handleFilter} class='flex flex-col md:flex-row gap-3 items-end'>
                    <div class='flex-1 w-full'>
                        <label class='mb-1 block text-xs font-medium text-zinc-500'>
                            بحث باسم المنتج
                        </label>
                        <Input
                            value={query()}
                            onInput={(e) => setQuery(e.currentTarget.value)}
                            placeholder='اكتب اسم المنتج...'
                            icon='search'
                        />
                    </div>
                    <div class='w-full md:w-32'>
                        <label class='mb-1 block text-xs font-medium text-zinc-500'>
                            الحد الأدنى للرصيد
                        </label>
                        <Input
                            type='number'
                            value={minStock()}
                            onInput={(e) => setMinStock(e.currentTarget.value)}
                            placeholder='0'
                        />
                    </div>
                    <div class='w-full md:w-32'>
                        <label class='mb-1 block text-xs font-medium text-zinc-500'>
                            الحد الأقصى للرصيد
                        </label>
                        <Input
                            type='number'
                            value={maxStock()}
                            onInput={(e) => setMaxStock(e.currentTarget.value)}
                            placeholder='∞'
                        />
                    </div>
                    <div class='flex gap-2'>
                        <Button type='submit' variant='primary' leftIcon='filter_list'>
                            تطبيق
                        </Button>
                        <Button type='button' variant='ghost' onClick={clearFilters}>
                            مسح
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Table */}
            <Card class='overflow-hidden'>
                <Show when={loading()}>
                    <div class='flex items-center justify-center py-16 text-zinc-400'>
                        <Icon name='progress_activity' size={28} class='animate-spin' />
                        <span class='ms-2'>جاري التحميل...</span>
                    </div>
                </Show>

                <Show when={!loading() && products().length === 0}>
                    <div class='flex flex-col items-center justify-center py-16 text-zinc-400'>
                        <Icon name='inventory' size={48} class='mb-3 opacity-40' />
                        <p>لا توجد منتجات مطابقة للفلاتر</p>
                    </div>
                </Show>

                <Show when={!loading() && products().length > 0}>
                    <div class='overflow-x-auto'>
                        <table class='w-full text-sm text-right'>
                            <thead class='bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10'>
                                <tr>
                                    <th class='px-4 py-3 font-medium'>#</th>
                                    <th class='px-4 py-3 font-medium'>اسم المنتج</th>
                                    <th class='px-4 py-3 font-medium'>الوحدة</th>
                                    <th class='px-4 py-3 font-medium'>إجمالي الإدخال</th>
                                    <th class='px-4 py-3 font-medium'>إجمالي الإخراج</th>
                                    <th class='px-4 py-3 font-medium'>الرصيد الحالي</th>
                                </tr>
                            </thead>
                            <tbody class='divide-y divide-zinc-100 dark:divide-white/5'>
                                <For each={products()}>
                                    {(p, i) => {
                                        const stock = Number(p.currentStock);
                                        const stockClass =
                                            stock <= 0
                                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                                : stock < 10
                                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                                  : 'text-emerald-600 dark:text-emerald-400 font-medium';

                                        return (
                                            <tr class='hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors'>
                                                <td class='px-4 py-3 text-zinc-400'>{i() + 1}</td>
                                                <td class='px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100'>
                                                    {p.name}
                                                </td>
                                                <td class='px-4 py-3 text-zinc-500'>{p.unit}</td>
                                                <td class='px-4 py-3'>{formatQty(p.totalIn)}</td>
                                                <td class='px-4 py-3'>{formatQty(p.totalOut)}</td>
                                                <td class={`px-4 py-3 ${stockClass}`}>
                                                    {formatQty(p.currentStock)}
                                                </td>
                                            </tr>
                                        );
                                    }}
                                </For>
                            </tbody>
                        </table>
                    </div>
                    <div class='px-4 py-3 border-t border-zinc-100 dark:border-white/5 text-xs text-zinc-500'>
                        عدد المنتجات: {products().length}
                    </div>
                </Show>
            </Card>
        </div>
    );
};

export default WarehouseStock;
