import { createEffect, createSignal, onMount, Show } from 'solid-js';
import { User } from '../../../shared/shared-types';
import { t } from '../../localization';
import { DialogViewComponent } from '../../types/types';
import { isValidEmail } from '../../utils/validation';
import { Field } from '../ui';
import { Input } from '../ui/Input';
import Select from '../ui/Select';
import DialogService from './DialogService';

type UserFormValues = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string | null;
    role: 'owner' | 'admin' | 'user';
    isActive: boolean;
    password?: string;
};

type NewUserDialogData = {
    user?: User;
    /** Only workspace owners may grant the "owner" role. */
    allowOwnerRole?: boolean;
};

const NewUserDialog: DialogViewComponent<UserFormValues, NewUserDialogData> = (props) => {
    const isEdit = () => !!props.data?.user;

    const [errors, setErrors] = createSignal<{
        firstName?: string;
        lastName?: string;
        username?: string;
        email?: string;
        password?: string;
    }>({});

    onMount(() => {
        if (props.data?.user) {
            const u = props.data.user;
            props.setChanges({
                firstName: u.firstName,
                lastName: u.lastName,
                username: u.username,
                email: u.email,
                phone: u.phone,
                role: u.role,
                isActive: u.isActive,
            });
        } else {
            props.setChanges({
                role: 'user',
                isActive: true,
            });
        }
    });

    createEffect(() => {
        if (props.validate()) {
            const changes = props.changes();
            const newErrors: {
                firstName?: string;
                lastName?: string;
                username?: string;
                email?: string;
                password?: string;
            } = {};

            if (!changes?.firstName?.trim()) {
                newErrors.firstName = t('mmp_error_first_name_required');
            }
            if (!changes?.lastName?.trim()) {
                newErrors.lastName = t('mmp_error_last_name_required');
            }
            if (!changes?.username?.trim()) {
                newErrors.username = t('mmp_error_user_username_required');
            }
            if (!changes?.email?.trim() || !isValidEmail(changes.email)) {
                newErrors.email = t('mmp_error_email_invalid');
            }
            if (!isEdit() && (!changes?.password || changes.password.length < 8)) {
                newErrors.password = t('mmp_error_user_password_length');
            }

            setErrors(newErrors);

            const valid = Object.keys(newErrors).length === 0;
            props.setIsValid(valid);
        }
    });

    const allowOwnerRole = () => props.data?.allowOwnerRole ?? false;

    return (
        <div class='space-y-4'>
            <div class='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Field label={t('mmp_user_form_first_name_label')} required error={errors().firstName}>
                    <Input
                        value={props.changes()?.firstName ?? ''}
                        onInput={(event) =>
                            props.setChanges((current) => ({
                                ...current,
                                firstName: event.currentTarget.value,
                            }))}
                    />
                </Field>
                <Field label={t('mmp_user_form_last_name_label')} required error={errors().lastName}>
                    <Input
                        value={props.changes()?.lastName ?? ''}
                        onInput={(event) =>
                            props.setChanges((current) => ({
                                ...current,
                                lastName: event.currentTarget.value,
                            }))}
                    />
                </Field>
            </div>

            <Field label={t('mmp_user_form_username_label')} required error={errors().username}>
                <Input
                    value={props.changes()?.username ?? ''}
                    onInput={(event) =>
                        props.setChanges((current) => ({
                            ...current,
                            username: event.currentTarget.value,
                        }))}
                />
            </Field>

            <Field label={t('mmp_settings_email')} required error={errors().email}>
                <Input
                    type='email'
                    value={props.changes()?.email ?? ''}
                    onInput={(event) =>
                        props.setChanges((current) => ({
                            ...current,
                            email: event.currentTarget.value,
                        }))}
                />
            </Field>

            <Field label={t('mmp_settings_phone')}>
                <Input
                    value={props.changes()?.phone ?? ''}
                    onInput={(event) =>
                        props.setChanges((current) => ({
                            ...current,
                            phone: event.currentTarget.value || null,
                        }))}
                    placeholder={t('mmp_field_optional_placeholder')}
                />
            </Field>

            <div class='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <Field label={t('mmp_settings_role')} required>
                    <Select
                        value={props.changes()?.role ?? 'user'}
                        onChange={(event) =>
                            props.setChanges((current) => ({
                                ...current,
                                role: event.currentTarget.value as UserFormValues['role'],
                            }))}
                    >
                        <option value='user'>{t('mmp_user_role_user')}</option>
                        <option value='admin'>{t('mmp_user_role_admin')}</option>
                        <Show when={allowOwnerRole()}>
                            <option value='owner'>{t('mmp_user_role_owner')}</option>
                        </Show>
                    </Select>
                </Field>

                <Field label={t('mmp_user_form_status_label')} required>
                    <Select
                        value={props.changes()?.isActive === false ? 'inactive' : 'active'}
                        onChange={(event) =>
                            props.setChanges((current) => ({
                                ...current,
                                isActive: event.currentTarget.value === 'active',
                            }))}
                    >
                        <option value='active'>{t('mmp_settings_users_status_active')}</option>
                        <option value='inactive'>{t('mmp_settings_users_status_inactive')}</option>
                    </Select>
                </Field>
            </div>

            <Show when={!isEdit()}>
                <Field label={t('mmp_user_form_password_label')} required error={errors().password}>
                    <Input
                        type='password'
                        value={props.changes()?.password ?? ''}
                        onInput={(event) =>
                            props.setChanges((current) => ({
                                ...current,
                                password: event.currentTarget.value,
                            }))}
                        placeholder={t('mmp_settings_password_placeholder_new')}
                    />
                </Field>
            </Show>
        </div>
    );
};

const createNewUserDialog = (
    data: NewUserDialogData,
    done: (changes: Partial<UserFormValues>) => void,
) => {
    DialogService.open({
        viewComponent: NewUserDialog,
        title: data.user ? t('mmp_user_dialog_edit_title') : t('mmp_user_dialog_new_title'),
        data,
        buttons: [
            { text: 'mmp_action_cancel', type: 'secondary' },
            { text: data.user ? 'mmp_action_update' : 'mmp_action_create', submit: true },
        ],
        validate: true,
        done,
    });
};

export default createNewUserDialog;
