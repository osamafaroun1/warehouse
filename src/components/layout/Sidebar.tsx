// src/components/layout/Sidebar.tsx
import { useLocation, useNavigate } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { useAuthContext } from '../../context/AuthContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { isRtl, t } from '../../localization';
import { cn, Icon } from '../ui';

interface NavItem {
    label: string;
    to: string;
    icon: string;
    badge?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
    fallback?: string;
}

export function Sidebar(props: { collapsed: () => boolean; mobileOpen: () => boolean; onCloseMobile: () => void }) {
    const { user } = useAuthContext();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (to: string) => {
        if (to === '/') return location.pathname === '/';
        return location.pathname.startsWith(to);
    };

    // Tailwind's `lg` breakpoint is 1024px — the collapsed (icons-only) layout
    // only makes sense on desktop widths. Below that, the sidebar is always
    // the full-width mobile drawer, so we must ignore the collapsed flag there
    // or the labels stay hidden while the container renders at full width.
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const isCollapsed = () => props.collapsed() && isDesktop();

    // Dynamic sections with translations
    const sections = (): NavSection[] => [
        {
            title: 'نظرة عامة',
            items: [
                { label: 'الرئيسية', to: '/', icon: 'dashboard' },
            ],
        },
        {
            title: 'المستودع',
            items: [
                { label: 'إدخال منتجات', to: '/warehouse/entry', icon: 'add_box' },
                { label: 'إخراج منتجات', to: '/warehouse/exit', icon: 'outbox' },
                { label: 'مخزون المستودع', to: '/warehouse/stock', icon: 'inventory_2' },
                { label: 'سجل الحركات', to: '/warehouse/history', icon: 'history' },
            ],
        },
        {
            title: 'النظام',
            items: [
                { label: 'الإعدادات', to: '/settings', icon: 'settings' },
            ],
        },
    ];

    // Get user display name
    const userName = () => {
        const currentUser = user();
        if (!currentUser) return 'User';
        return `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.username || 'User';
    };

    const userRole = () => {
        const currentUser = user();
        if (!currentUser) return '';
        return t(`mmp_user_role_${currentUser.role}`) || currentUser.role;
    };

    return (
        <>
            {/* Mobile overlay */}
            <Show when={props.mobileOpen()}>
                <div
                    class='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden'
                    onClick={() => props.onCloseMobile()}
                />
            </Show>

            <aside
                class={cn(
                    'fixed inset-y-0 z-40 flex flex-col bg-white/80 backdrop-blur-xl transition-all duration-200',
                    isRtl() ? 'right-0 border-l' : 'left-0 border-r',
                    'border-zinc-200 dark:border-white/5 dark:bg-zinc-950/70',
                    'lg:translate-x-0',
                    props.mobileOpen() ? 'translate-x-0' : (isRtl() ? 'translate-x-full' : '-translate-x-full'),
                    props.collapsed() ? 'lg:w-[72px]' : 'lg:w-[248px]',
                    'w-[248px]',
                )}
            >
                {/* Logo */}
                <div class='flex h-16 items-center gap-2.5 border-b border-zinc-200 px-5 dark:border-white/5'>
                    <div class='flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'>
                        <Icon name='bolt' size={18} />
                    </div>
                    <Show when={!isCollapsed()}>
                        <div class='flex flex-col'>
                            <span class='text-sm font-bold text-zinc-900 dark:text-zinc-50'>
                                المستودع
                            </span>
                            <span class='text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500'>
                                إدارة المخزون
                            </span>
                        </div>
                    </Show>
                </div>

                {/* Navigation */}
                <nav class='flex-1 overflow-y-auto px-3 py-4'>
                    <For each={sections()}>
                        {(section) => (
                            <div class='mb-5'>
                                <Show when={!isCollapsed()}>
                                    <div class='mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500'>
                                        {section.title}
                                    </div>
                                </Show>
                                <div class='space-y-0.5'>
                                    <For each={section.items}>
                                        {(item) => (
                                            <div
                                                class={cn(
                                                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                                                    isCollapsed() && 'lg:justify-center lg:px-0',
                                                    isActive(item.to)
                                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100',
                                                )}
                                                onClick={() => {
                                                    navigate(item.to);
                                                    props.onCloseMobile();
                                                }}
                                            >
                                                <Icon name={item.icon} size={18} />
                                                <Show when={!isCollapsed()}>
                                                    <span class='flex-1'>{item.label}</span>
                                                    <Show when={item.badge}>
                                                        <span
                                                            class={cn(
                                                                'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                                                                isActive(item.to)
                                                                    ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                                                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                                                            )}
                                                        >
                                                            {item.badge}
                                                        </span>
                                                    </Show>
                                                </Show>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        )}
                    </For>
                </nav>

                {/* Footer - User info */}
                <div class='border-t border-zinc-200 p-3 dark:border-white/5'>
                    <Show
                        when={!isCollapsed()}
                        fallback={
                            <div class='flex justify-center'>
                                <div class='flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white'>
                                    {userName().charAt(0).toUpperCase()}
                                </div>
                            </div>
                        }
                    >
                        <div class='flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-white/5'>
                            <div class='flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white'>
                                {userName().charAt(0).toUpperCase()}
                            </div>
                            <div class='flex-1 overflow-hidden'>
                                <div class='truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100'>
                                    {userName()}
                                </div>
                                <div class='truncate text-[10px] text-zinc-500'>
                                    {userRole()}
                                </div>
                            </div>
                            <Icon name='more_horiz' size={16} class='text-zinc-400' />
                        </div>
                    </Show>
                </div>
            </aside>
        </>
    );
}
