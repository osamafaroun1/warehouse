import { Component, Show } from 'solid-js';
import { Icon } from '.';

const SectionHeader: Component<{
    title: string;
    subtitle?: string;
    icon?: string;
}> = (props) => {
    return (
        <div class='flex items-start gap-3'>
            <Show when={props.icon}>
                <div class='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'>
                    <Icon name={props.icon!} size={19} />
                </div>
            </Show>

            <div>
                <h2 class='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                    {props.title}
                </h2>

                <Show when={props.subtitle}>
                    <p class='mt-0.5 text-xs text-zinc-500'>
                        {props.subtitle}
                    </p>
                </Show>
            </div>
        </div>
    );
};

export default SectionHeader;
