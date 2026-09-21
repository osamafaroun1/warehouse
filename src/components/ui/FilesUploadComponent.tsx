import { Accessor, Component, For, Setter, Show } from 'solid-js';
import { t } from '../../localization';
import { fileColor, fileIcon, formatFileSize } from '../../utils/files';
import { Field, Icon } from '.';
import { Button } from './Button';

const FilesUploadComponent: Component<{
    selectedFiles: Accessor<File[]>;
    setSelectedFiles: Setter<File[]>;
    uploadingFiles: Accessor<boolean>;
}> = (props) => {
    const handleFileSelect = (files: FileList) => {
        if (!files) return;
        const fileArray = Array.from(files);
        props.setSelectedFiles((prev) => [...prev, ...fileArray]);
    };

    const removeFile = (index: number) => {
        props.setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const clearFiles = () => {
        props.setSelectedFiles([]);
    };

    return (
        <Field label={t('mmp_mark_attachments')}>
            <div class='flex flex-wrap items-center gap-3'>
                <Button
                    size='sm'
                    variant='outline'
                    leftIcon='upload_file'
                    accept='image/*,.pdf,.doc,.docx,.txt'
                    multiple
                    onFileSelect={handleFileSelect}
                    disabled={props.uploadingFiles?.()}
                >
                    {t('mmp_mark_add_attachment')}
                </Button>
                <Show when={props.selectedFiles().length > 0}>
                    <Button
                        size='sm'
                        variant='ghost'
                        leftIcon='clear'
                        class='text-rose-500 hover:text-rose-600'
                        onClick={clearFiles}
                        disabled={props.uploadingFiles?.()}
                    >
                        {t('mmp_action_remove_all')}
                    </Button>
                </Show>
            </div>

            <Show when={props.selectedFiles().length > 0}>
                <div class='mt-3 space-y-2'>
                    <div class='flex items-center justify-between'>
                        <span class='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
                            {t('mmp_files_selected_count', { count: props.selectedFiles().length })}
                        </span>
                        <Show when={props.uploadingFiles?.()}>
                            <span class='text-xs text-indigo-600 dark:text-indigo-400 animate-pulse'>
                                {t('mmp_uploading')}...
                            </span>
                        </Show>
                    </div>
                    <div class='max-h-48 overflow-y-auto space-y-1.5'>
                        <For each={props.selectedFiles()}>
                            {(file, index) => (
                                <div class='flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-900/60'>
                                    <div class='flex items-center gap-2 min-w-0'>
                                        <div
                                            class={`flex h-8 w-8 items-center justify-center rounded ${
                                                fileColor(file.type)
                                            }`}
                                        >
                                            <Icon
                                                name={fileIcon(file.type)}
                                                size={16}
                                                class='text-zinc-400 shrink-0'
                                            />
                                        </div>
                                        <span class='truncate text-sm text-zinc-700 dark:text-zinc-200'>
                                            {file.name}
                                        </span>
                                        <span class='text-xs text-zinc-400 shrink-0'>
                                            ({formatFileSize(file.size)})
                                        </span>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => removeFile(index())}
                                        disabled={props.uploadingFiles?.()}
                                        class='rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-rose-500 dark:hover:bg-white/5 disabled:opacity-50'
                                        aria-label={t('mmp_action_remove')}
                                    >
                                        <Icon name='close' size={16} />
                                    </button>
                                </div>
                            )}
                        </For>
                    </div>
                </div>
            </Show>

            <p class='mt-1 text-xs text-zinc-500'>
                {t('mmp_mark_attachments_hint')}
            </p>
        </Field>
    );
};

export default FilesUploadComponent;
