import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Download, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const REQUIRED_COLS = ['sku', 'name', 'base_price', 'selling_price'];
const ALL_COLS = [
    { key: 'sku', label: 'SKU *', hint: 'Unique product code. e.g. CAM-HIK-2MP' },
    { key: 'name', label: 'Name *', hint: 'Full product name' },
    { key: 'brand', label: 'Brand', hint: 'e.g. Hikvision' },
    { key: 'base_price', label: 'Base Price *', hint: 'Buying cost in ₹. Numeric only.' },
    { key: 'selling_price', label: 'Selling Price *', hint: 'Default sell price in ₹. Numeric only.' },
    { key: 'tax_rate', label: 'Tax Rate %', hint: 'Default 18. Numeric.' },
    { key: 'unit', label: 'Unit', hint: 'e.g. Pieces, Roll, Reel. Default: Pieces' },
    { key: 'current_stock', label: 'Opening Stock', hint: 'Numeric, default 0' },
    { key: 'min_stock_alert', label: 'Min Stock Alert', hint: 'Numeric, default 5' },
    { key: 'description', label: 'Description', hint: 'Optional product description' },
];

const SAMPLE_CSV = `sku,name,brand,base_price,selling_price,tax_rate,unit,current_stock,min_stock_alert,description
CAM-HIK-NEW-01,Hikvision 4MP ColorVu Dome,Hikvision,3500,5500,18,Pieces,10,5,4MP full-color 24/7 with built-in mic
NVR-CPP-32CH,CP Plus 32CH NVR,CP Plus,14000,22000,18,Pieces,3,2,32CH H.265+ NVR with 4 SATA bays
CAB-COAX-100M,RG59 Cable 100m Roll,Generic,700,1200,18,Roll,20,5,RG59 copper coaxial with power core
`;

const parseCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line, idx) => {
        const vals = line.split(',').map(v => v.trim());
        const row = { _lineNo: idx + 2 };
        headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
        return row;
    });
    return { headers, rows };
};

const validateRow = (row) => {
    const errors = [];
    REQUIRED_COLS.forEach(col => {
        if (!row[col]) errors.push(`${col} is required`);
    });
    if (row.base_price && isNaN(Number(row.base_price))) errors.push('base_price must be numeric');
    if (row.selling_price && isNaN(Number(row.selling_price))) errors.push('selling_price must be numeric');
    if (row.tax_rate && isNaN(Number(row.tax_rate))) errors.push('tax_rate must be numeric');
    if (row.current_stock && isNaN(Number(row.current_stock))) errors.push('current_stock must be numeric');
    if (row.min_stock_alert && isNaN(Number(row.min_stock_alert))) errors.push('min_stock_alert must be numeric');
    return errors;
};

const ProductImport = () => {
    const navigate = useNavigate();
    const fileRef = useRef();
    const [stage, setStage] = useState('idle');   // idle | preview | importing | done
    const [preview, setPreview] = useState([]);         // { row, errors }[]
    const [results, setResults] = useState([]);         // { sku, ok, msg }[]
    const [fileName, setFileName] = useState('');

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const { rows } = parseCsv(ev.target.result);
            const validated = rows.map(row => ({ row, errors: validateRow(row) }));
            setPreview(validated);
            setStage('preview');
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        setStage('importing');
        const res = [];
        for (const { row, errors } of preview) {
            if (errors.length > 0) {
                res.push({ sku: row.sku || `Line ${row._lineNo}`, ok: false, msg: errors.join('; ') });
                continue;
            }
            const payload = {
                sku: row.sku,
                name: row.name,
                brand: row.brand || null,
                base_price: Number(row.base_price),
                selling_price: Number(row.selling_price),
                tax_rate: Number(row.tax_rate) || 18,
                unit: row.unit || 'Pieces',
                current_stock: Number(row.current_stock) || 0,
                min_stock_alert: Number(row.min_stock_alert) || 5,
                description: row.description || null,
            };
            const { error } = await supabase.from('products').upsert([payload], { onConflict: 'sku' });
            res.push({ sku: row.sku, ok: !error, msg: error ? error.message : 'Imported successfully' });
        }
        setResults(res);
        setStage('done');
    };

    const downloadTemplate = () => {
        const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'product_import_template.csv';
        a.click();
    };

    const validRows = preview.filter(p => p.errors.length === 0).length;
    const invalidRows = preview.filter(p => p.errors.length > 0).length;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div>
                <button onClick={() => navigate('/products')} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-4 group">
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Inventory
                </button>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Upload className="w-6 h-6 mr-2 text-violet-500" />
                    Bulk Product Import
                </h2>
                <p className="text-slate-500 text-sm mt-1">Upload a CSV file to import or update products in bulk.</p>
            </div>

            {/* Step 1: Column Guide + Upload */}
            {(stage === 'idle' || stage === 'preview') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column Guide */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center"><FileText className="w-4 h-4 mr-2 text-slate-400" /> CSV Column Reference</h3>
                            <button onClick={downloadTemplate} className="inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1.5 rounded-lg transition-colors">
                                <Download className="w-3.5 h-3.5 mr-1" /> Download Template
                            </button>
                        </div>
                        <table className="min-w-full text-xs divide-y divide-slate-100">
                            <thead><tr>
                                <th className="px-4 py-2 text-left font-semibold text-slate-500">Column</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-500">Notes</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {ALL_COLS.map(c => (
                                    <tr key={c.key} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-mono text-slate-700">
                                            {c.key}
                                            {REQUIRED_COLS.includes(c.key) && <span className="text-red-500 ml-1">*</span>}
                                        </td>
                                        <td className="px-4 py-2 text-slate-500">{c.hint}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Drop Zone */}
                    <div className="flex flex-col gap-4">
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors group"
                        >
                            <Upload className="w-10 h-10 text-slate-300 group-hover:text-violet-400 transition-colors mb-3" />
                            <p className="text-sm font-semibold text-slate-600 group-hover:text-violet-700">Click to select CSV file</p>
                            <p className="text-xs text-slate-400 mt-1">{fileName || 'No file selected'}</p>
                            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                        </div>

                        {stage === 'preview' && (
                            <div className={`p-4 rounded-xl border ${invalidRows > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                <p className="text-sm font-bold mb-1 text-slate-700">Preview: {preview.length} rows detected</p>
                                <div className="flex gap-4 text-xs">
                                    <span className="text-emerald-700 font-semibold">✓ {validRows} valid</span>
                                    {invalidRows > 0 && <span className="text-red-600 font-semibold">✗ {invalidRows} with errors</span>}
                                </div>
                                {validRows > 0 && (
                                    <button
                                        onClick={handleImport}
                                        className="mt-3 inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700"
                                    >
                                        <Upload className="w-4 h-4 mr-1.5" />
                                        Import {validRows} valid row{validRows !== 1 ? 's' : ''}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Importing spinner */}
            {stage === 'importing' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-slate-600 font-medium">Importing products, please wait...</p>
                </div>
            )}

            {/* Preview Table */}
            {stage === 'preview' && preview.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm">Row Preview</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs divide-y divide-slate-100">
                            <thead><tr className="bg-white">
                                {['#', 'SKU', 'Name', 'Brand', 'Buy', 'Sell', 'Stock', 'Status'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {preview.map(({ row, errors }, i) => (
                                    <tr key={i} className={errors.length > 0 ? 'bg-red-50' : 'hover:bg-slate-50'}>
                                        <td className="px-3 py-2 text-slate-400">{row._lineNo}</td>
                                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{row.sku}</td>
                                        <td className="px-3 py-2 text-slate-700">{row.name}</td>
                                        <td className="px-3 py-2 text-slate-500">{row.brand || '—'}</td>
                                        <td className="px-3 py-2 text-slate-700">₹{row.base_price}</td>
                                        <td className="px-3 py-2 text-slate-700">₹{row.selling_price}</td>
                                        <td className="px-3 py-2 text-slate-700">{row.current_stock || '0'}</td>
                                        <td className="px-3 py-2">
                                            {errors.length === 0
                                                ? <span className="text-emerald-600 font-semibold">✓ OK</span>
                                                : <span className="text-red-600 font-semibold" title={errors.join('\n')}>✗ {errors[0]}</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results */}
            {stage === 'done' && (
                <div className="flex flex-col gap-4">
                    <div className={`p-5 rounded-xl border ${results.every(r => r.ok) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <p className="font-bold text-slate-800 text-base mb-1">Import Complete</p>
                        <p className="text-sm text-slate-600">
                            <span className="text-emerald-700 font-bold">{results.filter(r => r.ok).length} succeeded</span>
                            {results.some(r => !r.ok) && <> · <span className="text-red-600 font-bold">{results.filter(r => !r.ok).length} failed</span></>}
                        </p>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setStage('idle'); setPreview([]); setResults([]); setFileName(''); }}
                                className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100">
                                Import Another File
                            </button>
                            <button onClick={() => navigate('/products')}
                                className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                                View Inventory →
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="min-w-full text-sm divide-y divide-slate-100">
                            <thead><tr className="bg-slate-50">
                                <th className="px-4 py-2 text-left font-semibold text-slate-500 text-xs uppercase">SKU</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-500 text-xs uppercase">Result</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-500 text-xs uppercase">Message</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.map((r, i) => (
                                    <tr key={i} className={r.ok ? '' : 'bg-red-50'}>
                                        <td className="px-4 py-2.5 font-mono font-bold text-slate-700">{r.sku}</td>
                                        <td className="px-4 py-2.5">
                                            {r.ok
                                                ? <span className="flex items-center text-emerald-600 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Success</span>
                                                : <span className="flex items-center text-red-600 text-xs font-semibold"><XCircle className="w-3.5 h-3.5 mr-1" /> Failed</span>
                                            }
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-slate-500">{r.msg}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImport;
