import { t } from '../../localization';
import { DialogViewComponent } from '../../types/types';
import DialogService from './DialogService';

const ConfirmDialog: DialogViewComponent<{}, { message: string }> = (props) => {
    return (
        <div class='space-y-4'>
            <div class='text-sm text-zinc-600 dark:text-zinc-300'>
                {props.data?.message}
            </div>
        </div>
    );
};

export const showConfirmDialog = (options: {
    itemName: string;
    done: () => void;
    title?: string;
    body?: string;
}) => {
    const { itemName, done, title, body } = options;
    DialogService.open({
        viewComponent: ConfirmDialog,
        title: title ?? t('mmp_delete_confirm_title', { item: itemName }),
        data: { message: body ?? t('mmp_delete_confirm', { item: itemName }) },
        buttons: [
            { text: 'mmp_action_cancel', type: 'secondary' },
            { text: 'mmp_action_confirm', submit: true },
        ],
        validate: false,
        done,
    });
};

export default ConfirmDialog;
