import {
    ChangePasswordInput,
    CreateUserInput,
    SelfUpdateInput,
    UpdateUserInput,
    User,
} from '../../shared/shared-types';
import { del, get, patch, post, unwrapApiResponse } from './api';

export async function getUsers() {
    const res = await get<User[]>(`${API_BASE_URL}/users`);
    return unwrapApiResponse<User[]>(res);
}

export async function getUser(userId: string) {
    const res = await get<User>(`${API_BASE_URL}/users/${userId}`);
    return unwrapApiResponse<User>(res);
}

export async function createUser(input: CreateUserInput) {
    const res = await post<User>(`${API_BASE_URL}/users`, input);
    return unwrapApiResponse<User>(res);
}

export async function updateUser(userId: string, input: UpdateUserInput) {
    const res = await patch<User>(`${API_BASE_URL}/users/${userId}`, input);
    return unwrapApiResponse<User>(res);
}

export async function deleteUser(userId: string) {
    const res = await del<{ success: boolean }>(`${API_BASE_URL}/users/${userId}`);
    return unwrapApiResponse<{ success: boolean }>(res);
}

// Self-service: editing your own profile from Settings > Account.
export async function updateMyProfile(input: SelfUpdateInput) {
    const res = await patch<User>(`${API_BASE_URL}/users/me`, input);
    return unwrapApiResponse<User>(res);
}

// Self-service: changing your own password from Settings > Account.
export async function changeMyPassword(input: ChangePasswordInput) {
    const res = await patch<User>(`${API_BASE_URL}/users/me/change-password`, input);
    return unwrapApiResponse<User>(res);
}
