import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BarChart3, TrendingUp, IndianRupee, ShieldCheck, Package, FolderKanban, Download } from 'lucide-react';
import { downloadCsv } from '../utils/exportCsv';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        projects: [],
        quotes: [],
        amc: [],
        lowStock: [],
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const [pRes, qRes, aRes, sRes] = await Promise.all([
            supabase.from('projects').select('id, title, project_code, status, contract_value, created_at, clients(company_name, name)').order('created_at', { ascending: false }),
            supabase.from('quotations').select('id, quote_number, status, grand_total, created_at, projects(title, clients(company_name, name))').order('created_at', { ascending: false }),
            supabase.from('amc_contracts').select('id, contract_number, status, annual_value, start_date, end_date, clients(company_name, name)').order('end_date'),
            supabase.from('products').select('id, sku, name, current_stock, min_stock_alert, selling_price'),
        ]);
        setData({
            projects: pRes.data || [],
            quotes: qRes.data || [],
            amc: aRes.data || [],
            lowStock: (sRes.data || []).filter(p => p.current_stock <= p.min_stock_alert),
        });
        setLoading(false);
    };

    const totalRevenue = data.projects.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.contract_value || 0), 0);
    const quotedValue = data.quotes.filter(q => q.status !== 'REJECTED').reduce((s, q) => s + Number(q.grand_total || 0), 0);
    const acceptedValue = data.quotes.filter(q => q.status === 'ACCEPTED').reduce((s, q) => s + Number(q.grand_total || 0), 0);
    const amcRevenue = data.amc.filter(a => a.status === 'ACTIVE').reduce((s, a) => s + Number(a.annual_value || 0), 0);
    const winRate = data.quotes.length > 0 ? Math.round((data.quotes.filter(q => q.status === 'ACCEPTED').length / data.quotes.filter(q => ['ACCEPTED', 'REJECTED'].includes(q.status)).length) * 100) || 0 : 0;

    const projectsByStatus = data.projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});

    const Section = ({ title, icon: Icon, color = 'text-slate-500', children, onExport }) => (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                    <Icon className={`w-4 h-4 mr-2 ${color}`} />{title}
                </h3>
                {onExport && (
                    <button onClick={onExport} className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium gap-1 px-2 py-1 rounded hover:bg-slate-100">
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                )}
            </div>
            {children}
        </div>
    );

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-violet-500" />
                    Reports & Analytics
                </h2>
                <p className="text-slate-500 text-sm mt-1">Business summary across projects, billing, AMC, and inventory.</p>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Completed Revenue', value: fmt(totalRevenue), sub: `${data.projects.filter(p => p.status === 'COMPLETED').length} projects`, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { label: 'Accepted Quotes', value: fmt(acceptedValue), sub: `of ${fmt(quotedValue)} total quoted`, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'Active AMC Revenue', value: fmt(amcRevenue), sub: `${data.amc.filter(a => a.status === 'ACTIVE').length} active contracts`, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { label: 'Quote Win Rate', value: `${winRate}%`, sub: `${data.quotes.filter(q => q.status === 'ACCEPTED').length} of ${data.quotes.filter(q => ['ACCEPTED', 'REJECTED'].includes(q.status)).length} decided`, color: 'text-violet-600 bg-violet-50 border-violet-100' },
                ].map(k => (
                    <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{k.label}</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{k.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Projects Report */}
                <Section title="Projects by Status" icon={FolderKanban} color="text-violet-500"
                    onExport={() => downloadCsv('projects_report', [
                        { label: 'Project', key: 'title' },
                        { label: 'Code', key: 'project_code' },
                        { label: 'Client', key: 'client', format: (_, r) => r.clients?.company_name || r.clients?.name || '' },
                        { label: 'Status', key: 'status' },
                        { label: 'Contract (₹)', key: 'contract_value' },
                        { label: 'Date', key: 'created_at', format: v => fmtD(v) },
                    ], data.projects)}
                >
                    <div className="p-4 space-y-2">
                        {['LEAD', 'SURVEY', 'QUOTED', 'WON', 'INSTALLING', 'COMPLETED', 'LOST'].map(s => {
                            const count = projectsByStatus[s] || 0;
                            const pct = data.projects.length > 0 ? (count / data.projects.length) * 100 : 0;
                            const colors = { LEAD: 'bg-slate-400', SURVEY: 'bg-blue-400', QUOTED: 'bg-violet-400', WON: 'bg-amber-400', INSTALLING: 'bg-orange-400', COMPLETED: 'bg-emerald-500', LOST: 'bg-red-400' };
                            return (
                                <div key={s} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 w-20 text-right">{s}</span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${colors[s]}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 w-5">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {data.projects.slice(0, 8).map(p => (
                            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between text-sm hover:bg-slate-50">
                                <div>
                                    <p className="font-medium text-slate-800">{p.title}</p>
                                    <p className="text-xs text-slate-400">{p.clients?.company_name || p.clients?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-700">{p.contract_value ? fmt(p.contract_value) : '—'}</p>
                                    <span className="text-xs text-slate-400">{p.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Quotations Report */}
                <Section title="Quotation Summary" icon={TrendingUp} color="text-amber-500"
                    onExport={() => downloadCsv('quotations_report', [
                        { label: 'Quote #', key: 'quote_number' },
                        { label: 'Project', key: 'project', format: (_, r) => r.projects?.title || '' },
                        { label: 'Client', key: 'client', format: (_, r) => r.projects?.clients?.company_name || r.projects?.clients?.name || '' },
                        { label: 'Status', key: 'status' },
                        { label: 'Total (₹)', key: 'grand_total' },
                        { label: 'Date', key: 'created_at', format: v => fmtD(v) },
                    ], data.quotes)}
                >
                    {/* Status Breakdown */}
                    <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100">
                        {['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map(s => {
                            const cnt = data.quotes.filter(q => q.status === s).length;
                            const dot = { DRAFT: 'bg-slate-400', SENT: 'bg-blue-400', ACCEPTED: 'bg-emerald-500', REJECTED: 'bg-red-400', EXPIRED: 'bg-orange-400' };
                            return (
                                <div key={s} className="p-3 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s}</p>
                                    <p className="text-xl font-black text-slate-800 mt-1">{cnt}</p>
                                    <div className={`w-2 h-2 rounded-full ${dot[s]} mx-auto mt-1`} />
                                </div>
                            );
                        })}
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {data.quotes.slice(0, 8).map(q => (
                            <div key={q.id} className="px-4 py-2.5 flex items-center justify-between text-sm hover:bg-slate-50">
                                <div>
                                    <p className="font-mono font-bold text-slate-800 text-xs">{q.quote_number}</p>
                                    <p className="text-xs text-slate-400 truncate max-w-[160px]">{q.projects?.title}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-700">{fmt(q.grand_total)}</p>
                                    <span className="text-xs text-slate-400">{q.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* AMC Report */}
                <Section title="AMC Contract Summary" icon={ShieldCheck} color="text-blue-500"
                    onExport={() => downloadCsv('amc_report', [
                        { label: 'Contract #', key: 'contract_number' },
                        { label: 'Client', key: 'client', format: (_, r) => r.clients?.company_name || r.clients?.name || '' },
                        { label: 'Status', key: 'status' },
                        { label: 'Annual Value ₹', key: 'annual_value' },
                        { label: 'Start', key: 'start_date', format: v => fmtD(v) },
                        { label: 'End', key: 'end_date', format: v => fmtD(v) },
                    ], data.amc)}
                >
                    <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                        {['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'].map(s => {
                            const cnt = data.amc.filter(a => a.status === s).length;
                            const val = data.amc.filter(a => a.status === s).reduce((t, a) => t + Number(a.annual_value || 0), 0);
                            return (
                                <div key={s} className="p-3 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase">{s}</p>
                                    <p className="text-xl font-black text-slate-800">{cnt}</p>
                                    <p className="text-[10px] text-slate-400">{fmt(val)}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {data.amc.length === 0
                            ? <p className="p-6 text-center text-sm text-slate-400">No AMC contracts added yet.</p>
                            : data.amc.map(a => (
                                <div key={a.id} className="px-4 py-2.5 flex items-center justify-between text-sm hover:bg-slate-50">
                                    <div>
                                        <p className="font-mono font-bold text-slate-800 text-xs">{a.contract_number}</p>
                                        <p className="text-xs text-slate-400">{a.clients?.company_name || a.clients?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-700">{fmt(a.annual_value)}/yr</p>
                                        <p className="text-xs text-slate-400">exp: {fmtD(a.end_date)}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </Section>

                {/* Low Stock Report */}
                <Section title="Stock Health Report" icon={Package} color="text-red-500"
                    onExport={() => downloadCsv('low_stock_report', [
                        { label: 'SKU', key: 'sku' },
                        { label: 'Name', key: 'name' },
                        { label: 'Stock', key: 'current_stock' },
                        { label: 'Min Alert', key: 'min_stock_alert' },
                        { label: 'Sell Price ₹', key: 'selling_price' },
                    ], data.lowStock)}
                >
                    {data.lowStock.length === 0
                        ? <div className="p-8 text-center"><p className="text-emerald-600 font-semibold text-sm">✓ All stock levels healthy</p></div>
                        : (
                            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                                {data.lowStock.map(p => (
                                    <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                                            <p className="text-xs font-mono text-slate-400">{p.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${p.current_stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>{p.current_stock}</p>
                                            <p className="text-xs text-slate-400">min: {p.min_stock_alert}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </Section>
            </div>
        </div>
    );
};

export default Reports;
