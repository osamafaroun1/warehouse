import { Accessor, Component, createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { cn } from '.';
import { Input } from './Input';

let dropdownInstanceCounter = 0;

const SearchableDropdown: Component<{
    onSelect: (item: any) => void;
    data: Accessor<any[] | undefined>;
    placeholder?: string;
    disabled?: boolean;
    identityKey?: string;
    labelKey: string;
    labelKey2?: string;
    idKey?: string;
    required?: boolean;
    error?: string | null;
    value?: any;
    wrapperClass?: string;
    name?: string;
}> = (props) => {
    const [open, setOpen] = createSignal(false);
    const [query, setQuery] = createSignal('');
    const [selected, setSelected] = createSignal<any>();
    const [touched, setTouched] = createSignal(false);
    const [coords, setCoords] = createSignal({ top: 0, left: 0, width: 0 });

    let wrapperRef: HTMLDivElement | undefined;

    // Cards in this app use `backdrop-blur`, which creates its own stacking
    // context. That traps this dropdown's z-index inside its own Card, so a
    // later sibling Card (e.g. "protection & renewal") paints on top of it
    // regardless of z-index. Rendering the list through a Portal into
    // document.body, positioned via fixed coordinates taken from the
    // input's own bounding box, escapes that trap entirely.
    const updateCoords = () => {
        if (!wrapperRef) return;
        const rect = wrapperRef.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };

    createEffect(() => {
        if (!open()) return;
        updateCoords();

        if (typeof window === 'undefined') return;
        window.addEventListener('scroll', updateCoords, true);
        window.addEventListener('resize', updateCoords);
        onCleanup(() => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        });
    });

    // Each instance gets its own id so the click-outside check below only
    // recognizes *this* dropdown's own wrapper as "inside". Previously every
    // instance shared the same "[data-searchable-dropdown]" selector, so
    // clicking into a *different* SearchableDropdown was still treated as
    // "inside" and this one never closed - leaving multiple dropdown lists
    // open on screen at once (e.g. Category/Language staying open while
    // focusing the Agent field).
    const instanceId = `sdd-${++dropdownInstanceCounter}`;

    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest(`[data-searchable-dropdown="${instanceId}"]`)) {
            setOpen(false);
            if (open()) {
                setTouched(true);
            }
        }
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('click', handleClickOutside);
        onCleanup(() => document.removeEventListener('click', handleClickOutside));
    }

    createEffect(() => {
        if (!props.data()?.length) return;
        if (props.value && typeof props.value === 'string') {
            const find = props.data()?.find((d) => d.id === props.value);
            setSelected(find);
            return;
        }
        if (props.value) {
            setSelected(props.value);
        }
    });

    const displayValue = () => {
        if (!props.value) return '';
        if (selected()) {
            return selected()[props.labelKey];
        }
        return '';
    };

    const filtered = createMemo(() => {
        const q = query().toLowerCase();
        return (props.data() ?? []).filter((item) => {
            const matchesIdentity = props.identityKey
                && String(item[props.identityKey]).toLowerCase().includes(q);

            const matchesLabel = String(item[props.labelKey]).toLowerCase().includes(q);

            const matchesSecondaryLabel = props.labelKey2
                && String(item[props.labelKey2]).toLowerCase().includes(q);

            return (
                matchesIdentity
                || matchesLabel
                || matchesSecondaryLabel
            );
        });
    });

    // Check if field is required and has error
    const hasError = () => {
        if (!props.required) return false;
        if (!touched()) return false;
        return !selected();
    };

    return (
        <div class={cn('relative', props.wrapperClass)} data-searchable-dropdown={instanceId} ref={wrapperRef}>
            <Input
                name={props.name}
                value={open() ? query() : displayValue()}
                placeholder={props.placeholder ?? 'Sök konto...'}
                disabled={props.disabled}
                icon='search'
                class={hasError() ? 'border-red-500 focus:border-red-500' : ''}
                onFocus={() => {
                    setOpen(true);
                    setQuery('');
                }}
                onInput={(e) => {
                    setQuery(e.currentTarget.value);
                    setOpen(true);
                }}
            />
            <Show when={open() && props.data()}>
                <Portal mount={document.body}>
                    <div
                        data-searchable-dropdown={instanceId}
                        class='fixed z-50000 max-h-60 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900'
                        style={{
                            top: `${coords().top}px`,
                            left: `${coords().left}px`,
                            width: `${coords().width}px`,
                        }}
                    >
                        <For each={filtered()}>
                            {(item) => (
                                <button
                                    type='button'
                                    class='flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-white/5'
                                    onClick={() => {
                                        props.onSelect(item);
                                        setSelected(item);
                                        setOpen(false);
                                        setQuery('');
                                        setTouched(true);
                                    }}
                                >
                                    <Show when={props.identityKey}>
                                        <span class='font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400'>
                                            {item[props.identityKey!]}
                                        </span>
                                    </Show>
                                    <span class='flex-1 truncate text-zinc-700 dark:text-zinc-300'>
                                        {item[props.labelKey]}
                                    </span>
                                    <span class='text-[10px] text-zinc-400 truncate max-w-[150px]'>
                                        {item[props.labelKey2 || 'id']}
                                    </span>
                                </button>
                            )}
                        </For>
                    </div>
                </Portal>
            </Show>
            <Show when={hasError()}>
                <p class='mt-1 text-xs text-red-500'>
                    {props.error || 'This field is required'}
                </p>
            </Show>
        </div>
    );
};

export default SearchableDropdown;
