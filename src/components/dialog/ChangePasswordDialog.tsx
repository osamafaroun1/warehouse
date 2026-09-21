import { createEffect, createSignal } from 'solid-js';
import { t } from '../../localization';
import { DialogViewComponent } from '../../types/types';
import { Field } from '../ui';
import { Input } from '../ui/Input';
import DialogService from './DialogService';

type ChangePasswordChanges = {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
};

const ChangePasswordDialog: DialogViewComponent<ChangePasswordChanges, {}> = (props) => {
    const [errors, setErrors] = createSignal<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});

    // Validate when requested (Update button pressed)
    createEffect(() => {
        if (props.validate()) {
            const changes = props.changes();
            const newErrors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};

            if (!changes?.currentPassword) {
                newErrors.currentPassword = t('mmp_settings_password_error_fields');
            }

            if (!changes?.newPassword || changes.newPassword.length < 8) {
                newErrors.newPassword = t('mmp_settings_password_error_length');
            }

            if (changes?.newPassword !== changes?.confirmPassword) {
                newErrors.confirmPassword = t('mmp_settings_password_error_match');
            }

            setErrors(newErrors);

            const valid = !newErrors.currentPassword && !newErrors.newPassword && !newErrors.confirmPassword;
            props.setIsValid(valid);
        }
    });

    return (
        <div class='space-y-4'>
            <Field label={t('mmp_settings_password_current')} required error={errors().currentPassword}>
                <Input
                    type='password'
                    value={props.changes()?.currentPassword ?? ''}
                    onInput={(event) =>
                        props.setChanges((current) => ({
                            ...current,
                            currentPassword: event.currentTarget.value,
                        }))}
                    placeholder={t('mmp_settings_password_placeholder_current')}
                />
            </Field>

            <Field label={t('mmp_settings_password_new')} required error={errors().newPassword}>
                <Input
                    type='password'
                    value={props.changes()?.newPassword ?? ''}
                    onInput={(event) =>
                        props.setChanges((current) => ({
                            ...current,
                            newPassword: event.currentTarget.value,
                        }))}
                    placeholder={t('mmp_settings_password_placeholder_new')}
                />
            </Field>

            <Field label={t('mmp_settings_password_confirm')} required error={errors().confirmPassword}>
                <Input
                    type='password'
                    value={props.changes()?.confirmPassword ?? ''}
                    onInput={(event) =>
                        props.setChanges((current) => ({
                            ...current,
                            confirmPassword: event.currentTarget.value,
                        }))}
                    placeholder={t('mmp_settings_password_placeholder_confirm')}
                />
            </Field>
        </div>
    );
};

const createChangePasswordDialog = (
    done: (changes: ChangePasswordChanges) => void,
) => {
    DialogService.open({
        viewComponent: ChangePasswordDialog,
        title: t('mmp_settings_password_title'),
        buttons: [
            { text: 'mmp_action_cancel', type: 'secondary' },
            { text: 'mmp_settings_password_update', submit: true },
        ],
        validate: true,
        done,
    });
};

export default createChangePasswordDialog;
