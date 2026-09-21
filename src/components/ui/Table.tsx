import { For, JSX } from 'solid-js';
import { isRtl } from '../../localization';
import { cn } from '.';

type Column<T> = {
    key?: keyof T;
    header: string;
    render?: (row: T) => JSX.Element;
    class?: string;
};

type TableProps<T> = {
    columns: Column<T>[];
    rows: T[];
    keyOf?: (r: T) => string | number;
    onRowClick?: (r: T) => void;
    class?: string;
};

function Table<T>(props: TableProps<T>) {
    return (
        <div class={cn('overflow-x-auto', props.class)}>
            <table class='min-w-full text-sm'>
                <thead>
                    <tr
                        class={cn(
                            'border-b border-zinc-200 dark:border-white/10 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400',
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
                    <For each={props.rows}>
                        {(row) => (
                            <tr
                                class={cn(
                                    'border-b border-zinc-100 last:border-0 dark:border-white/5',
                                    'hover:bg-zinc-50/80 dark:hover:bg-white/3 transition-colors',
                                    props.onRowClick && 'cursor-pointer',
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
                                            {c.render ? c.render(row) : String(c.key ? row[c.key] : '')}
                                        </td>
                                    )}
                                </For>
                            </tr>
                        )}
                    </For>
                </tbody>
            </table>
        </div>
    );
}

export default Table;
