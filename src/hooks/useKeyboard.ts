// PLACEHOLDER
import { onCleanup, onMount } from 'solid-js';

export function useKeyboard(shortcuts: Record<string, (e: KeyboardEvent) => void>) {
    onMount(() => {
        const handler = (e: KeyboardEvent) => {
            if (!e?.key) return;
            const key = [
                e.ctrlKey || e.metaKey ? 'ctrl+' : '',
                e.altKey ? 'alt+' : '',
                e.shiftKey ? 'shift+' : '',
                e.key.toLowerCase(),
            ].join('');
            if (shortcuts[key]) {
                e.preventDefault();
                shortcuts[key](e);
            }
        };
        document.addEventListener('keydown', handler);
        onCleanup(() => document.removeEventListener('keydown', handler));
    });
}
