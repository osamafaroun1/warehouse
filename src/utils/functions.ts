export function formatDate(value?: string | Date | null, opts?: Intl.DateTimeFormatOptions): string {
    if (!value) return '—';
    try {
        const d = typeof value === 'string' ? new Date(value) : value;
        return d.toLocaleDateString('ar-SY', opts ?? {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return String(value);
    }
}

export function formatDateTime(value?: string | Date | null): string {
    return formatDate(value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

export function formatLabel(value?: string | null): string {
    if (!value) return '—';
    return value.charAt(0).toUpperCase() + value.slice(1);
}
