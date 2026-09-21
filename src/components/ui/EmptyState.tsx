import { Component, type JSX, Show } from 'solid-js';
import { Icon } from '.';

const EmptyState: Component<{ icon: string; title: string; description?: string; action?: JSX.Element }> = (props) => {
    return (
        <div class='flex flex-col items-center justify-center p-10 text-center'>
            <div class='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5'>
                <Icon name={props.icon} size={28} />
            </div>
            <h3 class='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>{props.title}</h3>
            <Show when={props.description}>
                <p class='mt-1 max-w-xs text-xs text-zinc-500'>{props.description}</p>
            </Show>
            <Show when={props.action}>
                <div class='mt-4'>{props.action}</div>
            </Show>
        </div>
    );
};

export default EmptyState;
