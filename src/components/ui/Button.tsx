import { JSX, ParentProps, Show } from 'solid-js';
import { cn, Icon } from '.';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export function Button(
    props: ParentProps<{
        bare?: boolean;
        variant?: ButtonVariant;
        size?: ButtonSize;
        class?: string;
        onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
        type?: 'button' | 'submit' | 'reset';
        disabled?: boolean;
        leftIcon?: string;
        rightIcon?: string;
        loading?: boolean;
        loadingText?: string;
        spinnerPosition?: 'left' | 'right';
        // upload support
        accept?: string;
        multiple?: boolean;
        onFileSelect?: (files: FileList) => void;
    }>,
) {
    let fileInput!: HTMLInputElement;

    const baseClass = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors';

    const variants: Record<ButtonVariant, string> = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20',
        secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
        ghost: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
        outline:
            'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5',
        danger: 'bg-rose-600 text-white hover:bg-rose-500',
    };

    const sizes: Record<ButtonSize, string> = {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9 px-3.5 text-sm gap-2',
        lg: 'h-11 px-5 text-sm gap-2',
    };

    const spinnerSize = () => {
        if (props.size === 'sm') return 'h-3.5 w-3.5';
        if (props.size === 'lg') return 'h-4.5 w-4.5';
        return 'h-4 w-4';
    };

    const isDisabled = () => props.disabled || props.loading;

    const Spinner = () => (
        <span
            class={cn(
                'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
                spinnerSize(),
            )}
            aria-hidden='true'
        />
    );

    return (
        <>
            <Show when={props.onFileSelect}>
                <input
                    ref={fileInput}
                    type='file'
                    class='hidden'
                    accept={props.accept}
                    multiple={props.multiple}
                    onChange={(e) => {
                        const files = e.currentTarget.files;

                        if (files?.length) {
                            props.onFileSelect?.(files);
                        }

                        // Allow selecting the same file again
                        e.currentTarget.value = '';
                    }}
                />
            </Show>

            <button
                type={props.type ?? 'button'}
                disabled={isDisabled()}
                aria-busy={props.loading ? 'true' : undefined}
                onClick={(e) => {
                    if (props.onFileSelect) {
                        fileInput?.click();
                        return;
                    }

                    props.onClick?.(e);
                }}
                class={props.bare
                    ? cn(baseClass, props.class)
                    : cn(
                        baseClass,
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        variants[props.variant ?? 'primary'],
                        sizes[props.size ?? 'md'],
                        props.class,
                    )}
            >
                <Show when={props.loading && props.spinnerPosition === 'left'}>
                    <Spinner />
                </Show>

                <Show when={!props.loading && props.leftIcon}>
                    <Icon
                        name={props.leftIcon!}
                        size={props.size === 'sm' ? 14 : 16}
                    />
                </Show>

                <Show
                    when={props.loading && props.loadingText}
                    fallback={props.children}
                >
                    {props.loadingText}
                </Show>

                <Show when={!props.loading && props.rightIcon}>
                    <Icon
                        name={props.rightIcon!}
                        size={props.size === 'sm' ? 14 : 16}
                    />
                </Show>

                <Show when={props.loading && (props.spinnerPosition ?? 'right') === 'right'}>
                    <Spinner />
                </Show>
            </button>
        </>
    );
}
