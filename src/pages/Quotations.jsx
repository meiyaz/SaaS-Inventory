import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Eye, Printer, CheckCircle, Clock, XCircle, Download, X, FolderKanban } from 'lucide-react';
import { downloadCsv } from '../utils/exportCsv';

const STATUS_STYLE = {
    DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    SENT: { label: 'Sent', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    ACCEPTED: { label: 'Accepted', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
    EXPIRED: { label: 'Expired', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
};

const StatusIcon = ({ status }) => {
    switch (status) {
        case 'ACCEPTED': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Quotations = () => {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [projects, setProjects] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    useEffect(() => {
        fetchQuotes();
        supabase
            .from('projects')
            .select('id, title, project_code, clients(company_name, name)')
            .order('title')
            .then(r => setProjects(r.data || []));
    }, []);

    const fetchQuotes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('quotations')
            .select('*, projects(title, project_code, clients(name, company_name))')
            .order('created_at', { ascending: false });
        if (!error) setQuotes(data || []);
        setLoading(false);
    };

    const filtered = quotes.filter(q => {
        const matchSearch =
            q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
            q.projects?.title?.toLowerCase().includes(search.toLowerCase()) ||
            q.projects?.clients?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            q.projects?.clients?.name?.toLowerCase().includes(search.toLowerCase());
        return (statusFilter === 'ALL' || q.status === statusFilter) && matchSearch;
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <FileText className="w-6 h-6 mr-2 text-amber-500" />
                        Quotations
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Generate and track formal project quotations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => downloadCsv('quotations', [
                            { label: 'Quote #', key: 'quote_number' },
                            { label: 'Project', key: 'project', format: (_, r) => r.projects?.title || '' },
                            { label: 'Client', key: 'client', format: (_, r) => r.projects?.clients?.company_name || r.projects?.clients?.name || '' },
                            { label: 'Status', key: 'status' },
                            { label: 'Total (₹)', key: 'grand_total' },
                            { label: 'Valid Until', key: 'valid_until', format: v => v ? new Date(v).toLocaleDateString('en-IN') : '' },
                            { label: 'Created', key: 'created_at', format: v => new Date(v).toLocaleDateString('en-IN') },
                        ], filtered)}
                        className="inline-flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        <Download className="w-4 h-4 mr-1.5" /> Export
                    </button>
                    <button
                        onClick={() => { setProjectSearch(''); setPickerOpen(true); }}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors shrink-0"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> New Quotation
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search by quote #, project, or client..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['ALL', ...Object.keys(STATUS_STYLE)].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors
                ${statusFilter === s
                                    ? s === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : STATUS_STYLE[s]?.cls + ' !border-current'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                            {s === 'ALL' ? 'All' : STATUS_STYLE[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote #</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project / Client</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total (incl. GST)</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Valid Until</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="py-14 text-center text-slate-400">Loading quotations...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" className="py-16 text-center">
                                <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">No quotations yet. Create one from a project.</p>
                            </td></tr>
                        ) : filtered.map(q => {
                            const meta = STATUS_STYLE[q.status] || STATUS_STYLE.DRAFT;
                            return (
                                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <span className="font-mono font-bold text-slate-800 text-sm">{q.quote_number}</span>
                                        <div className="text-xs text-slate-400 mt-0.5">{formatDate(q.created_at)}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-slate-800 text-sm">{q.projects?.title}</div>
                                        <div className="text-xs text-slate-400">{q.projects?.clients?.company_name || q.projects?.clients?.name}</div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.cls}`}>
                                            <StatusIcon status={q.status} />
                                            {meta.label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                                        ₹{Number(q.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-600">{formatDate(q.valid_until)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => navigate(`/billing/quotation/${q.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" title="View">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => navigate(`/billing/quotation/${q.id}/print`)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" title="Print">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Project Picker Modal */}
            {pickerOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 flex items-center">
                                <FolderKanban className="w-4 h-4 mr-2 text-violet-500" />
                                Select a Project
                            </h3>
                            <button onClick={() => setPickerOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search projects..."
                                value={projectSearch}
                                onChange={e => setProjectSearch(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 mb-3"
                            />
                            <div className="space-y-1 max-h-72 overflow-y-auto">
                                {projects
                                    .filter(p =>
                                        !projectSearch ||
                                        p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                        p.project_code?.toLowerCase().includes(projectSearch.toLowerCase())
                                    )
                                    .map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setPickerOpen(false); navigate(`/billing/quotation/new/${p.id}`); }}
                                            className="w-full text-left px-3 py-3 rounded-lg hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-colors"
                                        >
                                            <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {p.project_code} · {p.clients?.company_name || p.clients?.name}
                                            </p>
                                        </button>
                                    ))
                                }
                                {projects.filter(p =>
                                    !projectSearch ||
                                    p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                    p.project_code?.toLowerCase().includes(projectSearch.toLowerCase())
                                ).length === 0 && (
                                        <p className="text-center text-sm text-slate-400 py-6">No projects found.</p>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;
