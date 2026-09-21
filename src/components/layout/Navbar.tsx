// src/components/layout/Navbar.tsx
import { useNavigate } from '@solidjs/router';
import { Show } from 'solid-js';
import { useAuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { changeLocale, isRtl, locale, t } from '../../localization';
import { Avatar, Icon } from '../ui';
import { Dropdown, DropdownItem } from '../ui/Dropdown';

export function Navbar(props: { onToggleSidebar: () => void; onOpenMobile: () => void }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, handleLogout } = useAuthContext();


    const toggleLanguage = () => {
        changeLocale(locale() === 'en' ? 'ar' : 'en');
    };

    const ChevronIcon = () => (
        <Icon
            name={isRtl() ? 'chevron_left' : 'chevron_right'}
            size={14}
            class='text-zinc-400'
        />
    );

    return (
        <header class='sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/70 px-4 backdrop-blur-xl dark:border-white/5 dark:bg-zinc-950/60 md:px-6'>
            {/* Mobile toggle */}
            <button
                onClick={() => props.onOpenMobile()}
                class='rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 lg:hidden'
            >
                <Icon name='menu' size={20} />
            </button>

            {/* Desktop collapse toggle */}
            <button
                onClick={() => props.onToggleSidebar()}
                class='hidden rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 lg:inline-flex'
            >
                <Icon name='menu_open' size={20} />
            </button>

            {/* Breadcrumb */}
            <div class='hidden items-center gap-2 text-sm md:flex'>
                <span class='text-zinc-500 dark:text-zinc-500'>{t('mmp_nav_workspace')}</span>
                <ChevronIcon />
                <span class='font-medium text-zinc-900 dark:text-zinc-100'>{t('mmp_nav_dashboard')}</span>
            </div>
            {/* Right-aligned group */}
            <div class='ms-auto flex items-center gap-2'>
                {/* Search trigger */}
                <div class='hidden md:block'>
                    <div
                        class='flex h-9 w-64 cursor-pointer items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900/60'
                    >
                        <Icon name='search' size={18} class='shrink-0' />
                        <span class='flex-1 px-2'>{t('mmp_nav_search_placeholder_short')}</span>
                        <span class='flex shrink-0 items-center gap-0.5 text-[10px] text-zinc-400'>
                            <kbd class='rounded bg-zinc-100 px-1 dark:bg-white/10'>Ctrl</kbd>
                            <kbd class='rounded bg-zinc-100 px-1 dark:bg-white/10'>K</kbd>
                        </span>
                    </div>
                </div>

                {/* Language toggle */}
                <button
                    onClick={toggleLanguage}
                    class='flex items-center gap-1 rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
                    aria-label={t('mmp_nav_switch_language')}
                >
                    <Icon name='language' size={20} />
                    <span class='text-xs font-medium uppercase'>
                        {locale() === 'en' ? 'AR' : 'EN'}
                    </span>
                </button>

                {/* Theme toggle */}
                <button
                    onClick={theme.toggle}
                    class='flex rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
                    aria-label={t('mmp_nav_toggle_theme')}
                >
                    <Icon name={theme.theme() === 'dark' ? 'light_mode' : 'dark_mode'} size={20} />
                </button>

                {/* Profile dropdown */}
                <Show when={user()}>
                    {(user) => (
                        <Dropdown
                            align={isRtl() ? 'left' : 'right'}
                            trigger={
                                <button class='flex items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-white/5'>
                                    <Avatar name={user().firstName} size={32} />
                                    <div class='hidden text-left md:block'>
                                        <div class='text-xs font-semibold text-zinc-900 dark:text-zinc-100'>
                                            {user().firstName}
                                        </div>
                                        <div class='text-[10px] text-zinc-500'>{user().role}</div>
                                    </div>
                                </button>
                            }
                        >
                            <DropdownItem
                                icon='person'
                                onClick={() => navigate('/settings')}
                            >
                                {t('mmp_nav_profile')}
                            </DropdownItem>
                            <div class='my-1 h-px bg-zinc-100 dark:bg-white/5' />
                            <DropdownItem icon='logout' danger onClick={handleLogout}>
                                {t('mmp_nav_sign_out')}
                            </DropdownItem>
                        </Dropdown>
                    )}
                </Show>
            </div>
        </header>
    );
}
