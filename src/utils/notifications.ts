// PLACEHOLDER
import { createSignal } from 'solid-js';

export interface Notification {
    id: string;
    title: string;
    desc: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    time: string;
}

const [notificationList, setNotificationList] = createSignal<Notification[]>([]);

export const notifications = () => notificationList();

export function addNotification(notification: Omit<Notification, 'id' | 'read' | 'time'>) {
    const id = Math.random().toString(36).slice(2);
    setNotificationList((prev) => [
        { ...notification, id, read: false, time: new Date().toISOString() },
        ...prev,
    ]);
}

export function markAllRead() {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })));
}

export function clearNotifications() {
    setNotificationList([]);
}

export function unreadCount() {
    return notificationList().filter((n) => !n.read).length;
}
