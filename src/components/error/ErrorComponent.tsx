// src/components/error/ErrorComponent.tsx
import { Component, For, JSX, Show } from 'solid-js';
import { t } from '../../localization';
import { Card, Icon } from '../ui';
import { Button } from '../ui/Button';

interface Props {
    title?: string;
    body?: string;
    errors?: { key: string; error: any }[];
    showRetry?: boolean;
    onRetry?: () => void;
    render?: () => JSX.Element;
}

const ErrorComponent: Component<Props> = (props) => {
    const handleRetry = () => {
        if (props.onRetry) {
            props.onRetry();
        } else {
            window.location.reload();
        }
    };

    return (
        <Card class='border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20'>
            <div class='flex flex-col items-center justify-center text-center p-4 sm:p-6'>
                <Icon
                    name='error_outline'
                    size={28}
                    class='text-rose-600 dark:text-rose-400 mb-3'
                />

                <div class='max-w-md'>
                    <h3 class='text-sm font-semibold text-rose-800 dark:text-rose-200'>
                        {t(props.title ?? 'mmp_load_error_title')}
                    </h3>

                    <p class='mt-1 text-sm text-rose-700 dark:text-rose-300'>
                        {t(props.body ?? 'mmp_load_error_body')}
                    </p>

                    <Show when={props.errors}>
                        <div class='mt-3 space-y-1'>
                            <For each={props.errors}>
                                {({ key, error }) => (
                                    <div class='text-xs text-rose-600 dark:text-rose-400'>
                                        <span class='font-medium'>{key}:</span>{' '}
                                        {error instanceof Error ? error.message : String(error)}
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                    <Show when={props.render}>
                        {props.render?.()}
                    </Show>
                    <Show when={props.showRetry !== false}>
                        <Button
                            variant='outline'
                            leftIcon='refresh'
                            class='mt-4'
                            onClick={handleRetry}
                        >
                            {t('mmp_action_retry')}
                        </Button>
                    </Show>
                </div>
            </div>
        </Card>
    );
};

export default ErrorComponent;
