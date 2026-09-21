import { JSX, Show } from 'solid-js';
import { cn } from '../../utils/cn';
import { Icon } from '.';

export function Input(props: JSX.InputHTMLAttributes<HTMLInputElement> & { icon?: string; wrapperClass?: string }) {
    return (
        <div class={cn('relative w-full', props.wrapperClass)}>
            <Show when={props.icon}>
                <span class='flex pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500'>
                    <Icon name={props.icon!} size={18} />
                </span>
            </Show>
            <input
                {...props}
                class={cn(
                    'w-full py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400',
                    'dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500',
                    'h-9 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    props.icon ? 'pl-9 pr-3' : 'px-3',
                    props.class as string,
                )}
            />
        </div>
    );
}
