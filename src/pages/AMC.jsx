import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ShieldCheck, Plus, Search, X, Save, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const STATUS_STYLE = {
    ACTIVE: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    EXPIRED: { label: 'Expired', cls: 'bg-red-100 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
};

const generateContractNo = () => {
    const y = new Date().getFullYear().toString().slice(-2);
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    return `AMC-${y}${m}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
};

const BLANK = {
    contract_number: '',
    project_id: '',
    client_id: '',
    status: 'ACTIVE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    annual_value: '',
    coverage_details: '',
    visit_frequency: 'Quarterly',
    notes: '',
};

const AMC = () => {
    const [contracts, setContracts] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ ...BLANK, contract_number: generateContractNo() });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editId, setEditId] = useState(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const [cRes, clRes, prRes] = await Promise.all([
            supabase.from('amc_contracts')
                .select('*, clients(name, company_name), projects(title, project_code)')
                .order('end_date', { ascending: true }),
            supabase.from('clients').select('id, name, company_name').order('company_name'),
            supabase.from('projects').select('id, title, project_code, client_id').order('title'),
        ]);
        if (!cRes.error) setContracts(cRes.data || []);
        if (!clRes.error) setClients(clRes.data || []);
        if (!prRes.error) setProjects(prRes.data || []);
        setLoading(false);
    };

    const openNew = () => {
        setEditId(null);
        setForm({ ...BLANK, contract_number: generateContractNo() });
        setError('');
        setIsOpen(true);
    };

    const openEdit = (c) => {
        setEditId(c.id);
        setForm({
            contract_number: c.contract_number,
            project_id: c.project_id || '',
            client_id: c.client_id,
            status: c.status,
            start_date: c.start_date,
            end_date: c.end_date,
            annual_value: c.annual_value,
            coverage_details: c.coverage_details || '',
            visit_frequency: c.visit_frequency || 'Quarterly',
            notes: c.notes || '',
        });
        setError('');
        setIsOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const payload = {
            ...form,
            project_id: form.project_id || null,
            annual_value: parseFloat(form.annual_value) || 0,
        };
        const { error: err } = editId
            ? await supabase.from('amc_contracts').update(payload).eq('id', editId)
            : await supabase.from('amc_contracts').insert([payload]);
        if (err) setError(err.message);
        else { setIsOpen(false); fetchAll(); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this AMC contract?')) return;
        await supabase.from('amc_contracts').delete().eq('id', editId);
        setIsOpen(false);
        fetchAll();
    };

    // Auto-fill client when project is selected
    const handleProjectChange = (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        setForm(f => ({ ...f, project_id: projectId, client_id: proj?.client_id || f.client_id }));
    };

    const filtered = contracts.filter(c => {
        const q = search.toLowerCase();
        return (
            c.contract_number?.toLowerCase().includes(q) ||
            c.clients?.company_name?.toLowerCase().includes(q) ||
            c.clients?.name?.toLowerCase().includes(q) ||
            c.projects?.title?.toLowerCase().includes(q)
        );
    });

    // Split into expiring soon (≤60 days) and rest
    const expiringSoon = filtered.filter(c => {
        const d = daysUntilExpiry(c.end_date);
        return c.status === 'ACTIVE' && d !== null && d <= 60 && d >= 0;
    });

    const field = (label, children, required) => (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {children}
        </div>
    );
    const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white";

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <ShieldCheck className="w-6 h-6 mr-2 text-blue-500" />
                        AMC Contracts
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Track Annual Maintenance Contracts and upcoming renewals.</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0">
                    <Plus className="w-4 h-4 mr-1.5" /> New AMC Contract
                </button>
            </div>

            {/* Expiry Alerts */}
            {expiringSoon.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> {expiringSoon.length} contract{expiringSoon.length > 1 ? 's' : ''} expiring within 60 days
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {expiringSoon.map(c => {
                            const days = daysUntilExpiry(c.end_date);
                            return (
                                <button key={c.id} onClick={() => openEdit(c)}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:shadow-sm ${days <= 30 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                    <Clock className="w-3 h-3 mr-1.5" />
                                    {c.contract_number} — expiry in <span className="ml-1 font-black">{days}d</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search by contract, client, project..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            {['Contract #', 'Client', 'Project', 'Status', 'Start', 'End', 'Annual Value', 'Visits', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="9" className="py-14 text-center text-slate-400">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="9" className="py-14 text-center">
                                <ShieldCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">No AMC contracts yet.</p>
                            </td></tr>
                        ) : filtered.map(c => {
                            const meta = STATUS_STYLE[c.status] || STATUS_STYLE.ACTIVE;
                            const days = daysUntilExpiry(c.end_date);
                            const expiryClass = days !== null && days <= 30 && c.status === 'ACTIVE' ? 'text-red-600 font-bold' : days !== null && days <= 60 && c.status === 'ACTIVE' ? 'text-amber-600 font-semibold' : 'text-slate-600';
                            return (
                                <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => openEdit(c)}>
                                    <td className="px-4 py-3 font-mono font-bold text-slate-800 text-sm">{c.contract_number}</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{c.clients?.company_name || c.clients?.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{c.projects?.title || <span className="italic text-slate-300">—</span>}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.cls}`}>{meta.label}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtD(c.start_date)}</td>
                                    <td className={`px-4 py-3 text-sm whitespace-nowrap ${expiryClass}`}>{fmtD(c.end_date)}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{fmt(c.annual_value)}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{c.visit_frequency}</td>
                                    <td className="px-4 py-3 text-slate-300 text-right">›</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="font-bold text-lg text-slate-900">{editId ? 'Edit AMC Contract' : 'New AMC Contract'}</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {error && <div className="col-span-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

                            {field('Contract Number', <input required value={form.contract_number} onChange={e => setForm(f => ({ ...f, contract_number: e.target.value }))} className={inputCls} />, true)}
                            {field('Status', <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                                {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>)}

                            {field('Client', <select required value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={inputCls}>
                                <option value="">— Select Client —</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                            </select>, true)}
                            {field('Linked Project (optional)', <select value={form.project_id} onChange={e => handleProjectChange(e.target.value)} className={inputCls}>
                                <option value="">— None —</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title} ({p.project_code})</option>)}
                            </select>)}

                            {field('Start Date', <input type="date" required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />, true)}
                            {field('End Date', <input type="date" required value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />, true)}

                            {field('Annual Value (₹)', <input type="number" min="0" step="100" value={form.annual_value} onChange={e => setForm(f => ({ ...f, annual_value: e.target.value }))} className={inputCls} placeholder="0" />)}
                            {field('Visit Frequency', <select value={form.visit_frequency} onChange={e => setForm(f => ({ ...f, visit_frequency: e.target.value }))} className={inputCls}>
                                {['Monthly', 'Bi-Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'On-Call'].map(v => <option key={v}>{v}</option>)}
                            </select>)}

                            <div className="col-span-2">
                                {field('Coverage Details', <textarea rows="2" value={form.coverage_details} onChange={e => setForm(f => ({ ...f, coverage_details: e.target.value }))} placeholder="e.g. All 42 cameras, 3 NVRs, cabling — excludes physical damage and HDD replacement" className={`${inputCls} resize-none`} />)}
                            </div>
                            <div className="col-span-2">
                                {field('Internal Notes', <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="Optional" />)}
                            </div>

                            <div className="col-span-2 flex items-center justify-between mt-2">
                                {editId
                                    ? <button type="button" onClick={handleDelete} className="inline-flex items-center text-sm text-red-500 hover:text-red-700 font-medium">
                                        <Trash2 className="w-4 h-4 mr-1" /> Delete Contract
                                    </button>
                                    : <span />
                                }
                                <button type="submit" disabled={saving} className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                                    <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Contract'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AMC;
