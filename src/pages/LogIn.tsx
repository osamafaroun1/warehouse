import { useNavigate } from '@solidjs/router';
import { createSignal, Show } from 'solid-js';
import { getApiErrorMessage, isApiError } from '../api/api';
import { login } from '../api/auth';
import { Card, Icon } from '../components/ui';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthContext } from '../context/AuthContext';
import { t } from '../localization';
import { ToastMessage } from '../utils/ToastMessage';

export default function LogIn() {
    const { setAuthenticatedUser } = useAuthContext();

    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [fieldErrors, setFieldErrors] = createSignal<Record<string, string>>({});
    const [formError, setFormError] = createSignal<string | null>(null);

    const [show, setShow] = createSignal(false);
    const [loading, setLoading] = createSignal(false);
    const navigate = useNavigate();

    const onSubmit = async (e: Event) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({});
        setFormError(null);

        try {
            const res = await login({
                email: email().trim(),
                password: password(),
            });
            if (isApiError(res)) {
                const issues = res.issues ?? res.details?.issues ?? [];

                if (issues.length > 0) {
                    const nextErrors: Record<string, string> = {};

                    for (const issue of issues) {
                        nextErrors[issue.path] = issue.message;
                    }

                    setFieldErrors(nextErrors);
                } else {
                    const message = getApiErrorMessage(res);
                    setFormError(message);
                    ToastMessage.error(message);
                }
                return;
            }

            setTimeout(() => {
                ToastMessage.success(
                    t('mmp_login_welcome_back', { name: res.user.username }),
                );
            }, 1000);
            if (res.user) {
                setAuthenticatedUser(res.user);
            }
            navigate('/');
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : t('mmp_login_generic_error');

            setFormError(message);
            ToastMessage.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class='flex min-h-screen items-stretch'>
            {/* Left panel */}
            <div class='hidden flex-1 flex-col justify-between bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex'>
                <div class='flex items-center gap-2.5'>
                    <div class='flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur'>
                        <Icon name='bolt' size={20} />
                    </div>
                    <span class='text-lg font-bold'>المستودع</span>
                </div>
                <div>
                    <h2 class='max-w-md text-4xl font-bold leading-tight'>
                        {t('mmp_login_hero_title')}
                    </h2>
                    <p class='mt-4 max-w-md text-white/80'>
                        {t('mmp_login_hero_subtitle')}
                    </p>
                    <div class='mt-8 flex flex-wrap gap-3'>
                        <div class='rounded-lg bg-white/10 px-3 py-2 text-xs backdrop-blur'>
                            {t('mmp_login_badge_soc2')}
                        </div>
                        <div class='rounded-lg bg-white/10 px-3 py-2 text-xs backdrop-blur'>
                            {t('mmp_login_badge_sso')}
                        </div>
                        <div class='rounded-lg bg-white/10 px-3 py-2 text-xs backdrop-blur'>
                            {t('mmp_login_badge_uptime')}
                        </div>
                    </div>
                </div>
                <p class='text-xs text-white/60'>{t('mmp_login_copyright')}</p>
            </div>

            {/* Form */}
            <div class='flex w-full items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950 lg:w-[520px]'>
                <Card class='w-full max-w-sm p-8'>
                    <div class='mb-6'>
                        <h1 class='text-2xl font-bold text-zinc-900 dark:text-zinc-50'>
                            {t('mmp_login_welcome_title')}
                        </h1>
                        <p class='mt-1 text-sm text-zinc-500'>
                            {t('mmp_login_welcome_subtitle')}
                        </p>
                    </div>

                    <form class='space-y-4' onSubmit={onSubmit}>
                        <Show when={formError()}>
                            <div class='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'>
                                {formError()}
                            </div>
                        </Show>

                        <div>
                            <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                {t('mmp_login_email')}
                            </label>
                            <Input
                                type='email'
                                value={email()}
                                onInput={(e) => {
                                    setEmail(e.currentTarget.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        email: '',
                                    }));
                                }}
                                icon='mail'
                                // required
                            />
                            <Show when={fieldErrors().email}>
                                <p class='mt-1 text-xs text-red-500'>
                                    {fieldErrors().email}
                                </p>
                            </Show>
                        </div>

                        <div>
                            <div class='mb-1.5 flex items-center justify-between'>
                                <label class='block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                    {t('mmp_login_password')}
                                </label>
                                {
                                    /* Reset password — disabled for now
                                <A
                                    href='/reset-password'
                                    class='text-xs font-semibold text-indigo-600 dark:text-indigo-400'
                                >
                                    {t('mmp_login_forgot')}
                                </A>
                                */
                                }
                            </div>
                            <div class='relative'>
                                <Input
                                    type={show() ? 'text' : 'password'}
                                    value={password()}
                                    onInput={(e) => {
                                        setPassword(e.currentTarget.value);
                                        setFieldErrors((prev) => ({
                                            ...prev,
                                            password: '',
                                        }));
                                    }}
                                    icon='lock'
                                    // required
                                />
                                <Button
                                    bare
                                    type='button'
                                    onClick={() => setShow((s) => !s)}
                                    class='absolute end-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                >
                                    <Icon name={show() ? 'visibility_off' : 'visibility'} size={18} />
                                </Button>
                                <Show when={fieldErrors().password}>
                                    <p class='mt-1 text-xs text-red-500'>
                                        {fieldErrors().password}
                                    </p>
                                </Show>
                            </div>
                        </div>

                        <label class='flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400'>
                            <input type='checkbox' class='rounded border-zinc-300' />
                            {t('mmp_login_keep_signed_in')}
                        </label>

                        <Button type='submit' class='w-full' leftIcon='login' disabled={loading()}>
                            <Show when={!loading()} fallback={t('mmp_login_signing_in')}>
                                {t('mmp_login_sign_in')}
                            </Show>
                        </Button>
                    </form>

                    {
                        /* Social / alternative sign-in & trial — disabled for now
                    <div class='my-5 flex items-center gap-3'>
                        <div class='h-px flex-1 bg-zinc-200 dark:bg-white/10' />
                        <span class='text-[10px] font-medium uppercase tracking-wider text-zinc-400'>
                            {t('mmp_login_or_continue')}
                        </span>
                        <div class='h-px flex-1 bg-zinc-200 dark:bg-white/10' />
                    </div>

                    <div class='grid grid-cols-3 gap-2'>
                        <Button variant='outline' class='px-0'>
                            <Icon name='language' />
                        </Button>
                        <Button variant='outline' class='px-0'>
                            <Icon name='mail' />
                        </Button>
                        <Button variant='outline' class='px-0'>
                            <Icon name='fingerprint' />
                        </Button>
                    </div>

                    <p class='mt-6 text-center text-xs text-zinc-500'>
                        {t('mmp_login_no_account')}{' '}
                        <A href='/' class='font-semibold text-indigo-600 dark:text-indigo-400'>
                            {t('mmp_login_start_trial')}
                        </A>
                    </p>
                    */
                    }
                </Card>
            </div>
        </div>
    );
}
