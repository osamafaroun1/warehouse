import { Accessor, createSignal } from 'solid-js';
import { DialogButton, DialogOptions, DialogViewComponent } from '../../types/types';

type DialogConfig<TChanges = {}, TData = {}> = {
    title?: string;
    viewComponent: DialogViewComponent<TChanges, TData>;
    buttons?: DialogButton[] | Accessor<DialogButton[]>;
    options?: DialogOptions;
    validate?: boolean;
    data?: TData;
    done?: (changes: TChanges) => void;
    onKeyDown?: (e: KeyboardEvent) => boolean;
};

const [dialogs, setDialogs] = createSignal<DialogConfig<any, any>[]>([]);

const DialogService = {
    open<TChanges, TData>(config: DialogConfig<TChanges, TData>) {
        setDialogs(prev => [...prev, config]);
    },
    close: () => {
        setDialogs((prev) => prev.slice(0, -1)); // remove the top-most dialog
    },
    closeAll: () => {
        setDialogs([]);
    },
    useDialogs: () => dialogs,
};

export default DialogService;
