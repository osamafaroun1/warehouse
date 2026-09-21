// src/components/error/ErrorFallback.tsx
import { t } from '../../localization';
import { Icon } from '../ui';
import { Button } from '../ui/Button';

interface ErrorFallbackProps {
    error: Error;
    reset: () => void;
}

export function ErrorFallback(props: ErrorFallbackProps) {
    return (
        <div class='flex min-h-screen flex-col items-center justify-center p-6 text-center'>
            <div class='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600'>
                <Icon name='error_outline' size={32} />
            </div>

            <h1 class='text-2xl font-bold text-zinc-900 dark:text-zinc-50'>
                {t('mmp_error_something_went_wrong')}
            </h1>

            <p class='mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400'>
                {props.error.message || t('mmp_error_unexpected')}
            </p>

            <div class='mt-6 flex gap-2'>
                <Button
                    leftIcon='refresh'
                    onClick={() => {
                        props.reset();
                        window.location.reload();
                    }}
                >
                    {t('mmp_error_reload_page')}
                </Button>

                <Button
                    variant='outline'
                    leftIcon='home'
                    onClick={() => {
                        props.reset();
                        window.location.href = '/';
                    }}
                >
                    {t('mmp_error_go_home')}
                </Button>
            </div>
        </div>
    );
}
