function parsePartialDate(dateStr: string, boundary: 'start' | 'end'): Date {
    const parts = dateStr.split('-').map(Number);
    const year = parts[0];

    if (boundary === 'start') {
        const month = parts[1] ?? 1;
        const day = parts[2] ?? 1;
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }

    // end
    if (parts.length === 1) {
        // Year only → December 31
        return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    } else if (parts.length === 2) {
        // Year-month → last day of that month
        const month = parts[1];
        const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
    } else {
        // Full date → that day at 23:59:59.999
        const month = parts[1];
        const day = parts[2];
        return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    }
}

export function hasText(value?: string | null): boolean {
    return (value?.trim() ?? '').length > 0;
}

export function expandDateRange(input: string | { from?: string; to?: string }): { from: Date; to: Date } {
    let fromStr: string;
    let toStr: string | undefined;

    if (typeof input === 'string') {
        fromStr = input;
        toStr = undefined;
    } else {
        if (!input.from) throw new Error('"from" is required');
        fromStr = input.from;
        toStr = input.to;
    }

    const from = parsePartialDate(fromStr, 'start');
    const to = toStr ? parsePartialDate(toStr, 'end') : parsePartialDate(fromStr, 'end');

    return { from, to };
}
