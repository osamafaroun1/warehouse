import { A } from '@solidjs/router';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { getProductsWithStock, getStockEntries, getStockExits } from '../api/warehouse.api';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui';
import { ToastMessage } from '../utils/ToastMessage';

const Home: Component = () => {
    const [productCount, setProductCount] = createSignal(0);
    const [totalStock, setTotalStock] = createSignal(0);
    const [entryCount, setEntryCount] = createSignal(0);
    const [exitCount, setExitCount] = createSignal(0);
    const [loading, setLoading] = createSignal(true);

    onMount(async () => {
        try {
            const [products, entries, exits] = await Promise.all([
                getProductsWithStock({ limit: 500 }),
                getStockEntries({ limit: 500 }),
                getStockExits({ limit: 500 }),
            ]);
            setProductCount(products.length);
            setTotalStock(
                products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0),
            );
            setEntryCount(entries.length);
            setExitCount(exits.length);
        } catch (err: any) {
            ToastMessage.error(err?.message || 'فشل تحميل الإحصائيات');
        } finally {
            setLoading(false);
        }
    });

    const cards = () => [
        {
            label: 'عدد المنتجات',
            value: productCount(),
            icon: 'inventory_2',
            color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            to: '/warehouse/stock',
        },
        {
            label: 'إجمالي الرصيد',
            value: totalStock().toLocaleString('ar-SY', { maximumFractionDigits: 2 }),
            icon: 'warehouse',
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            to: '/warehouse/stock',
        },
        {
            label: 'عمليات الإدخال',
            value: entryCount(),
            icon: 'add_box',
            color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
            to: '/warehouse/history',
        },
        {
            label: 'عمليات الإخراج',
            value: exitCount(),
            icon: 'outbox',
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            to: '/warehouse/history',
        },
    ];

    return (
        <div class='space-y-6 p-4 md:p-6'>
            <div>
                <h1 class='text-2xl font-bold text-zinc-900 dark:text-zinc-50'>
                    نظام إدارة المستودع
                </h1>
                <p class='text-sm text-zinc-500 dark:text-zinc-400 mt-1'>
                    مرحباً بك — نظرة سريعة على حالة المخزون والحركات
                </p>
            </div>

            <Show when={loading()}>
                <div class='flex items-center justify-center py-20 text-zinc-400'>
                    <Icon name='progress_activity' size={32} class='animate-spin' />
                </div>
            </Show>

            <Show when={!loading()}>
                <div class='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                    {cards().map((c) => (
                        <A href={c.to} class='block group'>
                            <Card class='p-5 transition-shadow group-hover:shadow-md'>
                                <div class='flex items-start justify-between'>
                                    <div>
                                        <p class='text-sm text-zinc-500 dark:text-zinc-400'>{c.label}</p>
                                        <p class='mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50'>
                                            {c.value}
                                        </p>
                                    </div>
                                    <div class={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
                                        <Icon name={c.icon} size={22} />
                                    </div>
                                </div>
                            </Card>
                        </A>
                    ))}
                </div>

                <div class='grid grid-cols-1 md:grid-cols-3 gap-4 mt-2'>
                    <A href='/warehouse/entry'>
                        <Card class='p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer'>
                            <div class='flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600'>
                                <Icon name='add_box' size={24} />
                            </div>
                            <div>
                                <p class='font-semibold text-zinc-900 dark:text-zinc-50'>إدخال منتجات</p>
                                <p class='text-xs text-zinc-500'>تسجيل بضاعة واردة للمستودع</p>
                            </div>
                        </Card>
                    </A>
                    <A href='/warehouse/exit'>
                        <Card class='p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer'>
                            <div class='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600'>
                                <Icon name='outbox' size={24} />
                            </div>
                            <div>
                                <p class='font-semibold text-zinc-900 dark:text-zinc-50'>إخراج منتجات</p>
                                <p class='text-xs text-zinc-500'>تسجيل بضاعة صادرة للمحافظات</p>
                            </div>
                        </Card>
                    </A>
                    <A href='/warehouse/history'>
                        <Card class='p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer'>
                            <div class='flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600'>
                                <Icon name='history' size={24} />
                            </div>
                            <div>
                                <p class='font-semibold text-zinc-900 dark:text-zinc-50'>سجل الحركات</p>
                                <p class='text-xs text-zinc-500'>عرض وتعديل وتصدير السجلات</p>
                            </div>
                        </Card>
                    </A>
                </div>
            </Show>
        </div>
    );
};

export default Home;
