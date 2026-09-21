import { Accessor, createEffect, createMemo, createSignal, For, JSX, Show, untrack } from 'solid-js';
import { isRtl, t } from '../../localization';
import { cn } from '../../utils/cn';

type HasId = {
    id: string | number;
};

type Column<T> = {
    key?: keyof T;
    header: string;
    render?: (row: T) => JSX.Element;
    class?: string;
};

type TableProps<T> = {
    columns: Column<T>[];
    rows: T[];
    pageSize?: number;
    pageSizeOptions?: number[];
    keyOf?: (r: T) => string | number;
    onRowClick?: (r: T) => void;
    wrapperClass?: string;
    class?: string;
    selected?: Accessor<T[] | undefined>;
    // New optional callbacks
    onPageSizeChange?: (size: number) => void;
    onPageChange?: (offset: number) => void;
};

export function Table2<T extends HasId>(props: TableProps<T>) {
    const [page, setPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(
        untrack(() => props.pageSize ?? 50),
    );

    const totalPages = createMemo(() => Math.max(1, Math.ceil(props.rows.length / pageSize())));

    const visibleRows = createMemo(() => {
        const start = (page() - 1) * pageSize();
        return props.rows.slice(start, start + pageSize());
    });

    createEffect(() => {
        if (page() > totalPages()) {
            setPage(totalPages());
        }
    });

    const from = createMemo(() => props.rows.length === 0 ? 0 : (page() - 1) * pageSize() + 1);

    const to = createMemo(() => Math.min(page() * pageSize(), props.rows.length));

    const isSelected = (row: T) => props.selected?.()?.some((r) => r.id === row.id) ?? false;

    const wrapperClass = () =>
        props.wrapperClass ?? 'overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10';

    // Helper to notify parent of page change
    const notifyPageChange = (newPage: number) => {
        const newOffset = (newPage - 1) * pageSize();
        props.onPageChange?.(newOffset);
    };

    // Handle page size change
    const handlePageSizeChange = (e: Event) => {
        const target = e.currentTarget as HTMLSelectElement;
        const newSize = Number(target.value);
        setPageSize(newSize);
        setPage(1);
        props.onPageSizeChange?.(newSize);
        props.onPageChange?.(0); // offset resets to 0
    };

    // Page navigation helpers
    const goToFirst = () => {
        if (page() !== 1) {
            setPage(1);
            notifyPageChange(1);
        }
    };

    const goToPrev = () => {
        if (page() > 1) {
            const newPage = page() - 1;
            setPage(newPage);
            notifyPageChange(newPage);
        }
    };

    const goToNext = () => {
        if (page() < totalPages()) {
            const newPage = page() + 1;
            setPage(newPage);
            notifyPageChange(newPage);
        }
    };

    const goToLast = () => {
        const last = totalPages();
        if (page() !== last) {
            setPage(last);
            notifyPageChange(last);
        }
    };

    return (
        <div class={wrapperClass()}>
            <div class={cn('overflow-x-auto', props.class)}>
                <table class='min-w-full text-sm'>
                    <thead>
                        <tr
                            class={cn(
                                'border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:text-zinc-400',
                                isRtl() ? 'text-right' : 'text-left',
                            )}
                        >
                            <For each={props.columns}>
                                {(c) => (
                                    <th class={cn('px-4 py-3', c.class)}>
                                        {c.header}
                                    </th>
                                )}
                            </For>
                        </tr>
                    </thead>

                    <tbody>
                        <Show
                            when={visibleRows().length > 0}
                            fallback={
                                <tr>
                                    <td
                                        colspan={props.columns.length}
                                        class='px-4 py-8 text-center text-zinc-500'
                                    >
                                        {t('mmp_table_no_data')}
                                    </td>
                                </tr>
                            }
                        >
                            <For each={visibleRows()}>
                                {(row) => (
                                    <tr
                                        class={cn(
                                            'border-b border-zinc-100 last:border-0 dark:border-white/5',
                                            'hover:bg-zinc-50/80 dark:hover:bg-white/5',
                                            props.onRowClick && 'cursor-pointer',
                                            isSelected(row)
                                                && 'bg-blue-50 text-blue-900 dark:bg-blue-500/10 dark:text-blue-100',
                                        )}
                                        onClick={() => props.onRowClick?.(row)}
                                    >
                                        <For each={props.columns}>
                                            {(c) => (
                                                <td
                                                    class={cn(
                                                        'px-4 py-3 text-zinc-700 dark:text-zinc-200',
                                                        c.class,
                                                    )}
                                                >
                                                    {c.render
                                                        ? c.render(row)
                                                        : String(c.key ? (row[c.key] || 'N/A') : '')}
                                                </td>
                                            )}
                                        </For>
                                    </tr>
                                )}
                            </For>
                        </Show>
                    </tbody>
                </table>
            </div>

            <div class='flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between'>
                <div class='flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400'>
                    <span>
                        {t('mmp_table_showing', { from: from(), to: to(), total: props.rows.length })}
                    </span>

                    <select
                        class='rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-zinc-900'
                        value={pageSize()}
                        onInput={handlePageSizeChange}
                    >
                        <For each={props.pageSizeOptions ?? [50, 100]}>
                            {(size) => <option value={size}>{t('mmp_table_rows_option', { count: size })}</option>}
                        </For>
                    </select>
                </div>

                <div class='flex items-center gap-1'>
                    <button
                        class='rounded-md border border-zinc-200 px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5'
                        disabled={page() === 1}
                        onClick={goToFirst}
                    >
                        {isRtl() ? '»' : '«'}
                    </button>

                    <button
                        class='rounded-md border border-zinc-200 px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5'
                        disabled={page() === 1}
                        onClick={goToPrev}
                    >
                        {t('mmp_table_prev')}
                    </button>

                    <div class='rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium dark:bg-white/5'>
                        {page()} / {totalPages()}
                    </div>

                    <button
                        class='rounded-md border border-zinc-200 px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5'
                        disabled={page() === totalPages()}
                        onClick={goToNext}
                    >
                        {t('mmp_table_next')}
                    </button>

                    <button
                        class='rounded-md border border-zinc-200 px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5'
                        disabled={page() === totalPages()}
                        onClick={goToLast}
                    >
                        {isRtl() ? '«' : '»'}
                    </button>
                </div>
            </div>
        </div>
    );
}
