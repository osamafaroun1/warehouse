/**
 * localStorageState.ts
 * Small typed helpers for storing object state in localStorage.
 *
 * Usage:
 *   type AppState = { selectedCompanyId: string; filters: { query: string } };
 *
 *   const state = getLocalState<AppState>('my_key');
 *
 *   const stateWithFallback = getLocalState<AppState>('my_key', {
 *     selectedCompanyId: '',
 *     filters: { query: '' },
 *   });
 *
 *   setLocalState<AppState>('my_key', {
 *     selectedCompanyId: '123',
 *     filters: { query: 'abc' },
 *   });
 *
 *   updateLocalState<AppState>('my_key', (prev) => ({
 *     ...prev,
 *     selectedCompanyId: '456',
 *   }));
 *
 *   updateLocalState<AppState>('my_key', defaultState, (prev) => ({
 *     ...prev,
 *     selectedCompanyId: '456',
 *   }));
 */

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emptyState<T>(): T {
    return {} as T;
}

export function getLocalState<T>(key: string, fallback?: T): T {
    const defaultValue = fallback ?? emptyState<T>();

    if (!isBrowser()) return defaultValue;

    try {
        const raw = window.localStorage.getItem(key);

        if (!raw) return defaultValue;

        const parsed = JSON.parse(raw) as unknown;

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return defaultValue;
        }

        return parsed as T;
    } catch (error) {
        console.error(`Failed to read localStorage state for key "${key}"`, error);
        return defaultValue;
    }
}

export function setLocalState<T>(key: string, value: T): void {
    if (!isBrowser()) return;

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save localStorage state for key "${key}"`, error);
    }
}

export function updateLocalState<T>(
    key: string,
    fallbackOrUpdater: T | ((previous: T) => T),
    maybeUpdater?: (previous: T) => T,
): T {
    const hasFallback = typeof fallbackOrUpdater !== 'function';

    const fallback = hasFallback ? fallbackOrUpdater as T : undefined;
    const updater = hasFallback ? maybeUpdater : fallbackOrUpdater as (previous: T) => T;

    if (!updater) {
        throw new Error(`updateLocalState called without updater for key "${key}"`);
    }

    const previous = getLocalState<T>(key, fallback);
    const next = updater(previous);

    setLocalState<T>(key, next);

    return next;
}

export function removeLocalState(key: string): void {
    if (!isBrowser()) return;

    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove localStorage state for key "${key}"`, error);
    }
}

export function clearLocalState(keys: string[]): void {
    keys.forEach(removeLocalState);
}
