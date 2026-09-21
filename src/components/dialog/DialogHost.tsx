import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { DialogButtonOptions } from '../../types/types';
import DialogComponent from './DialogComponent';
import DialogService from './DialogService';

export default function DialogHost() {
    const dialogs = DialogService.useDialogs();

    createEffect(() => {
        if (dialogs().length > 0) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    onCleanup(() => {
        document.body.style.overflow = '';
    });

    return (
        <Portal>
            <Show when={dialogs().length > 0}>
                <div
                    class='fixed inset-0 bg-black/60 backdrop-blur-sm'
                    style={{ 'z-index': `${1000 + dialogs().length}` }}
                />
            </Show>
            <For each={dialogs()}>
                {(config, index) => {
                    const [validate, setValidate] = createSignal(false);
                    const [isValid, setIsValid] = createSignal(false);
                    const [changes, setChanges] = createSignal<any>({});
                    const ContentView = config.viewComponent;

                    return (
                        <DialogComponent
                            index={index() + 1}
                            title={config.title || ''}
                            buttons={config.buttons}
                            done={(submit: DialogButtonOptions | boolean) => {
                                if (submit && config.validate) {
                                    setValidate(true);
                                    setTimeout(() => {
                                        setValidate(false);
                                    }, 0);
                                    if (!isValid()) return;
                                }
                                if (typeof submit === 'object') {
                                    if (submit.keepOpen) {
                                        return;
                                    }
                                }
                                DialogService.close();
                                if (submit) {
                                    config.done?.(changes());
                                }
                            }}
                            onKeyDown={config.onKeyDown}
                            options={config.options}
                        >
                            <ContentView
                                changes={changes}
                                setChanges={setChanges}
                                validate={validate}
                                data={config.data}
                                setIsValid={setIsValid}
                                done={(options) => {
                                    config.done?.(changes());
                                    if (!options?.keepOpen) {
                                        DialogService.close();
                                    }
                                    setValidate(false);
                                }}
                                onKeyDown={config.onKeyDown}
                            />
                        </DialogComponent>
                    );
                }}
            </For>
        </Portal>
    );
}
