import { A, useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import { Card, Icon } from '../components/ui';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ToastMessage } from '../utils/ToastMessage';

export default function ResetPassword() {
    const [step, setStep] = createSignal<1 | 2 | 3>(1);
    const [email, setEmail] = createSignal('');
    const [code, setCode] = createSignal(['', '', '', '', '', '']);
    const [pw, setPw] = createSignal('');
    const [confirm, setConfirm] = createSignal('');
    const nav = useNavigate();

    const updateCode = (i: number, v: string) => {
        const next = [...code()];
        next[i] = v.slice(-1);
        setCode(next);
        if (v && i < 5) {
            const el = document.getElementById(`pin-${i + 1}`);
            el?.focus();
        }
    };

    return (
        <div class='flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950'>
            <Card class='w-full max-w-md p-8'>
                <div class='mb-6 text-center'>
                    <div class='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg'>
                        <Icon name='lock_reset' size={22} />
                    </div>
                    <h1 class='text-xl font-bold text-zinc-900 dark:text-zinc-50'>Reset your password</h1>
                    <p class='mt-1 text-sm text-zinc-500'>
                        {step() === 1 && 'Enter your email to receive a verification code'}
                        {step() === 2 && 'Enter the 6-digit code sent to your email'}
                        {step() === 3 && 'Create a new secure password'}
                    </p>
                </div>

                <Show when={step() === 1}>
                    <form
                        class='space-y-4'
                        onSubmit={(e) => {
                            e.preventDefault();
                            setStep(2);
                            ToastMessage.info('Code sent to your email');
                        }}
                    >
                        <div>
                            <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                Email address
                            </label>
                            <Input
                                type='email'
                                value={email()}
                                onInput={(e) => setEmail(e.currentTarget.value)}
                                icon='mail'
                                placeholder='you@company.com'
                            />
                        </div>
                        <Button type='submit' class='w-full'>Send verification code</Button>
                    </form>
                </Show>

                <Show when={step() === 2}>
                    <div class='space-y-4'>
                        <div class='flex justify-center gap-2'>
                            <For each={[0, 1, 2, 3, 4, 5]}>
                                {(i) => (
                                    <input
                                        id={`pin-${i}`}
                                        inputMode='numeric'
                                        maxlength={1}
                                        value={code()[i]}
                                        onInput={(e) => updateCode(i, e.currentTarget.value)}
                                        class='h-12 w-10 rounded-lg border border-zinc-200 bg-white text-center text-lg font-semibold text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100'
                                    />
                                )}
                            </For>
                        </div>
                        <Button class='w-full' onClick={() => setStep(3)}>Verify code</Button>
                        <p class='text-center text-xs text-zinc-500'>
                            Didn't receive?{' '}
                            <button class='font-semibold text-indigo-600 dark:text-indigo-400'>Resend code</button>
                        </p>
                    </div>
                </Show>

                <Show when={step() === 3}>
                    <form
                        class='space-y-4'
                        onSubmit={(e) => {
                            e.preventDefault();
                            ToastMessage.success('Password updated');
                            nav('/login');
                        }}
                    >
                        <div>
                            <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                New password
                            </label>
                            <Input
                                type='password'
                                value={pw()}
                                onInput={(e) => setPw(e.currentTarget.value)}
                                icon='lock'
                            />
                        </div>
                        <div>
                            <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                Confirm password
                            </label>
                            <Input
                                type='password'
                                value={confirm()}
                                onInput={(e) => setConfirm(e.currentTarget.value)}
                                icon='lock'
                            />
                        </div>
                        <Button type='submit' class='w-full'>Update password</Button>
                    </form>
                </Show>

                <div class='mt-6 text-center'>
                    <A href='/login' class='text-xs font-semibold text-indigo-600 dark:text-indigo-400'>
                        ← Back to sign in
                    </A>
                </div>
            </Card>
        </div>
    );
}
