import { For, type JSX, onCleanup, onMount, ParentComponent, type ParentProps, Show, untrack } from 'solid-js';
import { isRtl } from '../../localization';
import { BadgeTone } from '../../types/types';

export function cn(...parts: Array<string | false | null | undefined>): string {
    return parts.filter(Boolean).join(' ');
}

export function Field(props: {
    label: string;
    required?: boolean;
    error?: string | null;
    children: any;
}) {
    return (
        <div>
            <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                {props.label}
                {props.required && <span class='text-rose-500'>*</span>}
            </label>

            {props.children}

            <Show when={props.error}>
                <p class='mt-1 text-xs text-rose-500'>{props.error}</p>
            </Show>
        </div>
    );
}

/* ---------- Icon ---------- */
const ICON_COLORS = {
    default: '',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
} as const;

type IconColor = keyof typeof ICON_COLORS;

export function Icon(props: {
    name: string;
    class?: string;
    size?: number;
    rounded?: boolean;
    color?: IconColor;
}) {
    return (
        <span
            class={cn(
                props.rounded !== false ? 'material-icons-round' : 'material-icons',
                ICON_COLORS[props.color ?? 'default'],
                props.class,
            )}
            style={{ 'font-size': `${props.size ?? 20}px` }}
        >
            {props.name}
        </span>
    );
}

/* ---------- Card ---------- */
type CardProps = {
    class?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    maxHeight?: string;
};

export const Card: ParentComponent<CardProps> = (props) => {
    const pad = untrack(() => ({
        none: '',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
    }[props.padding ?? 'md']));

    return (
        <div
            class={cn(
                'flex flex-col rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm',
                'dark:border-white/10 dark:bg-zinc-900/60',
                pad,
                props.class,
            )}
            style={props.maxHeight ? { 'max-height': props.maxHeight } : undefined}
        >
            {props.children}
        </div>
    );
};

/* ---------- Badge ---------- */
export function Badge(
    props: ParentProps<{
        tone?: BadgeTone;
        class?: string;
    }>,
) {
    const tones = {
        default: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        purple: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    };
    return (
        <span
            class={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium',
                tones[props.tone ?? 'default'],
                props.class,
            )}
        >
            {props.children}
        </span>
    );
}

/* ---------- Table ---------- */
export function Table<T>(props: {
    columns: { key: string; header: string; render?: (row: T) => JSX.Element; class?: string }[];
    rows: T[];
    keyOf?: (r: T) => string | number;
    onRowClick?: (r: T) => void;
    class?: string;
}) {
    // Inline style (not just a class) so this can't be silently beaten by
    // any other th/td rule elsewhere in the app's CSS cascade.
    const align = () => (isRtl() ? 'right' : 'left');

    return (
        <div class={cn('overflow-x-auto', props.class)}>
            <table class='min-w-full text-sm'>
                <thead>
                    <tr class='border-b border-zinc-200 dark:border-white/10 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
                        <For each={props.columns}>
                            {(c) => (
                                <th class={cn('px-4 py-3', c.class)} style={{ 'text-align': align() }}>
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
                                            class={cn('px-4 py-3 text-zinc-700 dark:text-zinc-200', c.class)}
                                            style={{ 'text-align': align() }}
                                        >
                                            {c.render
                                                ? c.render(row)
                                                : (row as Record<string, unknown>)[c.key] as JSX.Element}
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

/* ---------- Modal ---------- */
export function Modal(
    props: ParentProps<{ open: boolean; onClose: () => void; title?: string; size?: 'sm' | 'md' | 'lg' }>,
) {
    const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };
    const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') props.onClose();
    };
    onMount(() => document.addEventListener('keydown', handleKey));
    onCleanup(() => document.removeEventListener('keydown', handleKey));
    return (
        <Show when={props.open}>
            <div class='fixed inset-0 z-50 flex items-center justify-center p-4'>
                <div class='flexabsolute inset-0 bg-black/60 backdrop-blur-sm' onClick={() => props.onClose()} />
                <div
                    class={cn(
                        'relative w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-fade-up',
                        'dark:border-white/10 dark:bg-zinc-900',
                        sizes[props.size ?? 'md'],
                    )}
                >
                    <Show when={props.title}>
                        <div class='mb-4 flex items-center justify-between'>
                            <h3 class='text-base font-semibold text-zinc-900 dark:text-zinc-100'>{props.title}</h3>
                            <button
                                onClick={() => props.onClose()}
                                class='flex rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
                            >
                                <Icon name='close' size={18} />
                            </button>
                        </div>
                    </Show>
                    {props.children}
                </div>
            </div>
        </Show>
    );
}

/* ---------- Avatar ---------- */
export function Avatar(props: { name: string; src?: string; size?: number; class?: string }) {
    const initials = () =>
        props.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    const colors = [
        'bg-indigo-500',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-sky-500',
        'bg-rose-500',
        'bg-violet-500',
    ];
    const idx = () => props.name.charCodeAt(0) % colors.length;
    return (
        <div
            class={cn(
                'inline-flex items-center justify-center overflow-hidden rounded-full text-white font-medium shrink-0',
                colors[idx()],
                props.class,
            )}
            style={{
                width: `${props.size ?? 32}px`,
                height: `${props.size ?? 32}px`,
                'font-size': `${(props.size ?? 32) * 0.4}px`,
            }}
        >
            <Show when={props.src} fallback={initials()}>
                <img src={props.src} alt={props.name} class='h-full w-full object-cover' />
            </Show>
        </div>
    );
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>(props: {
    tabs: { key: T; label: string; icon?: string }[];
    value: () => T;
    onChange: (v: T) => void;
    class?: string;
}) {
    return (
        <div
            class={cn(
                'inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-900/60',
                props.class,
            )}
        >
            <For each={props.tabs}>
                {(t) => (
                    <button
                        onClick={() => props.onChange(t.key)}
                        class={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            props.value() === t.key
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
                        )}
                    >
                        <Show when={t.icon}>
                            <Icon name={t.icon!} size={14} />
                        </Show>
                        {t.label}
                    </button>
                )}
            </For>
        </div>
    );
}
