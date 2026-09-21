import { Accessor, Component, createSignal, For, JSX, onCleanup, onMount, Show } from 'solid-js';
import { t } from '../../localization';
import { DialogButton, DialogButtonOptions, DialogOptions } from '../../types/types';
import { cn } from '../../utils/cn';

type DialogComponentProps = {
    index: number;
    title: string;
    buttons?: DialogButton[] | Accessor<DialogButton[]>;
    options?: DialogOptions;
    children?: JSX.Element | JSX.Element[];
    done: (submit: boolean | DialogButtonOptions) => void;
    onKeyDown?: (e: KeyboardEvent) => boolean;
};

const DialogComponent: Component<DialogComponentProps> = (props) => {
    const DEFAULT_WIDTH = '32rem';
    let dialogContainerRef!: HTMLDivElement;
    let dragStartX = 0;
    let dragStartY = 0;
    let startLeft = 0;
    let startTop = 0;

    const [fade, setFade] = createSignal(true);
    const [isDragging, setIsDragging] = createSignal(false);

    const onSubmit = (submit = false) => {
        props.done(submit);
    };

    const resolveWidth = (width?: string | number) => {
        if (width === undefined) return DEFAULT_WIDTH;
        return typeof width === 'number' ? `${width}px` : width;
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (props.onKeyDown && !props.onKeyDown(e)) {
            return;
        }
        if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (['SELECT', 'TEXTAREA'].includes(target?.nodeName)) return;
            if (['INPUT', 'TEXTAREA'].includes(target?.nodeName)) target?.blur();
            e.preventDefault();
            e.stopImmediatePropagation();
            onSubmit(true);
        } else if (e.key === 'Escape') {
            onSubmit(false);
        }
    };

    const onPointerMove = (e: PointerEvent) => {
        if (!isDragging()) return;

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;

        const rect = dialogContainerRef.getBoundingClientRect();

        const minLeft = 0;
        const minTop = 0;
        const maxLeft = window.innerWidth - rect.width;
        const maxTop = window.innerHeight - rect.height;

        const left = Math.min(
            maxLeft,
            Math.max(minLeft, startLeft + dx),
        );
        const top = Math.min(
            maxTop,
            Math.max(minTop, startTop + dy),
        );

        dialogContainerRef.style.left = `${left}px`;
        dialogContainerRef.style.top = `${top}px`;
    };

    const endPointerDrag = () => {
        setIsDragging(false);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', endPointerDrag);
        document.removeEventListener('pointercancel', endPointerDrag);
    };

    const onHeaderPointerDown = (e: PointerEvent) => {
        if (!props.options?.movable) return;
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        e.preventDefault();
        const rect = dialogContainerRef.getBoundingClientRect();

        dragStartX = e.clientX;
        dragStartY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        setIsDragging(true);

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', endPointerDrag);
        document.addEventListener('pointercancel', endPointerDrag);
    };

    onMount(() => {
        document.addEventListener('keydown', onKeyDown);
        dialogContainerRef.focus();
        requestAnimationFrame(() => setFade(false));
    });

    onCleanup(() => {
        document.removeEventListener('keydown', onKeyDown);
        endPointerDrag();
    });

    const buttonVariants = {
        danger: 'bg-rose-600 text-white hover:bg-rose-500',
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20',
        secondary:
            'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5',
    };

    return (
        <div
            class='fixed inset-0 flex items-center justify-center'
            style={{ 'z-index': `${1000 + props.index}` }}
        >
            <div
                ref={dialogContainerRef}
                tabIndex={0}
                class={cn(
                    'fixed flex max-h-[90vh] w-full flex-col rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm shadow-2xl outline-none overflow-hidden',
                    'dark:border-white/10 dark:bg-zinc-900/90',
                    isDragging() ? '' : 'transition-all duration-300',
                    fade() ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
                )}
                style={{ 'max-width': resolveWidth(props.options?.width) }}
            >
                {/* Header */}
                <div
                    class={cn(
                        'flex shrink-0 items-center justify-between px-6 py-4 border-b border-zinc-200/80 select-none',
                        'dark:border-white/10',
                        props.options?.movable && 'cursor-move',
                    )}
                    onPointerDown={onHeaderPointerDown}
                >
                    <h3 class='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
                        {props.title}
                    </h3>
                    <button
                        class='flex rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors'
                        onClick={() => onSubmit(false)}
                    >
                        <span class='material-icons-round text-[18px]'>close</span>
                    </button>
                </div>

                {
                    /* Content — the only part that scrolls, so the header and the
                    footer's action buttons stay visible no matter how tall a
                    dialog's content gets (e.g. a long file list). */
                }
                <div class='min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5'>
                    {props.children}
                </div>

                {/* Footer */}
                <div class='flex shrink-0 justify-end gap-3 border-t border-zinc-200/80 px-6 py-4 dark:border-white/10'>
                    <For each={Array.isArray(props.buttons) ? props.buttons : props.buttons?.()}>
                        {(button) => (
                            <button
                                class={cn(
                                    'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                                    buttonVariants[button.type ?? 'primary'],
                                    button.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                                )}
                                disabled={button.disabled}
                                onClick={async () => {
                                    if (button.onClick && !(await button.onClick())) {
                                        return;
                                    }
                                    if (button.options) {
                                        props.done(button.options);
                                    } else {
                                        onSubmit(button.submit);
                                    }
                                }}
                            >
                                <Show when={button.icon}>
                                    <span class='material-icons-round mr-2 text-[16px]'>
                                        {button.icon}
                                    </span>
                                </Show>
                                {t(button.text)}
                            </button>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
};

export default DialogComponent;
