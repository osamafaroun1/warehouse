import { For, type JSX, mergeProps } from 'solid-js';

export function Skeleton(props: { class?: string; children?: JSX.Element }) {
    return (
        <div
            class={`animate-pulse rounded-md bg-zinc-200 dark:bg-white/10 ${props.class ?? ''}`}
        >
            {props.children}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div class='rounded-xl border border-zinc-200 bg-white/80 p-5 dark:border-white/10 dark:bg-zinc-900/60'>
            <div class='space-y-3'>
                <div class='h-4 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-white/10' />
                <div class='h-8 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-white/10' />
                <div class='h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-white/10' />
                <div class='h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-white/10' />
            </div>
        </div>
    );
}

export function SkeletonTable(_props: { rows?: number; columns?: number }) {
    const props = mergeProps({ rows: 5, columns: 4 }, _props);
    return (
        <div class='space-y-3 p-4'>
            <div class='flex gap-3'>
                <For each={Array.from({ length: props.columns })}>
                    {() => <div class='h-4 flex-1 animate-pulse rounded bg-zinc-200 dark:bg-white/10' />}
                </For>
            </div>
            <For each={Array.from({ length: props.rows })}>
                {() => (
                    <div class='flex gap-3'>
                        <For each={Array.from({ length: props.columns })}>
                            {() => <div class='h-8 flex-1 animate-pulse rounded bg-zinc-200 dark:bg-white/10' />}
                        </For>
                    </div>
                )}
            </For>
        </div>
    );
}
