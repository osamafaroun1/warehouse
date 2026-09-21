import ExcelJS from 'exceljs';

type CSVColumn<T> = {
    key: keyof T;
    label: string;
    format?: (value: unknown, row: T) => string;
};

async function writeXlsxFile(filename: string, buffer: ArrayBuffer) {
    const isTauri = '__TAURI_INTERNALS__' in window;

    if (isTauri) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');

        const path = await save({
            defaultPath: `${filename}.xlsx`,
            filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        });

        if (!path) return; // user cancelled

        await writeFile(path, new Uint8Array(buffer));
        return;
    }

    // Browser fallback
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Detects if a string contains Arabic (or other RTL) characters.
 * Used to auto-enable right-to-left alignment/reading order per cell.
 */
function isRTL(str: string): boolean {
    return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(str);
}

/**
 * Rough width estimate so columns don't overflow. Arabic/CJK glyphs
 * are visually wider than Latin ones, so they're weighted higher.
 */
function estimateColumnWidth(values: string[], label: string): number {
    const widthOf = (str: string) =>
        [...str].reduce((sum, ch) => sum + (/[\u0591-\u07FF\u4e00-\u9fff]/.test(ch) ? 1.8 : 1), 0);

    const maxContentWidth = Math.max(widthOf(label), ...values.map(widthOf));
    return Math.min(Math.max(maxContentWidth + 4, 10), 60); // clamp 10–60
}

export async function exportCSV(filename: string, rows: Record<string, unknown>[]) {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');

    sheet.columns = headers.map((h) => ({
        header: h,
        key: h,
        width: estimateColumnWidth(
            rows.map((r) => String(r[h] ?? '')),
            h,
        ),
    }));

    // Bold header row
    sheet.getRow(1).font = { bold: true };

    rows.forEach((row) => {
        const excelRow = sheet.addRow(row);
        excelRow.eachCell((cell) => {
            const str = String(cell.value ?? '');
            cell.alignment = {
                wrapText: true,
                vertical: 'top',
                horizontal: isRTL(str) ? 'right' : 'left',
                readingOrder: isRTL(str) ? 'rtl' : 'ltr',
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    await writeXlsxFile(filename, buffer as ArrayBuffer);
}

export async function exportCSV2<T extends Record<string, unknown>>(
    filename: string,
    rows: T[],
    columns: CSVColumn<T>[],
) {
    if (!rows.length) return;

    /**
     * Get nested value from object using dot notation
     * @example getNestedValue({ customer: { name: 'John' } }, 'customer.name') // 'John'
     */
    const getNestedValue = (obj: T, path: string): unknown => {
        if (!path || !obj) return undefined;

        const keys = path.split('.');
        let current: any = obj;

        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return undefined;
            }
            current = current[key];
        }

        return current;
    };

    const resolveRow = (row: T): Record<string, string> => {
        const result: Record<string, string> = {};
        for (const col of columns) {
            const keyPath = String(col.key);
            const rawValue = getNestedValue(row, keyPath);
            const value = col.format ? col.format(rawValue, row) : rawValue;
            result[col.label] = String(value ?? '');
        }
        return result;
    };

    const resolvedRows = rows.map(resolveRow);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');

    sheet.columns = columns.map((col) => ({
        header: col.label,
        key: col.label,
        width: estimateColumnWidth(
            resolvedRows.map((r) => r[col.label]),
            col.label,
        ),
    }));

    sheet.getRow(1).font = { bold: true };

    resolvedRows.forEach((row) => {
        const excelRow = sheet.addRow(row);
        excelRow.eachCell((cell) => {
            const str = String(cell.value ?? '');
            cell.alignment = {
                wrapText: true,
                vertical: 'top',
                horizontal: isRTL(str) ? 'right' : 'left',
                readingOrder: isRTL(str) ? 'rtl' : 'ltr',
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    await writeXlsxFile(filename, buffer as ArrayBuffer);
}

