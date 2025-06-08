import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Search, Eye, Printer, CheckCircle, Clock, XCircle, Download, X, FolderKanban, ArrowRightLeft, Edit, Ban, AlertOctagon } from 'lucide-react';
import { downloadCsv } from '../utils/exportCsv';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import Select from '../components/ui/Select';

const STATUS_STYLE = {
    DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    SENT: { label: 'Sent', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    ACCEPTED: { label: 'Accepted', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-300' },
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
    const { user, orgId } = useAuth();
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const [confirm, setConfirm] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [projects, setProjects] = useState([]);
    const [team, setTeam] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    const [acceptModal, setAcceptModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchQuotes();
        supabase
            .from('projects')
            .select('id, title, project_code, clients(company_name, name)')
            .order('title')
            .then(r => setProjects(r.data || []));
    }, [orgId]);

    const fetchQuotes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('quotations')
            .select('*, projects(title, project_code, clients(name, company_name)), clients(name, company_name)')
            .order('created_at', { ascending: false });
        if (!error) setQuotes(data || []);
        setLoading(false);
    };

    const filtered = quotes.filter(q => {
        const matchSearch =
            q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
            q.projects?.title?.toLowerCase().includes(search.toLowerCase()) ||
            q.projects?.clients?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            q.projects?.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
            q.clients?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            q.clients?.name?.toLowerCase().includes(search.toLowerCase());

        let matchDate = true;
        if (dateFilter !== 'ALL') {
            const d = new Date(q.created_at);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateFilter === 'TODAY') {
                if (d < today) matchDate = false;
            } else if (dateFilter === 'YESTERDAY') {
                const y = new Date(today); y.setDate(y.getDate() - 1);
                if (d < y || d >= today) matchDate = false;
            } else if (dateFilter === 'THIS_WEEK') {
                const w = new Date(today); w.setDate(w.getDate() - w.getDay());
                if (d < w) matchDate = false;
            } else if (dateFilter === 'LAST_7_DAYS') {
                const l7 = new Date(today); l7.setDate(l7.getDate() - 7);
                if (d < l7) matchDate = false;
            } else if (dateFilter === 'THIS_MONTH') {
                if (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear()) matchDate = false;
            } else if (dateFilter === 'LAST_MONTH') {
                const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const tm = new Date(today.getFullYear(), today.getMonth(), 1);
                if (d < lm || d >= tm) matchDate = false;
            } else if (dateFilter === 'THIS_YEAR') {
                if (d.getFullYear() !== today.getFullYear()) matchDate = false;
            }
        }

        return (statusFilter === 'ALL' || q.status === statusFilter) && matchSearch && matchDate;
    });

    const handleUpdateStatus = async (quoteId, newStatus) => {
        const quote = quotes.find(q => q.id === quoteId);
        if (!quote) return;

        if (newStatus === 'ACCEPTED') {
            setConfirm({
                message: `Accept Estimate ${quote.quote_number}? This will mark the estimate as accepted.`,
                confirmLabel: 'Accept',
                onConfirm: () => handleAcceptSubmit(quoteId),
            });
            return;
        }
        if (newStatus === 'REJECTED') {
            setRejectModal(quote);
            setRejectReason(quote.notes || '');
            return;
        }

        const { error } = await supabase.from('quotations').update({ status: newStatus }).eq('id', quoteId);
        if (error) {
            toast('Failed to update status: ' + error.message, 'error');
            return;
        }
        setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
    };

    const handleAcceptSubmit = async (quoteId) => {
        const { error } = await supabase.from('quotations').update({ status: 'ACCEPTED' }).eq('id', quoteId);
        if (error) {
            toast('Failed to accept estimate: ' + error.message, 'error');
            return;
        }
        setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: 'ACCEPTED' } : q));
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('quotations')
                .update({ status: 'REJECTED', notes: rejectReason })
                .eq('id', rejectModal.id);
            if (error) throw error;

            setQuotes(quotes.map(q => q.id === rejectModal.id ? { ...q, status: 'REJECTED', notes: rejectReason } : q));
            setRejectModal(null);
        } catch (err) {
            console.error(err);
            toast('Failed to reject estimate: ' + err.message, 'error');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <FileText className="w-6 h-6 mr-2 text-amber-500" />
                        Estimates
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Generate and track formal project estimates.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => downloadCsv('quotations', [
                            { label: 'Estimate #', key: 'quote_number' },
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
                        onClick={() => navigate('/billing/quotation/new')}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors shrink-0"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> New Estimate
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search by estimate #, project, or client..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                </div>

                <div className="flex items-center gap-2 z-20">
                    <Select
                        value={dateFilter}
                        onChange={setDateFilter}
                        options={[
                            { value: 'ALL', label: 'All Time' },
                            { value: 'TODAY', label: 'Today' },
                            { value: 'YESTERDAY', label: 'Yesterday' },
                            { value: 'THIS_WEEK', label: 'This Week' },
                            { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
                            { value: 'THIS_MONTH', label: 'This Month' },
                            { value: 'LAST_MONTH', label: 'Last Month' },
                            { value: 'THIS_YEAR', label: 'This Year' }
                        ]}
                        className="w-[150px]"
                    />
                </div>

                <div className="flex items-center gap-2 z-10">
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: 'ALL', label: 'All Statuses' },
                            ...Object.keys(STATUS_STYLE).map(s => ({ value: s, label: STATUS_STYLE[s].label }))
                        ]}
                        className="w-[150px]"
                    />
                </div>
            </div>

            {/* Estimates List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="py-14 text-center text-slate-400">Loading estimates...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No estimates yet. Create one from a project.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards (< lg) */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {filtered.map(q => {
                                const meta = STATUS_STYLE[q.status] || STATUS_STYLE.DRAFT;
                                return (
                                    <div key={q.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="min-w-0">
                                                <p className="font-mono font-bold text-slate-800 text-sm truncate">{q.quote_number}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{formatDate(q.created_at)}</p>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.cls}`}>{meta.label}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{q.projects?.title || 'Standalone'}</p>
                                                <p className="text-xs text-slate-400 truncate">{q.projects?.clients?.company_name || q.projects?.clients?.name || q.clients?.company_name || q.clients?.name || 'No Client'} · Valid {formatDate(q.valid_until)}</p>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-2">
                                                <span className="font-bold text-slate-800 text-sm whitespace-nowrap">₹{Number(q.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                <button onClick={() => navigate(`/billing/quotation/edit/${q.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => navigate(`/billing/quotation/${q.id}`)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Eye className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table (≥ lg) */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Estimate #</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project / Client</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total (incl. GST)</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Valid Until</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map(q => {
                                        const meta = STATUS_STYLE[q.status] || STATUS_STYLE.DRAFT;
                                        return (
                                            <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 whitespace-nowrap">
                                                    <span className="font-mono font-bold text-slate-800 text-sm">{q.quote_number}</span>
                                                    <div className="text-xs text-slate-400 mt-0.5">{formatDate(q.created_at)}</div>
                                                </td>
                                                <td className="px-5 py-3 max-w-[200px]">
                                                    <div className="font-medium text-slate-800 text-sm truncate">{q.projects?.title || 'Standalone Quote'}</div>
                                                    <div className="text-xs text-slate-400 truncate">{q.projects?.clients?.company_name || q.projects?.clients?.name || q.clients?.company_name || q.clients?.name || 'No Client'}</div>
                                                </td>
                                                <td className="px-5 py-3 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.cls}`}>{meta.label}</span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                                    ₹{Number(q.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(q.valid_until)}</td>
                                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {q.status === 'DRAFT' && (
                                                            <button onClick={() => handleUpdateStatus(q.id, 'SENT')}
                                                                className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-md transition-colors" title="Mark as Sent">
                                                                Mark Sent
                                                            </button>
                                                        )}
                                                        {q.status === 'SENT' && (
                                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5">
                                                                <button onClick={() => handleUpdateStatus(q.id, 'ACCEPTED')} className="p-1 px-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="Accept Quote"><CheckCircle className="w-4 h-4" /></button>
                                                                <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                                                                <button onClick={() => handleUpdateStatus(q.id, 'REJECTED')} className="p-1 px-1.5 text-rose-600 hover:bg-rose-100 rounded transition-colors" title="Reject Quote"><XCircle className="w-4 h-4" /></button>
                                                            </div>
                                                        )}
                                                        {q.status === 'ACCEPTED' && (
                                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5">
                                                                <button onClick={() => setConfirm({ message: 'Are you sure you want to cancel this accepted estimate? Any associated Tasks or Invoices will NOT be automatically deleted.', confirmLabel: 'Cancel Estimate', danger: true, onConfirm: () => handleUpdateStatus(q.id, 'CANCELLED') })}
                                                                    className="p-1 px-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Cancel Quote">
                                                                    <Ban className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 ml-1 pl-1">
                                                            <button onClick={() => navigate(`/billing/quotation/edit/${q.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                                            <button onClick={() => navigate(`/billing/quotation/${q.id}`)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>


            {rejectModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Reject Estimate</h3>
                            <button onClick={() => setRejectModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleRejectSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Reason for Rejection *</label>
                                    <textarea required rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" placeholder="e.g. Lost to competitor, Price too high..."></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setRejectModal(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">Mark as Rejected</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
        </div>
    );
};

export default Quotations;
