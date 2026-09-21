import { A } from '@solidjs/router';
import { Icon } from '../components/ui';
import { Button } from '../components/ui/Button';

export default function NotFound() {
    return (
        <div class='mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center'>
            <div class='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-lg'>
                <Icon name='error_outline' size={32} />
            </div>
            <h1 class='text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50'>404</h1>
            <p class='mt-2 text-lg font-semibold text-zinc-700 dark:text-zinc-200'>Page not found</p>
            <p class='mt-2 text-sm text-zinc-500'>The page you're looking for doesn't exist or has been moved.</p>
            <div class='mt-6 flex gap-2'>
                <A href='/'>
                    <Button leftIcon='home'>Back to dashboard</Button>
                </A>
                <Button variant='outline' leftIcon='search'>Search</Button>
            </div>
        </div>
    );
}
