export function isPreviewable(mimeType: string) {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

export const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, index);

    return `${Number(value.toFixed(1))} ${units[index]}`;
};

export const fileIcon = (mimeType?: string) => {
    if (!mimeType) return 'insert_drive_file';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.startsWith('audio/')) return 'audiotrack';

    const map: Record<string, string> = {
        'application/pdf': 'picture_as_pdf',

        'application/msword': 'description',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',

        'application/vnd.ms-excel': 'table_chart',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'table_chart',

        'application/vnd.ms-powerpoint': 'slideshow',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'slideshow',

        'text/plain': 'article',
        'text/csv': 'table_chart',

        'application/zip': 'folder_zip',
        'application/x-rar-compressed': 'folder_zip',
    };

    return map[mimeType] ?? 'insert_drive_file';
};

export const fileColor = (mimeType?: string) => {
    if (!mimeType) return 'bg-zinc-500/10 text-zinc-600';

    if (mimeType.startsWith('image/')) {
        return 'bg-purple-500/10 text-purple-600';
    }

    if (mimeType.startsWith('video/')) {
        return 'bg-amber-500/10 text-amber-600';
    }

    const map: Record<string, string> = {
        'application/pdf': 'bg-rose-500/10 text-rose-600',

        'application/msword': 'bg-blue-500/10 text-blue-600',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bg-blue-500/10 text-blue-600',

        'application/vnd.ms-excel': 'bg-emerald-500/10 text-emerald-600',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'bg-emerald-500/10 text-emerald-600',

        'text/plain': 'bg-sky-500/10 text-sky-600',
        'text/csv': 'bg-emerald-500/10 text-emerald-600',
        'application/zip': 'bg-orange-500/10 text-orange-600',
        'application/x-rar-compressed': 'bg-orange-500/10 text-orange-600',
    };

    return map[mimeType] ?? 'bg-zinc-500/10 text-zinc-600';
};
