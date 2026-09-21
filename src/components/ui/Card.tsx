import { createEffect, onCleanup, ParentComponent, Show } from 'solid-js';
import { t } from '../../localization';
import { cn } from '.';

type CardProps = {
    class?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    maxHeight?: string;
};

type CardSectionProps = {
    class?: string;
};

type CardBodyProps = CardSectionProps & {
    scroll?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';

    loading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void | Promise<void>;
};

const CardRoot: ParentComponent<CardProps> = (props) => {
    return (
        <div
            class={cn(
                'flex flex-col rounded-xl border border-zinc-200/80 bg-white/80 backdrop-blur-sm',
                'dark:border-white/10 dark:bg-zinc-900/60',
                props.class,
            )}
            style={props.maxHeight ? { 'max-height': props.maxHeight } : undefined}
        >
            {props.children}
        </div>
    );
};

const Header: ParentComponent<CardSectionProps> = (props) => (
    <div
        class={cn(
            'shrink-0 border-b border-zinc-200 p-4 dark:border-white/10',
            props.class,
        )}
    >
        {props.children}
    </div>
);

const Body: ParentComponent<CardBodyProps> = (props) => {
    let bodyRef: HTMLDivElement | undefined;
    let sentinelRef: HTMLDivElement | undefined;

    const pad = () => {
        if (!props.padding) return '';

        return {
            none: '',
            sm: 'p-4',
            md: 'p-5',
            lg: 'p-6',
        }[props.padding];
    };

    createEffect(() => {
        if (!props.scroll || !props.onLoadMore || !bodyRef || !sentinelRef) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting
                    && props.hasMore
                    && !props.loading
                ) {
                    void props.onLoadMore?.();
                }
            },
            {
                root: bodyRef,
                rootMargin: '100px',
            },
        );

        observer.observe(sentinelRef);

        onCleanup(() => observer.disconnect());
    });

    return (
        <div
            ref={bodyRef}
            class={cn(
                'min-h-0 flex-1 divide-y divide-zinc-200 dark:divide-white/10',
                props.scroll && 'overflow-y-auto',
                pad(),
                props.class,
            )}
        >
            {props.children}

            <Show when={props.loading}>
                <div class='flex justify-center p-4 rounded-xl text-sm text-zinc-500'>
                    {t('mmp_loading')}
                </div>
            </Show>

            <Show when={props.hasMore}>
                <div ref={sentinelRef} />
            </Show>
        </div>
    );
};
export const Card = Object.assign(CardRoot, {
    Header,
    Body,
});
