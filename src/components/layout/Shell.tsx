// src/components/layout/Shell.tsx
import { createSignal, ErrorBoundary, type ParentProps } from 'solid-js';
import { isRtl } from '../../localization';
import DialogHost from '../dialog/DialogHost';
import { cn } from '../ui';
import { ErrorFallback } from './ErrorFallback';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastHost } from './ToastHost';

export default function Shell(props: ParentProps) {
    const [collapsed, setCollapsed] = createSignal(false);
    const [mobileOpen, setMobileOpen] = createSignal(false);

    return (
        <ErrorBoundary
            fallback={(error, reset) => (
                <ErrorFallback
                    error={error}
                    reset={reset}
                />
            )}
        >
            <div class='flex h-screen overflow-hidden'>
                <Sidebar
                    collapsed={collapsed}
                    mobileOpen={mobileOpen}
                    onCloseMobile={() => setMobileOpen(false)}
                />

                <div
                    class={cn(
                        'flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-200',
                        isRtl()
                            ? (collapsed() ? 'lg:pr-[72px]' : 'lg:pr-[248px]')
                            : (collapsed() ? 'lg:pl-[72px]' : 'lg:pl-[248px]'),
                    )}
                >
                    <Navbar
                        onToggleSidebar={() => setCollapsed(c => !c)}
                        onOpenMobile={() => setMobileOpen(true)}
                    />

                    <main class='min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8'>
                        {props.children}
                    </main>
                </div>

                <DialogHost />
                <ToastHost />
            </div>
        </ErrorBoundary>
    );
}
