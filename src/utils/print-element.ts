// lib/print/print-element.ts
export function printElement(el: HTMLElement | undefined | null, options?: { title?: string; rtl?: boolean }) {
    if (!el) return;

    // Pull in every stylesheet currently loaded by the app (Tailwind's compiled CSS included)
    const styleTags = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style'),
    )
        .map((node) => node.outerHTML)
        .join('\n');

    const html = `<!DOCTYPE html>
        <html dir="${options?.rtl ? 'rtl' : 'ltr'}">
        <head>
            <meta charset="UTF-8" />
            <title>${options?.title ?? ''}</title>
            ${styleTags}
            <style>
                @page {
                    margin: 0;
                }
                body { margin: 0; padding: 24px; background: #f0f2f5; }
                @media print {
                    body { padding: 0; background: #fff; }
                }
            </style>
        </head>
        <body>
            ${el.outerHTML}
        </body>
        </html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);

    iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    };

    iframe.srcdoc = html;
}
