import { JSX, Show, splitProps } from 'solid-js';
import { cn } from '../../utils/cn';
import { Icon } from '.';

type TextAreaProps = JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    icon?: string;
    wrapperClass?: string;
};

export function TextArea(props: TextAreaProps) {
    const [local, textareaProps] = splitProps(props, [
        'icon',
        'wrapperClass',
        'class',
        'rows',
    ]);

    return (
        <div class={cn('relative w-full', local.wrapperClass)}>
            <Show when={local.icon}>
                <span class='pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-zinc-400 dark:text-zinc-500'>
                    <Icon name={local.icon!} size={18} />
                </span>
            </Show>

            <textarea
                {...textareaProps}
                rows={local.rows ?? 5}
                class={cn(
                    'w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 px-3 py-2 resize-none',
                    'dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500',
                    'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    local.icon ? 'pl-9 pr-3' : 'px-3',
                    local.class,
                )}
            />
        </div>
    );
}
