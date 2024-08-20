/**
 * exportCsv.js — Reusable CSV export and print utility
 */

/**
 * Download rows as a .csv file.
 * @param {string} filename - Downloaded file name (without extension)
 * @param {Array<{label: string, key: string, format?: Function}>} columns
 * @param {Array<Object>} rows
 */
export const downloadCsv = (filename, columns, rows) => {
    const escape = (v) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
    };

    const header = columns.map(c => escape(c.label)).join(',');
    const body = rows.map(row =>
        columns.map(c => escape(c.format ? c.format(row[c.key], row) : row[c.key])).join(',')
    );

    const csv = [header, ...body].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

/**
 * Open a minimal print window with an HTML table.
 * @param {string} title
 * @param {Array<{label: string, key: string, format?: Function}>} columns
 * @param {Array<Object>} rows
 */
export const printTable = (title, columns, rows) => {
    const header = columns.map(c => `<th>${c.label}</th>`).join('');
    const body = rows.map(row =>
        `<tr>${columns.map(c => `<td>${c.format ? c.format(row[c.key], row) : (row[c.key] ?? '')}</td>`).join('')}</tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
    h1   { font-size: 16px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #1e293b; color: white; }
    tr:nth-child(even) { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p style="color:#64748b;font-size:10px">Generated: ${new Date().toLocaleString('en-IN')}</p>
  <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
};
