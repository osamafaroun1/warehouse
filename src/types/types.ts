import { Accessor, Component, Setter } from 'solid-js';

export type Status = 'active' | 'archived' | 'inactive';
export type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export type LocationState = {
    from?: string;
};

export type AppStorageState = {
    selectedCompanyId: string;
};

export type DialogButtonOptions = {
    keepOpen: boolean;
};

export interface DialogButton {
    text: string;
    icon?: string;
    submit?: boolean;
    type?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    options?: DialogButtonOptions;
    onClick?: () => boolean | Promise<boolean>;
}

export interface DialogOptions {
    movable?: boolean;
    width?: string | number;
}

export type DialogViewComponent<
    TChanges = {},
    TData = {},
> = Component<{
    changes: Accessor<TChanges>;
    setChanges: Setter<Partial<TChanges>>;

    data?: TData;

    validate: Accessor<boolean>;
    setIsValid: Setter<boolean>;

    done: (options?: {
        keepOpen: boolean;
    }) => void;

    onKeyDown?: (e: KeyboardEvent) => boolean;
}>;
