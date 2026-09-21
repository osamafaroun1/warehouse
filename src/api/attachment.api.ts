import { Attachment } from '../../shared/shared-types';
import { del, get, post, unwrapApiResponse } from './api';

export async function getAttachmentPreviewBlobUrl(attachmentId: string) {
    const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}/download`, {
        credentials: 'include',
    });
    if (!response.ok) throw new Error('Unable to load attachment preview');
    return URL.createObjectURL(await response.blob());
}

export async function getAttachments(params?: { userId?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    const res = await get<Attachment[]>(`${API_BASE_URL}/attachments${qs ? `?${qs}` : ''}`);
    return unwrapApiResponse(res);
}

export async function uploadAttachments(files: File[] | FileList, owner?: { userId?: string }) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) throw new Error('No files selected');

    const form = new FormData();
    fileArray.forEach((file) => form.append('file', file));
    if (owner?.userId) form.append('userId', owner.userId);

    const res = await post<Attachment[]>(`${API_BASE_URL}/attachments`, form);
    return unwrapApiResponse<Attachment[]>(res);
}

export async function deleteAttachment(attachmentId: string) {
    const res = await del<{ success: boolean }>(`${API_BASE_URL}/attachments/${attachmentId}`);
    return unwrapApiResponse(res);
}
