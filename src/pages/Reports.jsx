import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BarChart3, TrendingUp, ShieldCheck, Package, FolderKanban, Download, FileText } from 'lucide-react';
import { downloadCsv } from '../utils/exportCsv';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLORS = {
    LEAD: '#94a3b8',
    SURVEY: '#60a5fa',
    QUOTED: '#a78bfa',
    WON: '#fbbf24',
    INSTALLING: '#fb923c',
    COMPLETED: '#10b981',
    LOST: '#f87171'
};

const QUOTE_COLORS = {
    DRAFT: '#94a3b8',
    SENT: '#60a5fa',
    ACCEPTED: '#10b981',
    REJECTED: '#f87171',
    EXPIRED: '#fbbf24'
};

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        projects: [],
        quotes: [],
        amc: [],
        lowStock: [],
        purchases: [],
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const [pRes, qRes, aRes, sRes] = await Promise.all([
            supabase.from('projects').select('id, title, project_code, status, contract_value, created_at, clients(company_name, name)').order('created_at', { ascending: false }),
            supabase.from('quotations').select('id, quote_number, status, grand_total, created_at, projects(title, clients(company_name, name))').order('created_at', { ascending: false }),
            supabase.from('amc_contracts').select('id, contract_number, status, annual_value, start_date, end_date, clients(company_name, name)').order('end_date'),
            supabase.from('products').select('id, sku, name, current_stock, min_stock_alert, selling_price'),
            supabase.from('stock_transactions').select('quantity, unit_cost').eq('transaction_type', 'IN'),
        ]);
        setData({
            projects: pRes.data || [],
            quotes: qRes.data || [],
            amc: aRes.data || [],
            lowStock: (sRes.data || []).filter(p => p.current_stock <= p.min_stock_alert),
            purchases: tRes?.data || [],
        });
        setLoading(false);
    };

    const totalRevenue = data.projects.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.contract_value || 0), 0);
    const quotedValue = data.quotes.filter(q => q.status !== 'REJECTED').reduce((s, q) => s + Number(q.grand_total || 0), 0);
    const acceptedValue = data.quotes.filter(q => q.status === 'ACCEPTED').reduce((s, q) => s + Number(q.grand_total || 0), 0);
    const amcRevenue = data.amc.filter(a => a.status === 'ACTIVE').reduce((s, a) => s + Number(a.annual_value || 0), 0);
    const winRate = data.quotes.length > 0 ? Math.round((data.quotes.filter(q => q.status === 'ACCEPTED').length / data.quotes.filter(q => ['ACCEPTED', 'REJECTED'].includes(q.status)).length) * 100) || 0 : 0;

    // P&L Calculations
    const totalPurchases = data.purchases.reduce((s, t) => s + (Number(t.quantity || 0) * Number(t.unit_cost || 0)), 0);
    const grossRevenue = acceptedValue + amcRevenue + totalRevenue;
    const netProfit = grossRevenue - totalPurchases;
    const marginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    // Formatting Data for Recharts
    const projectStatusData = Object.entries(
        data.projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
    ).map(([name, value]) => ({ name, value }));

    const quoteStatusData = Object.entries(
        data.quotes.reduce((acc, q) => { acc[q.status] = (acc[q.status] || 0) + 1; return acc; }, {})
    ).map(([name, value]) => ({ name, value }));

    const amcStatusData = Object.entries(
        data.amc.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {})
    ).map(([name, value]) => ({ name, value }));


    const Section = ({ title, icon: Icon, color = 'text-slate-500', children, onExport }) => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                    <Icon className={`w-4 h-4 mr-2 ${color}`} />{title}
                </h3>
                {onExport && (
                    <button onClick={onExport} className="inline-flex items-center text-xs text-slate-500 hover:text-blue-600 font-medium gap-1 px-2.5 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                )}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    );

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" /></div>;

    return (
        <div className="flex flex-col gap-6 pb-10">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-violet-500" />
                    Reports & Analytics
                </h2>
                <p className="text-slate-500 text-sm mt-1">Comprehensive business overview tracking active projects, quotes, contracts, and inventory health.</p>
            </div>

            {/* Premium KPI Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Gross Revenue', icon: TrendingUp, value: fmt(grossRevenue), sub: 'Won Quotes + AMC + Projects', color: 'emerald' },
                    { label: 'Total Purchases (Expenses)', icon: Package, value: fmt(totalPurchases), sub: 'Inventory sourcing cost', color: 'rose' },
                    { label: 'Net Profit / Margin', icon: BarChart3, value: fmt(netProfit), sub: `Gross Margin: ${marginPct}%`, color: netProfit >= 0 ? 'amber' : 'red' },
                    { label: 'Quote Win Rate', icon: TrendingUp, value: `${winRate}%`, sub: `${data.quotes.filter(q => q.status === 'ACCEPTED').length} won / ${data.quotes.filter(q => q.status === 'REJECTED').length} lost`, color: 'violet' },
                ].map(k => (
                    <div key={k.label} className={`relative overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200 p-5 group hover:border-${k.color}-300 transition-colors`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${k.color}-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
                        <div className="relative">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{k.label}</p>
                            <p className={`text-2xl font-black text-slate-800 mt-2`}>{k.value}</p>
                            <p className="text-xs text-slate-500 mt-2 font-medium">{k.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dual Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Projects Breakdown */}
                <Section title="Active Projects Pipeline" icon={FolderKanban} color="text-violet-500"
                    onExport={() => downloadCsv('projects_report', [
                        { label: 'Project', key: 'title' },
                        { label: 'Code', key: 'project_code' },
                        { label: 'Client', key: 'client', format: (_, r) => r.clients?.company_name || r.clients?.name || '' },
                        { label: 'Status', key: 'status' },
                        { label: 'Contract (₹)', key: 'contract_value' },
                        { label: 'Date', key: 'created_at', format: v => fmtD(v) },
                    ], data.projects)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                        <div className="h-64 p-4 border-b md:border-b-0 md:border-r border-slate-100 flex items-center justify-center">
                            {projectStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {projectStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => [`${value} Projects`, 'Count']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p className="text-slate-400 text-sm">No project data</p>}
                        </div>
                        <div className="p-0 overflow-y-auto max-h-64">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 font-medium text-xs">Project</th>
                                        <th className="px-4 py-2 font-medium text-xs text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.projects.slice(0, 8).map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-800 truncate max-w-[150px]">{p.title}</p>
                                                <p className="text-xs text-slate-500">{p.clients?.company_name || p.clients?.name}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="font-bold text-slate-700">{p.contract_value ? fmt(p.contract_value) : '—'}</p>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium tracking-wide" style={{ backgroundColor: `${STATUS_COLORS[p.status] || '#cbd5e1'}20`, color: STATUS_COLORS[p.status] || '#64748b' }}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Section>

                {/* Quotation Conversions */}
                <Section title="Quotation Funnel" icon={TrendingUp} color="text-amber-500"
                    onExport={() => downloadCsv('quotations_report', [
                        { label: 'Quote #', key: 'quote_number' },
                        { label: 'Project', key: 'project', format: (_, r) => r.projects?.title || '' },
                        { label: 'Client', key: 'client', format: (_, r) => r.projects?.clients?.company_name || r.projects?.clients?.name || '' },
                        { label: 'Status', key: 'status' },
                        { label: 'Total (₹)', key: 'grand_total' },
                        { label: 'Date', key: 'created_at', format: v => fmtD(v) },
                    ], data.quotes)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                        <div className="h-64 p-4 border-b md:border-b-0 md:border-r border-slate-100 flex items-center justify-center">
                            {quoteStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={quoteStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={70} />
                                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {quoteStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={QUOTE_COLORS[entry.name] || '#cbd5e1'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-slate-400 text-sm">No quote data</p>}
                        </div>
                        <div className="p-0 overflow-y-auto max-h-64">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 font-medium text-xs">Quote</th>
                                        <th className="px-4 py-2 font-medium text-xs text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.quotes.slice(0, 8).map(q => (
                                        <tr key={q.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-mono font-bold text-slate-800 text-xs">{q.quote_number}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{q.projects?.title || q.projects?.clients?.company_name}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="font-bold text-slate-700">{fmt(q.grand_total)}</p>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium tracking-wide" style={{ backgroundColor: `${QUOTE_COLORS[q.status] || '#cbd5e1'}20`, color: QUOTE_COLORS[q.status] || '#64748b' }}>
                                                    {q.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Section>

            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* AMC Contracts */}
                <Section title="Active AMC Tracker" icon={ShieldCheck} color="text-blue-500"
                    onExport={() => downloadCsv('amc_report', [
                        { label: 'Contract #', key: 'contract_number' },
                        { label: 'Client', key: 'client', format: (_, r) => r.clients?.company_name || r.clients?.name || '' },
                        { label: 'Status', key: 'status' },
                        { label: 'Annual Value ₹', key: 'annual_value' },
                        { label: 'Start', key: 'start_date', format: v => fmtD(v) },
                        { label: 'End', key: 'end_date', format: v => fmtD(v) },
                    ], data.amc)}
                >
                    <div className="overflow-y-auto max-h-72">
                        {data.amc.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-400">No AMC contracts tracked.</p>
                        ) : (
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-xs text-slate-600">Contract</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-slate-600">Client</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-slate-600 text-right">Expiry</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-slate-600 text-right">Value (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.amc.map(a => (
                                        <tr key={a.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-bold text-slate-800 text-xs">{a.contract_number}</span>
                                                <div className="mt-1">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                        {a.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{a.clients?.company_name || a.clients?.name}</td>
                                            <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">{fmtD(a.end_date)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(a.annual_value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Section>

                {/* Low Stock Alerts */}
                <Section title="Inventory Health Alerts" icon={Package} color="text-red-500"
                    onExport={() => downloadCsv('low_stock_report', [
                        { label: 'SKU', key: 'sku' },
                        { label: 'Name', key: 'name' },
                        { label: 'Stock', key: 'current_stock' },
                        { label: 'Min Alert', key: 'min_stock_alert' },
                        { label: 'Sell Price ₹', key: 'selling_price' },
                    ], data.lowStock)}
                >
                    <div className="overflow-y-auto max-h-72 bg-white">
                        {data.lowStock.length === 0 ? (
                            <div className="p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <p className="text-slate-800 font-medium h-full">Inventory is strictly optimized</p>
                                <p className="text-slate-500 text-sm mt-1">All monitored product lines are currently operating strictly above minimum reserve levels.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-red-50/50 text-slate-600 sticky top-0 border-b border-red-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-xs">Product</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-center">Min Req</th>
                                        <th className="px-4 py-3 font-semibold text-xs text-right">Current Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.lowStock.map(p => (
                                        <tr key={p.id} className="hover:bg-red-50/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-800">{p.name}</p>
                                                <p className="text-xs font-mono text-slate-500 mt-0.5">{p.sku}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-500 font-mono">{p.min_stock_alert}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-bold font-mono text-sm ${p.current_stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {p.current_stock}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Section>

            </div>
        </div>
    );
};

export default Reports;
