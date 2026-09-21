import { User } from '../../shared/shared-types';
import { type ApiResult, post } from './api';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
    user: User;
}

export interface ApiIssue {
    path: string;
    message: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    organizationSlug: string;
}

export const login = async (loginOptions: LoginInput): Promise<ApiResult<AuthResponse>> => {
    const result = await post<ApiResult<AuthResponse>>(
        `${API_BASE_URL}/auth/login`,
        loginOptions,
        false,
    );
    return result;
};

export const register = async (input: RegisterInput): Promise<ApiResult<AuthResponse>> => {
    const result = await post<ApiResult<AuthResponse>>(
        `${API_BASE_URL}/auth/register`,
        input,
        false,
    );
    return result;
};

export const refresh = async (): Promise<ApiResult<AuthResponse>> => {
    const result = await post<ApiResult<AuthResponse>>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        false,
    );
    return result;
};

export const logout = async (): Promise<void> => {
    try {
        await post(`${API_BASE_URL}/auth/logout`, {}, false);
    } catch {
        // Silent
    }
};

export const verifyAuth = async (): Promise<ApiResult<AuthResponse | null>> => {
    return await refresh();
};
