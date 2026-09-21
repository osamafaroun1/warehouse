import { createSignal, JSX, onCleanup, onMount, ParentComponent, ParentProps, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { cn, Icon } from '.';

export const DropdownItem: ParentComponent<{
    onClick?: () => Promise<void> | void;
    icon?: string;
    danger?: boolean;
}> = (props) => {
    return (
        <button
            type='button'
            onClick={() => props.onClick?.()}
            class={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm',
                props.danger
                    ? 'text-rose-600 hover:bg-rose-500/10'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5',
            )}
        >
            <Show when={props.icon}>
                <Icon name={props.icon!} size={16} />
            </Show>

            {props.children}
        </button>
    );
};

const VIEWPORT_MARGIN = 8;

export function Dropdown(props: ParentProps<{ trigger: JSX.Element; align?: 'left' | 'right'; class?: string }>) {
    const [open, setOpen] = createSignal(false);
    let ref: HTMLDivElement | undefined;
    let triggerRef: HTMLDivElement | undefined;
    let panelRef: HTMLDivElement | undefined;
    const [position, setPosition] = createSignal({ top: 0, left: 0 });

    const onDoc = (e: MouseEvent) => {
        if (!ref?.contains(e.target as Node) && !panelRef?.contains(e.target as Node)) setOpen(false);
    };

    const updatePosition = () => {
        if (!triggerRef) return;
        const rect = triggerRef.getBoundingClientRect();
        // Fall back to the trigger's own width for the first frame (before
        // the panel has rendered and we can measure its real size).
        const panelWidth = panelRef?.offsetWidth || rect.width || 192;
        const panelHeight = panelRef?.offsetHeight || 0;

        // Prefer opening below the trigger, but flip above it if there
        // isn't enough room left in the viewport.
        const spaceBelow = window.innerHeight - rect.bottom;
        const openAbove = panelHeight > 0 && spaceBelow < panelHeight + VIEWPORT_MARGIN
            && rect.top > spaceBelow;
        const top = openAbove ? rect.top - panelHeight - 4 : rect.bottom + 4;

        const desiredLeft = props.align === 'right' ? rect.right - panelWidth : rect.left;
        const maxLeft = window.innerWidth - panelWidth - VIEWPORT_MARGIN;
        const left = Math.min(Math.max(desiredLeft, VIEWPORT_MARGIN), Math.max(maxLeft, VIEWPORT_MARGIN));
        const clampedTop = Math.min(
            Math.max(top, VIEWPORT_MARGIN),
            Math.max(window.innerHeight - VIEWPORT_MARGIN, VIEWPORT_MARGIN),
        );

        setPosition({ top: clampedTop, left });
    };

    const handleScroll = () => {
        if (open()) {
            updatePosition();
        }
    };

    onMount(() => {
        document.addEventListener('click', onDoc);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
    });

    onCleanup(() => {
        document.removeEventListener('click', onDoc);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
    });

    const toggleOpen = (e: MouseEvent) => {
        e.stopPropagation();
        const newOpen = !open();
        setOpen(newOpen);
        if (newOpen) {
            // First pass with an estimate, then a second pass once the
            // panel has actually rendered so we can measure its real
            // width/height and re-clamp against the true content size.
            updatePosition();
            requestAnimationFrame(() => {
                updatePosition();
            });
        }
    };

    return (
        <div ref={ref} class={cn('relative inline-block', props.class)}>
            <div
                ref={triggerRef}
                onClick={toggleOpen}
            >
                {props.trigger}
            </div>
            <Show when={open()}>
                <Portal>
                    <div
                        ref={panelRef}
                        class={cn(
                            'fixed z-9999 min-w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg',
                            'dark:border-white/10 dark:bg-zinc-900',
                        )}
                        style={{
                            top: position().top + 'px',
                            left: position().left + 'px',
                            'max-height': `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
                        }}
                        onClick={() => setOpen(false)}
                    >
                        {props.children}
                    </div>
                </Portal>
            </Show>
        </div>
    );
}
