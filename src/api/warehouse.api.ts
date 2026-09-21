import { get, post, patch, del, unwrapApiResponse } from './api';

export interface ProductWithStock {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    createdAt: string;
    updatedAt: string;
    totalIn: string;
    totalOut: string;
    currentStock: string;
}

export interface StockEntry {
    id: string;
    productId: string;
    productName: string;
    quantity: string;
    entryDate: string;
    receivedBy: string;
    deliveredBy: string;
    notes: string | null;
    createdAt: string;
    createdBy: string | null;
}

export interface StockExit {
    id: string;
    productId: string;
    productName: string;
    quantity: string;
    exitDate: string;
    receivedBy: string;
    deliveredBy: string;
    governorate: string;
    centerName: string;
    notes: string | null;
    createdAt: string;
    createdBy: string | null;
}

export interface CreateEntryPayload {
    productName: string;
    quantity: number | string;
    entryDate: string;
    receivedBy: string;
    deliveredBy: string;
    notes?: string | null;
    attachmentIds?: string[];
}

export interface UpdateEntryPayload {
    quantity?: number | string;
    entryDate?: string;
    receivedBy?: string;
    deliveredBy?: string;
    notes?: string | null;
}

export interface CreateExitPayload {
    productName: string;
    quantity: number | string;
    exitDate: string;
    receivedBy: string;
    deliveredBy: string;
    governorate: string;
    centerName: string;
    notes?: string | null;
}

export interface UpdateExitPayload {
    quantity?: number | string;
    exitDate?: string;
    receivedBy?: string;
    deliveredBy?: string;
    governorate?: string;
    centerName?: string;
    notes?: string | null;
}

export async function getGovernorates(): Promise<string[]> {
    const res = await get<string[]>(`${API_BASE_URL}/warehouse/governorates`);
    return unwrapApiResponse(res);
}

export async function getProductsWithStock(params?: {
    query?: string;
    minStock?: number;
    maxStock?: number;
    limit?: number;
    offset?: number;
}): Promise<ProductWithStock[]> {
    const search = new URLSearchParams();
    if (params?.query) search.set('query', params.query);
    if (params?.minStock !== undefined) search.set('minStock', String(params.minStock));
    if (params?.maxStock !== undefined) search.set('maxStock', String(params.maxStock));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    const qs = search.toString();
    const res = await get<ProductWithStock[]>(
        `${API_BASE_URL}/warehouse/products${qs ? `?${qs}` : ''}`,
    );
    return unwrapApiResponse(res);
}

export async function getStockEntries(params?: {
    query?: string;
    productId?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
}): Promise<StockEntry[]> {
    const search = new URLSearchParams();
    if (params?.query) search.set('query', params.query);
    if (params?.productId) search.set('productId', params.productId);
    if (params?.fromDate) search.set('fromDate', params.fromDate);
    if (params?.toDate) search.set('toDate', params.toDate);
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    const qs = search.toString();
    const res = await get<StockEntry[]>(
        `${API_BASE_URL}/warehouse/entries${qs ? `?${qs}` : ''}`,
    );
    return unwrapApiResponse(res);
}

export async function createStockEntry(payload: CreateEntryPayload): Promise<StockEntry> {
    const res = await post<StockEntry>(`${API_BASE_URL}/warehouse/entries`, payload);
    return unwrapApiResponse(res);
}

export async function updateStockEntry(id: string, payload: UpdateEntryPayload): Promise<StockEntry> {
    const res = await patch<StockEntry>(`${API_BASE_URL}/warehouse/entries/${id}`, payload);
    return unwrapApiResponse(res);
}

export async function deleteStockEntry(id: string): Promise<{ success: boolean; id: string }> {
    const res = await del<{ success: boolean; id: string }>(`${API_BASE_URL}/warehouse/entries/${id}`);
    return unwrapApiResponse(res);
}

export async function getStockExits(params?: {
    query?: string;
    productId?: string;
    governorate?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
}): Promise<StockExit[]> {
    const search = new URLSearchParams();
    if (params?.query) search.set('query', params.query);
    if (params?.productId) search.set('productId', params.productId);
    if (params?.governorate) search.set('governorate', params.governorate);
    if (params?.fromDate) search.set('fromDate', params.fromDate);
    if (params?.toDate) search.set('toDate', params.toDate);
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    const qs = search.toString();
    const res = await get<StockExit[]>(
        `${API_BASE_URL}/warehouse/exits${qs ? `?${qs}` : ''}`,
    );
    return unwrapApiResponse(res);
}

export async function createStockExit(payload: CreateExitPayload): Promise<StockExit> {
    const res = await post<StockExit>(`${API_BASE_URL}/warehouse/exits`, payload);
    return unwrapApiResponse(res);
}

export async function updateStockExit(id: string, payload: UpdateExitPayload): Promise<StockExit> {
    const res = await patch<StockExit>(`${API_BASE_URL}/warehouse/exits/${id}`, payload);
    return unwrapApiResponse(res);
}

export async function deleteStockExit(id: string): Promise<{ success: boolean; id: string }> {
    const res = await del<{ success: boolean; id: string }>(`${API_BASE_URL}/warehouse/exits/${id}`);
    return unwrapApiResponse(res);
}
