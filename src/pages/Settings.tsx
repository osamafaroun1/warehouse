import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import type { Attachment, User } from '../../shared/shared-types';
import {
    deleteAttachment,
    getAttachmentPreviewBlobUrl,
    getAttachments,
    uploadAttachments,
} from '../api/attachment.api';
import {
    changeMyPassword,
    createUser,
    deleteUser,
    updateMyProfile,
    updateUser as updateUserApi,
} from '../api/user.api';
import createChangePasswordDialog from '../components/dialog/ChangePasswordDialog';
import { showConfirmDialog } from '../components/dialog/ConfirmDialog';
import createNewUserDialog from '../components/dialog/NewUserDialog';
import { Avatar, Badge, Card, Icon, Table, Tabs } from '../components/ui';
import { Button } from '../components/ui/Button';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Input } from '../components/ui/Input';
import { useAuthContext } from '../context/AuthContext';
import { t } from '../localization';
import {
    clearCached,
    getCached,
    setCached,
    updateCached,
    useWorkspaceResources,
} from '../services/useWorkspaceResources';
import { formatDate, formatLabel } from '../utils/functions';
import { ToastMessage } from '../utils/ToastMessage';
import { isValidEmail } from '../utils/validation';

type SettingsTab = 'account' | 'users';

export default function Settings() {
    const { user, isAdmin, setAuthenticatedUser } = useAuthContext();

    const [tab, setTab] = createSignal<SettingsTab>('account');

    // "users" tab only ever appears for admins/owners — a regular user only
    // ever sees their own Account.
    const tabs = createMemo(() => [
        { key: 'account' as const, label: t('mmp_settings_tab_account'), icon: 'person' },
        ...(isAdmin() ? [{ key: 'users' as const, label: t('mmp_settings_tab_users'), icon: 'group' }] : []),
    ]);

    const [profile, setProfile] = createSignal({
        name: `${user()?.firstName ?? ''} ${user()?.lastName ?? ''}`.trim(),
        email: user()?.email ?? '',
        phone: user()?.phone ?? '',
        role: formatLabel(user()?.role),
    });

    const [savingProfile, setSavingProfile] = createSignal(false);

    // Avatar attachment (stored as a normal attachment linked to the
    // current user; the most recently uploaded one is treated as "the"
    // avatar). We keep the attachment row and the object URL used to
    // render it separately so we can revoke the blob URL on cleanup/replace.
    const [avatarAttachment, setAvatarAttachment] = createSignal<Attachment>();
    const [avatarUrl, setAvatarUrl] = createSignal<string>();
    const [avatarLoading, setAvatarLoading] = createSignal(false);

    const revokeAvatarUrl = () => {
        const url = avatarUrl();
        if (url) URL.revokeObjectURL(url);
    };

    onMount(async () => {
        const userId = user()?.id;
        if (!userId) return;

        try {
            const attachments = await getAttachments({ userId });
            const latest = attachments[0];
            if (!latest) return;

            setAvatarAttachment(latest);
            const blobUrl = await getAttachmentPreviewBlobUrl(latest.id);
            revokeAvatarUrl();
            setAvatarUrl(blobUrl);
        } catch {
            // Silently ignore — the account still works fine without an avatar.
        }
    });

    onCleanup(revokeAvatarUrl);

    const onUploadAvatar = async (files: FileList) => {
        const userId = user()?.id;
        const file = files?.[0];
        if (!userId || !file) return;

        setAvatarLoading(true);
        try {
            const [uploaded] = await uploadAttachments([file], { userId });

            // Only keep one avatar per user — clean up the previous
            // attachment (if any) now that the new one is in place.
            const previous = avatarAttachment();

            setAvatarAttachment(uploaded);
            const blobUrl = await getAttachmentPreviewBlobUrl(uploaded.id);
            revokeAvatarUrl();
            setAvatarUrl(blobUrl);

            if (previous) {
                await deleteAttachment(previous.id).catch(() => {});
            }

            // Files page caches attachments per owner/type — drop it so it
            // refetches instead of showing a stale (pre-upload) snapshot.
            clearCached('attachmentsByOwner');

            ToastMessage.success(t('mmp_settings_avatar_upload_success'));
        } catch (err) {
            ToastMessage.error(err instanceof Error ? err.message : t('mmp_settings_avatar_upload_error'));
        } finally {
            setAvatarLoading(false);
        }
    };

    const onRemoveAvatar = async () => {
        const current = avatarAttachment();
        if (!current) return;

        setAvatarLoading(true);
        try {
            await deleteAttachment(current.id);
            revokeAvatarUrl();
            setAvatarAttachment(undefined);
            setAvatarUrl(undefined);
            clearCached('attachmentsByOwner');
            ToastMessage.success(t('mmp_settings_avatar_remove_success'));
        } catch (err) {
            ToastMessage.error(err instanceof Error ? err.message : t('mmp_settings_avatar_remove_error'));
        } finally {
            setAvatarLoading(false);
        }
    };

    // Lifted here (rather than inside UsersPanel) purely so the "New user"
    // button can sit in the same flex row as the tabs and be pushed to the
    // far end with justify-between.
    const isOwner = () => user()?.role === 'owner';

    const onNewUser = () => {
        createNewUserDialog({ allowOwnerRole: isOwner() }, async (changes) => {
            if (!changes.firstName?.trim() || !changes.email?.trim() || !changes.password) return;

            try {
                const created = await createUser({
                    firstName: changes.firstName,
                    lastName: changes.lastName ?? '',
                    username: changes.username ?? changes.email.split('@')[0],
                    email: changes.email,
                    phone: changes.phone ?? null,
                    role: changes.role ?? 'user',
                    isActive: changes.isActive ?? true,
                    password: changes.password,
                });

                // updateCached notifies every mounted `users` subscriber
                // (including UsersPanel's own separate resource instance
                // below) — unlike the old per-instance refetch(), which only
                // ever refetched *this* hook call's local copy and left the
                // table showing stale data until a manual page refresh.
                updateCached<User[]>('users', (current) => [created, ...(current ?? [])]);
                ToastMessage.success(t('mmp_user_created_success'));
            } catch (err) {
                ToastMessage.error(err instanceof Error ? err.message : t('mmp_user_create_error'));
            }
        });
    };

    const saveProfile = async () => {
        const current = profile();

        if (!current.name.trim()) {
            ToastMessage.warning(t('mmp_error_first_name_required'));
            return;
        }

        if (!isValidEmail(current.email)) {
            ToastMessage.warning(t('mmp_error_email_invalid'));
            return;
        }

        // The form only exposes a single "full name" field, so split it back
        // into first/last name the same way the account was created with.
        // Falls back to the existing value on either side if only one word
        // is given, so a single-word edit never wipes out the other half.
        const parts = current.name.trim().split(/\s+/);
        const firstName = parts[0] || user()?.firstName || '';
        const lastName = parts.slice(1).join(' ') || user()?.lastName || firstName;

        setSavingProfile(true);
        try {
            const updated = await updateMyProfile({
                firstName,
                lastName,
                email: current.email.trim(),
                phone: current.phone.trim() || null,
            });

            setAuthenticatedUser({ ...user(), ...updated });
            // The signed-in user may also be a row in the admin's Users
            // table (e.g. an owner editing their own profile) — patch that
            // cache too so it doesn't show stale data until a refresh.
            updateCached<User[]>('users', (list) => list?.map((u) => u.id === updated.id ? { ...u, ...updated } : u));
            ToastMessage.success(t('mmp_settings_profile_saved'));
        } catch (err) {
            ToastMessage.error(err instanceof Error ? err.message : t('mmp_settings_profile_error'));
        } finally {
            setSavingProfile(false);
        }
    };

    const onChangePassword = () => {
        createChangePasswordDialog(async (changes) => {
            if (!changes.currentPassword || !changes.newPassword) return;

            try {
                await changeMyPassword({
                    currentPassword: changes.currentPassword,
                    newPassword: changes.newPassword,
                });
                ToastMessage.success(t('mmp_settings_password_success'));
            } catch (err) {
                const message = err instanceof Error ? err.message : '';
                if (message.toLowerCase().includes('incorrect')) {
                    ToastMessage.error(t('mmp_settings_password_error_current'));
                } else {
                    ToastMessage.error(message || t('mmp_settings_password_error_generic'));
                }
            }
        });
    };

    return (
        <div class='mx-auto max-w-5xl space-y-6 animate-fade-up'>
            <div>
                <h1 class='text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50'>
                    {t('mmp_settings_title')}
                </h1>
                <p class='mt-1 text-sm text-zinc-500'>{t('mmp_settings_subtitle')}</p>
            </div>

            {
                /*
                Tabs and "New user" now share one flex row with justify-between,
                so the button always sits pinned to the far end regardless of
                how many tabs are showing.
            */
            }
            <div class='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <Show when={tabs().length > 1}>
                    <Tabs
                        tabs={tabs()}
                        value={tab}
                        onChange={(v) => setTab(v as SettingsTab)}
                    />
                </Show>

                <Show when={tab() === 'users' && isAdmin()}>
                    <Button leftIcon='add' onClick={onNewUser}>
                        {t('mmp_new_user')}
                    </Button>
                </Show>
            </div>

            <Show when={tab() === 'account'}>
                <div class='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                    <Card class='lg:col-span-2'>
                        <h3 class='mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                            {t('mmp_settings_profile_title')}
                        </h3>
                        <div class='grid grid-cols-1 gap-4 md:grid-cols-2'>
                            <div>
                                <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                    {t('mmp_settings_full_name')}
                                </label>
                                <Input
                                    value={profile().name}
                                    onInput={(e) => setProfile((p) => ({ ...p, name: e.currentTarget.value }))}
                                />
                            </div>
                            <div>
                                <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                    {t('mmp_settings_email')}
                                </label>
                                <Input
                                    type='email'
                                    value={profile().email}
                                    onInput={(e) => setProfile((p) => ({ ...p, email: e.currentTarget.value }))}
                                />
                            </div>
                            <div>
                                <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                    {t('mmp_settings_phone')}
                                </label>
                                <Input
                                    value={profile().phone}
                                    onInput={(e) => setProfile((p) => ({ ...p, phone: e.currentTarget.value }))}
                                />
                            </div>
                            <div>
                                <label class='mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
                                    {t('mmp_settings_role')}
                                </label>
                                <Input value={profile().role} disabled />
                            </div>
                        </div>
                        <div class='mt-4 flex justify-end gap-2'>
                            <Button variant='outline' leftIcon='lock_reset' onClick={onChangePassword}>
                                {t('mmp_settings_change_password')}
                            </Button>
                            <Button
                                leftIcon='save'
                                onClick={saveProfile}
                                loading={savingProfile()}
                                loadingText={t('mmp_saving')}
                            >
                                {t('mmp_settings_save_changes')}
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <h3 class='mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                            {t('mmp_settings_avatar_title')}
                        </h3>
                        <div class='flex flex-col items-center text-center'>
                            <Avatar name={profile().name || '—'} src={avatarUrl()} size={96} />
                            <p class='mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100'>{profile().name}</p>
                            <p class='text-xs text-zinc-500'>{profile().email}</p>
                            <div class='mt-4 flex gap-2'>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    leftIcon='upload_file'
                                    accept='image/*'
                                    onFileSelect={onUploadAvatar}
                                    loading={avatarLoading()}
                                    disabled={avatarLoading()}
                                >
                                    {t('mmp_settings_upload')}
                                </Button>
                                <Show when={avatarAttachment()}>
                                    <Button
                                        size='sm'
                                        variant='ghost'
                                        leftIcon='delete'
                                        onClick={onRemoveAvatar}
                                        disabled={avatarLoading()}
                                    >
                                        {t('mmp_settings_remove')}
                                    </Button>
                                </Show>
                            </div>
                        </div>
                    </Card>
                </div>
            </Show>

            {/* Never rendered/mounted for non-admins, so the users list is never fetched for them */}
            <Show when={tab() === 'users' && isAdmin()}>
                <UsersPanel />
            </Show>
        </div>
    );
}

/**
 * Real workspace users list — only ever mounted for admins/owners (see the
 * <Show when={tab() === 'users' && isAdmin()}> guard above), so a regular
 * user's browser never even requests this data.
 */
function UsersPanel() {
    const { user: currentUser, isAdmin } = useAuthContext();
    const { resources, loading, hasError } = useWorkspaceResources(['users']);
    const [search, setSearch] = createSignal('');

    const isOwner = () => currentUser()?.role === 'owner';

    // Admins and owners can edit/delete regular users and admins (the
    // backend's PATCH/DELETE /users/:id routes require admin-or-higher via
    // requireRole('admin')). An owner account itself is protected: only
    // another owner may edit or delete it — the backend enforces this too
    // (UserService.assertCanModifyTarget), this just keeps the UI in sync
    // so admins don't see a button that will fail server-side.
    // Never allow managing your own account from this list — the signed-in
    // user is also filtered out of the table below so they can't delete
    // themselves by accident.
    const canManage = (target: User) =>
        isAdmin()
        && target.id !== currentUser()?.id
        && (target.role !== 'owner' || isOwner());

    const filteredUsers = createMemo(() => {
        // Hide the currently signed-in account so it can't be deleted from
        // the users table (profile/password changes live on the Account tab).
        const selfId = currentUser()?.id;
        const list = (resources.users() as User[] | undefined ?? []).filter((u) => u.id !== selfId);
        const q = search().trim().toLowerCase();
        if (!q) return list;

        return list.filter((u) =>
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
            || u.email.toLowerCase().includes(q)
            || u.username.toLowerCase().includes(q)
        );
    });

    const onEditUser = (targetUser: User) => {
        createNewUserDialog({ user: targetUser, allowOwnerRole: isOwner() }, async (changes) => {
            if (!changes.firstName?.trim() || !changes.email?.trim()) return;

            try {
                const previous = getCached('users');
                updateCached('users', (current: User[] | undefined) => {
                    if (!current) return current;
                    return current.map((u) => u.id === targetUser.id ? { ...u, ...changes } : u);
                });

                try {
                    await updateUserApi(targetUser.id, {
                        firstName: changes.firstName,
                        lastName: changes.lastName,
                        username: changes.username,
                        email: changes.email,
                        phone: changes.phone ?? null,
                        role: changes.role,
                        isActive: changes.isActive,
                    });
                    ToastMessage.success(t('mmp_user_updated_success'));
                } catch (err) {
                    setCached('users', previous);
                    throw err;
                }
            } catch (err) {
                ToastMessage.error(err instanceof Error ? err.message : t('mmp_user_update_error'));
            }
        });
    };

    const onDeleteUser = (targetUser: User) => {
        showConfirmDialog({
            itemName: `${targetUser.firstName} ${targetUser.lastName}`.trim(),
            done: async () => {
                try {
                    const previous = getCached('users');
                    updateCached('users', (current: User[] | undefined) => {
                        if (!current) return current;
                        return current.filter((u) => u.id !== targetUser.id);
                    });

                    try {
                        await deleteUser(targetUser.id);
                        ToastMessage.success(t('mmp_user_deleted_success'));
                    } catch (err) {
                        setCached('users', previous);
                        throw err;
                    }
                } catch (err) {
                    ToastMessage.error(err instanceof Error ? err.message : t('mmp_user_delete_error'));
                }
            },
        });
    };

    return (
        <Card padding='none'>
            <div class='flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-white/5 md:flex-row md:items-center md:justify-between'>
                <div>
                    <h3 class='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
                        {t('mmp_settings_users_title')}
                    </h3>
                    <p class='text-xs text-zinc-500'>
                        {t('mmp_settings_users_count', { count: filteredUsers().length })}
                    </p>
                </div>
                <Input
                    icon='search'
                    placeholder={t('mmp_settings_users_search_placeholder')}
                    value={search()}
                    onInput={(e) => setSearch(e.currentTarget.value)}
                    wrapperClass='w-56'
                />
            </div>

            <Show
                when={!loading()}
                fallback={<div class='p-6 text-center text-sm text-zinc-500'>{t('mmp_loading')}</div>}
            >
                <Show
                    when={!hasError()}
                    fallback={
                        <div class='p-6 text-center text-sm text-rose-500'>{t('mmp_settings_users_load_error')}</div>
                    }
                >
                    <Show
                        when={filteredUsers().length > 0}
                        fallback={
                            <div class='p-6 text-center text-sm text-zinc-500'>{t('mmp_settings_users_empty')}</div>
                        }
                    >
                        <Table
                            columns={[
                                {
                                    key: 'name',
                                    header: t('mmp_settings_users_col_user'),
                                    render: (u) => (
                                        <div class='flex items-center gap-3'>
                                            <Avatar
                                                name={`${(u as User).firstName} ${(u as User).lastName}`}
                                                size={32}
                                            />
                                            <div>
                                                <div class='font-medium text-zinc-900 dark:text-zinc-100'>
                                                    {(u as User).firstName} {(u as User).lastName}
                                                </div>
                                                <div class='text-[11px] text-zinc-500'>{(u as User).email}</div>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'role',
                                    header: t('mmp_settings_users_col_role'),
                                    render: (u) => <Badge tone='purple'>{formatLabel((u as User).role)}</Badge>,
                                },
                                {
                                    key: 'status',
                                    header: t('mmp_settings_users_col_status'),
                                    render: (u) => (
                                        <Badge tone={(u as User).isActive ? 'success' : 'default'}>
                                            {(u as User).isActive
                                                ? t('mmp_settings_users_status_active')
                                                : t('mmp_settings_users_status_inactive')}
                                        </Badge>
                                    ),
                                },
                                {
                                    key: 'createdAt',
                                    header: t('mmp_settings_users_col_joined'),
                                    render: (u) => formatDate((u as User).createdAt),
                                },
                                {
                                    key: 'actions',
                                    header: '',
                                    class: 'w-10',
                                    render: (u) => (
                                        <Show when={canManage(u as User)}>
                                            <Dropdown
                                                trigger={
                                                    <button class='rounded p-1'>
                                                        <Icon name='more_vert' size={18} />
                                                    </button>
                                                }
                                                align='right'
                                            >
                                                <DropdownItem icon='edit' onClick={() => onEditUser(u as User)}>
                                                    {t('mmp_action_edit')}
                                                </DropdownItem>
                                                <DropdownItem
                                                    icon='delete'
                                                    danger
                                                    onClick={() => onDeleteUser(u as User)}
                                                >
                                                    {t('mmp_action_delete')}
                                                </DropdownItem>
                                            </Dropdown>
                                        </Show>
                                    ),
                                },
                            ]}
                            rows={filteredUsers()}
                            keyOf={(u) => (u as User).id}
                        />
                    </Show>
                </Show>
            </Show>
        </Card>
    );
}
