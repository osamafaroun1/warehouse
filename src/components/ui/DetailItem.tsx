import { Component } from 'solid-js';

const DetailItem: Component<{
    label: string;
    value?: string | number | null | undefined;
    dir?: 'ltr' | 'rtl' | 'auto';
}> = (props) => {
    return (
        <div>
            <div class='text-[11px] font-medium uppercase tracking-wider text-zinc-500'>
                {props.label}
            </div>
            <div
                class='mt-1 wrap-break-word text-sm font-medium text-zinc-900 dark:text-zinc-100'
                dir={props.dir}
            >
                {props.value === '' ? '—' : (props.value ?? '—')}
            </div>
        </div>
    );
};

export default DetailItem;
