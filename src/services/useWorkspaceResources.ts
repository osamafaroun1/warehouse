import { createResource } from 'solid-js';
import type { User } from '../../shared/shared-types';
import { getUsers } from '../api/user.api';

type ResourceKey = 'users' | 'attachmentsByOwner';

const cache: Partial<Record<ResourceKey, any>> = {};

export function getCached<T = any>(key: ResourceKey): T | undefined {
    return cache[key] as T | undefined;
}

export function setCached(key: ResourceKey, value: any) {
    cache[key] = value;
}

export function clearCached(key: ResourceKey) {
    delete cache[key];
}

export function updateCached<T>(key: ResourceKey, updater: (current: T | undefined) => T | undefined) {
    cache[key] = updater(cache[key] as T | undefined);
}

export function useWorkspaceResources(keys: ResourceKey[]) {
    const resources: Record<string, any> = {};

    if (keys.includes('users')) {
        const [users, { refetch }] = createResource<User[]>(async () => {
            const data = await getUsers();
            setCached('users', data);
            return data;
        });
        resources.users = users;
        resources.refetchUsers = refetch;
    }

    const usersResource = resources.users;
    return {
        resources,
        loading: () => Boolean(usersResource?.loading),
        hasError: () => Boolean(usersResource?.error),
    };
}
