import { createSignal } from 'solid-js';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export const [toasts, setToasts] = createSignal<Toast[]>([]);

export function toast(message: string, type: ToastType = 'info') {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
    }, 3800);
}

export const ToastMessage = {
    success: (m: string) => toast(m, 'success'),
    error: (m: string) => toast(m, 'error'),
    info: (m: string) => toast(m, 'info'),
    warning: (m: string) => toast(m, 'warning'),
};
