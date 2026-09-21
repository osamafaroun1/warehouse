import { For } from 'solid-js';
import { toasts } from '../../utils/ToastMessage';
import { Icon } from '../ui';

export function ToastHost() {
    const toneStyles = {
        success: {
            icon: 'check_circle',
            iconClass: 'text-emerald-500',
            border: 'border-emerald-500/20',
        },
        error: {
            icon: 'error',
            iconClass: 'text-rose-500',
            border: 'border-rose-500/20',
        },
        info: {
            icon: 'info',
            iconClass: 'text-sky-500',
            border: 'border-sky-500/20',
        },
        warning: {
            icon: 'warning',
            iconClass: 'text-amber-500',
            border: 'border-amber-500/20',
        },
    };

    return (
        <div class='pointer-events-none fixed bottom-6 left-6 z-[600] flex w-96 flex-col gap-3'>
            <For each={toasts()}>
                {(t) => {
                    const style = toneStyles[t.type];

                    return (
                        <div
                            class={`
                                pointer-events-auto
                                flex items-center gap-3
                                rounded-xl
                                border
                                bg-white/95
                                px-4 py-3
                                text-sm
                                shadow-xl
                                backdrop-blur
                                animate-fade-up
                                dark:bg-zinc-900/95
                                ${style.border}
                            `}
                        >
                            <div class='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5'>
                                <Icon
                                    name={style.icon}
                                    size={20}
                                    class={style.iconClass}
                                />
                            </div>

                            <span class='flex-1 text-zinc-700 dark:text-zinc-200'>
                                {t.message}
                            </span>
                        </div>
                    );
                }}
            </For>
        </div>
    );
}
