/** Simple palette helpers used across the UI */

export function fileColor(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'bg-violet-500/10';
    if (mimeType === 'application/pdf') return 'bg-rose-500/10';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'bg-emerald-500/10';
    if (mimeType.includes('word')) return 'bg-blue-500/10';
    return 'bg-zinc-500/10';
}
