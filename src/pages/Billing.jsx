import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import Select from '../components/ui/Select';
import { Receipt, Search, Download, Clock, CheckCircle, XCircle, Printer, CreditCard, X, Eye } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const STATUS_STYLE = {
    DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    SENT: { label: 'Sent', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    PARTIAL: { label: 'Partial', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    PAID: { label: 'Paid', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    OVERDUE: { label: 'Overdue', cls: 'bg-red-100 text-red-700 border-red-200' },
};

const StatusIcon = ({ status }) => {
    if (status === 'PAID') return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    if (status === 'OVERDUE') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} `;

const PAYMENT_MODES = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'NEFT', 'RTGS'];

const Invoices = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [payModal, setPayModal] = useState(null); // invoice object
    const [payForm, setPayForm] = useState({ amount: '', payment_mode: 'Bank Transfer', reference_no: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        const { data: invData, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('Invoices fetch error:', error); setLoading(false); return; }

        const clientIds = [...new Set((invData || []).map(i => i.client_id).filter(Boolean))];
        let clientMap = {};
        if (clientIds.length > 0) {
            const { data: cData } = await supabase.from('clients').select('id, name, company_name').in('id', clientIds);
            (cData || []).forEach(c => { clientMap[c.id] = c; });
        }

        setInvoices((invData || []).map(inv => ({ ...inv, clients: clientMap[inv.client_id] || null })));
        setLoading(false);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setSaving(true);
        const paidAmt = parseFloat(payForm.amount) || 0;
        const rcptNum = `RCPT - ${Date.now()} `;
        const { error } = await supabase.from('payment_receipts').insert([{
            invoice_id: payModal.id,
            receipt_number: rcptNum,
            amount: paidAmt,
            payment_mode: payForm.payment_mode,
            reference_no: payForm.reference_no || null,
            payment_date: payForm.payment_date,
            notes: payForm.notes || null,
        }]);

        if (!error) {
            const { data: receipts } = await supabase.from('payment_receipts').select('amount').eq('invoice_id', payModal.id);
            const totalPaid = (receipts || []).reduce((s, r) => s + Number(r.amount), 0);
            const newStatus = totalPaid >= payModal.grand_total ? 'PAID' : 'PARTIAL';
            await supabase.from('invoices').update({ status: newStatus }).eq('id', payModal.id);
            setPayModal(null);
            fetchInvoices();
        } else {
            toast('Payment failed: ' + error.message, 'error');
        }
        setSaving(false);
    };

    const filtered = invoices.filter(inv => {
        const matchSearch =
            inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
            inv.clients?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
            inv.clients?.name?.toLowerCase().includes(search.toLowerCase());

        let matchDate = true;
        if (dateFilter !== 'ALL') {
            const d = new Date(inv.created_at);
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

        return (statusFilter === 'ALL' || inv.status === statusFilter) && matchSearch && matchDate;
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Receipt className="w-6 h-6 mr-2 text-indigo-500" /> Invoices
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Track outbound revenue from AMCs, Projects, and Tasks.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search invoice # or client…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
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

            {/* Invoice List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                {loading ? (
                    <div className="py-14 text-center text-slate-400">Loading invoices…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Receipt className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No invoices match the criteria.</p>
                    </div>
                ) : (
                    <>
                        {/* ── Mobile cards (< lg) ── */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {filtered.map(inv => {
                                const meta = STATUS_STYLE[inv.status] || STATUS_STYLE.DRAFT;
                                const canPay = !['PAID'].includes(inv.status);
                                return (
                                    <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="min-w-0">
                                                <p className="font-mono font-bold text-slate-800 text-sm truncate">{inv.invoice_number}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{fmtDate(inv.created_at)}</p>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.cls}`}>
                                                <StatusIcon status={inv.status} />{meta.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{inv.clients?.company_name || inv.clients?.name}</p>
                                                <p className="text-xs text-slate-400">{inv.reference_type} · Due {fmtDate(inv.due_date)}</p>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-2">
                                                <span className="font-bold text-slate-800 text-sm">{fmt(inv.grand_total)}</span>
                                                <button onClick={() => navigate(`/invoices/${inv.id}`)}
                                                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {canPay && (
                                                    <button onClick={() => { setPayModal(inv); setPayForm({ amount: '', payment_mode: 'Bank Transfer', reference_no: '', payment_date: new Date().toISOString().split('T')[0], notes: '' }); }}
                                                        className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors">
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Desktop table (≥ lg) ── */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Invoice / Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Due Date</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map(inv => {
                                        const meta = STATUS_STYLE[inv.status] || STATUS_STYLE.DRAFT;
                                        const canPay = !['PAID'].includes(inv.status);
                                        return (
                                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 whitespace-nowrap">
                                                    <span className="font-mono font-bold text-slate-800 text-sm">{inv.invoice_number}</span>
                                                    <div className="text-xs text-slate-400 mt-0.5">{fmtDate(inv.created_at)}</div>
                                                </td>
                                                <td className="px-5 py-3 max-w-[180px]">
                                                    <div className="font-medium text-slate-800 text-sm truncate">{inv.clients?.company_name || inv.clients?.name}</div>
                                                    {inv.clients?.company_name && <div className="text-xs text-slate-400 truncate">{inv.clients?.name}</div>}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-slate-100 text-slate-600">{inv.reference_type}</span>
                                                </td>
                                                <td className="px-5 py-3 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.cls}`}>
                                                        <StatusIcon status={inv.status} />{meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-800 whitespace-nowrap">{fmt(inv.grand_total)}</td>
                                                <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtDate(inv.due_date)}</td>
                                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => navigate(`/invoices/${inv.id}`)}
                                                            title="View Invoice"
                                                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {canPay && (
                                                            <button onClick={() => { setPayModal(inv); setPayForm({ amount: '', payment_mode: 'Bank Transfer', reference_no: '', payment_date: new Date().toISOString().split('T')[0], notes: '' }); }}
                                                                title="Collect Payment"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors">
                                                                <CreditCard className="w-4 h-4" /> Collect
                                                            </button>
                                                        )}
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
            {/* Record Payment Modal */}
            {
                payModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <form onSubmit={handleRecordPayment} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-slate-800">Receive Pay</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{payModal.invoice_number} · Outstanding: {fmt(payModal.grand_total)}</p>
                                </div>
                                <button type="button" onClick={() => setPayModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                                        <input required type="number" step="0.01" min="1" value={payForm.amount}
                                            onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500"
                                            placeholder={payModal.grand_total} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                                        <input required type="date" value={payForm.payment_date}
                                            onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode *</label>
                                    <Select value={payForm.payment_mode} onChange={v => setPayForm({ ...payForm, payment_mode: v })}
                                        options={PAYMENT_MODES.map(m => ({ value: m, label: m }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reference No.</label>
                                    <input type="text" value={payForm.reference_no} onChange={e => setPayForm({ ...payForm, reference_no: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500" placeholder="UTR / Cheque No." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                                    <textarea value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 resize-none" rows={2} />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                <button type="button" onClick={() => setPayModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />{saving ? 'Saving…' : 'Receive Pay'}
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }
        </div >
    );
};

export default Invoices;
