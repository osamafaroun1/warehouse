import { t } from '../localization';

let refreshingTokenPromise: Promise<boolean> | null = null;

export interface ApiErrorResponse {
    error: true;
    status: number;
    code?: string;
    message: string;
    params?: ApiErrorParams;
    details?: {
        issues?: ApiIssue[];
        [key: string]: unknown;
    };
    issues?: ApiIssue[];
    data?: unknown;
}

export type ApiResult<T> = T | ApiErrorResponse;

type ApiIssue = {
    path: string;
    message: string;
};

type ApiErrorParams = Record<string, string | number>;

export type ApiErrorResult = {
    error: true;
    status: number;
    code?: string;
    message: string;
    params?: ApiErrorParams;
    details?: {
        issues?: ApiIssue[];
        [key: string]: unknown;
    };
    issues?: ApiIssue[];
    data?: unknown;
};

async function parseJsonSafe(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
        return response.json().catch(() => ({}));
    }

    const text = await response.text().catch(() => '');

    return text ? { message: text } : {};
}

function toApiError(response: Response, content: any): ApiErrorResult {
    const issues = content?.details?.issues ?? content?.issues;
    const params = content?.params ?? content?.details?.params;

    return {
        error: true,
        status: response.status,
        code: content?.code,
        message: content?.message || response.statusText || 'Request failed',
        params,
        details: content?.details,
        issues,
        data: content?.data,
    };
}

function toNetworkError(error: unknown): ApiErrorResult {
    return {
        error: true,
        status: 0,
        message: t(error instanceof Error ? error.message : 'Unknown error'),
    };
}

function buildBody(data: unknown): { headers: Record<string, string>; body: BodyInit } {
    const headers: Record<string, string> = {};

    if (data instanceof FormData) {
        return {
            headers,
            body: data,
        };
    }

    headers['Content-Type'] = 'application/json';

    if (typeof data === 'string') {
        return {
            headers,
            body: data,
        };
    }

    if (Array.isArray(data) || typeof data === 'object') {
        return {
            headers,
            body: JSON.stringify(data),
        };
    }

    throw new Error('Invalid data type for request body');
}

export const logout = async () => {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch {
        // Silent crash
    }
};

const refreshAccessToken = async (): Promise<boolean> => {
    if (refreshingTokenPromise) {
        return refreshingTokenPromise;
    }

    refreshingTokenPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                window.location.href = '/login';
                return false;
            }

            return true;
        } catch {
            window.location.href = '/login';
            return false;
        } finally {
            refreshingTokenPromise = null;
        }
    })();

    return refreshingTokenPromise;
};

export const get = async <T>(url: string, retry = true): Promise<T> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401 && retry) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return get<T>(url, false);
            }

            await logout();
        }

        const content = await parseJsonSafe(response);

        if (!response.ok) {
            return toApiError(response, content) as unknown as T;
        }

        return content as T;
    } catch (error) {
        return toNetworkError(error) as unknown as T;
    }
};

export const del = async <T>(url: string, retry = true): Promise<T> => {
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401 && retry) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return del<T>(url, false);
            }

            await logout();
        }

        const content = await parseJsonSafe(response);

        if (!response.ok) {
            return toApiError(response, content) as unknown as T;
        }

        return content as T;
    } catch (error) {
        return toNetworkError(error) as unknown as T;
    }
};

export const post = async <T>(url: string, data: unknown, retry = true): Promise<T> => {
    try {
        const { headers, body } = buildBody(data);

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers,
            body,
        });

        if (response.status === 401 && retry) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return post<T>(url, data, false);
            }

            await logout();
        }

        const content = await parseJsonSafe(response);

        if (!response.ok) {
            return toApiError(response, content) as unknown as T;
        }

        return content as T;
    } catch (error) {
        return toNetworkError(error) as unknown as T;
    }
};

export const put = async <T>(url: string, data: unknown, retry = true): Promise<T> => {
    try {
        const { headers, body } = buildBody(data);

        const response = await fetch(url, {
            method: 'PUT',
            credentials: 'include',
            headers,
            body,
        });

        if (response.status === 401 && retry) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return put<T>(url, data, false);
            }

            await logout();
        }

        const content = await parseJsonSafe(response);

        if (!response.ok) {
            return toApiError(response, content) as unknown as T;
        }

        return content as T;
    } catch (error) {
        return toNetworkError(error) as unknown as T;
    }
};

export const patch = async <T>(url: string, data: unknown, retry = true): Promise<T> => {
    try {
        const { headers, body } = buildBody(data);

        const response = await fetch(url, {
            method: 'PATCH',
            credentials: 'include',
            headers,
            body,
        });

        if (response.status === 401 && retry) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return patch<T>(url, data, false);
            }

            await logout();
        }

        const content = await parseJsonSafe(response);

        if (!response.ok) {
            return toApiError(response, content) as unknown as T;
        }

        return content as T;
    } catch (error) {
        return toNetworkError(error) as unknown as T;
    }
};

export function isApiError<T>(res: ApiResult<T>): res is ApiErrorResponse {
    return typeof res === 'object' && res !== null && 'error' in res && res.error === true;
}

export function getApiErrorMessage(res: any) {
    if (res.code === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = res.details?.retryAfter;

        if (typeof retryAfter === 'number') {
            const minutes = Math.ceil(retryAfter / 60);
            return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
        }

        return 'Too many attempts. Please try again later.';
    }

    if (typeof res?.message === 'string') {
        const rawParams = res?.params;
        const translatedParams = rawParams && typeof rawParams === 'object'
            ? Object.entries(rawParams).reduce<ApiErrorParams>((acc, [key, value]) => {
                if (typeof value === 'string') {
                    acc[key] = t(value);
                } else if (typeof value === 'number') {
                    acc[key] = value;
                }
                return acc;
            }, {})
            : undefined;

        return t(res.message, translatedParams);
    }

    return 'Something went wrong. Please try again.';
}

export class ApiResponseError extends Error {
    status: number;
    code?: string;
    params?: ApiErrorParams;
    details?: ApiErrorResult['details'];
    issues?: ApiErrorResult['issues'];
    data?: ApiErrorResult['data'];

    constructor(res: ApiErrorResponse) {
        super(getApiErrorMessage(res));
        this.name = 'ApiResponseError';
        this.status = res.status;
        this.code = res.code;
        this.params = res.params;
        this.details = res.details;
        this.issues = res.issues;
        this.data = res.data;
    }
}

export async function unwrapApiResponse<T>(res: T): Promise<T> {
    if (isApiError(res)) {
        throw new ApiResponseError(res);
    }
    return res;
}
