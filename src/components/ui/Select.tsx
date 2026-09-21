import type { JSX } from 'solid-js';
import { cn } from '../../utils/cn';

function Select(props: JSX.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            class={cn(
                'w-full py-2 px-3 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900',
                'dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100',
                'h-9 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
                props.class as string,
            )}
        >
            {props.children}
        </select>
    );
}

export default Select;
