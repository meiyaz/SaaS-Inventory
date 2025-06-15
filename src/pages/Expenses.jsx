import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Wallet, Search, Plus, X } from 'lucide-react';
import { downloadCsv } from '../utils/exportCsv';
import Select from '../components/ui/Select';
import { useToast } from '../context/ToastContext';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        category: 'OFFICE', amount: '', vendor_name: '', notes: '', incurred_date: new Date().toISOString().split('T')[0]
    });
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('expenses').select('*').order('incurred_date', { ascending: false });
        if (!error) setExpenses(data || []);
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const uniqueNumber = 'EXP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        const { error } = await supabase.from('expenses').insert([{ ...form, expense_number: uniqueNumber }]);
        setSaving(false);
        if (!error) {
            setModalOpen(false);
            fetchExpenses();
            setForm({ category: 'OFFICE', amount: '', vendor_name: '', notes: '', incurred_date: new Date().toISOString().split('T')[0] });
        } else {
            toast('Failed to save expense: ' + error.message, 'error');
        }
    };

    const filtered = expenses.filter(ex => {
        const matchSearch = (ex.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (ex.category || '').toLowerCase().includes(search.toLowerCase()) ||
            (ex.expense_number || '').toLowerCase().includes(search.toLowerCase());

        let matchDate = true;
        if (dateFilter !== 'ALL') {
            const d = new Date(ex.incurred_date);
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

        return matchSearch && matchDate;
    });

    return (
        <div className="flex flex-col gap-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Wallet className="w-6 h-6 mr-2 text-rose-500" />
                        Expenses
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Log accounts payable including travel, labor, rent, and overhead.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium transition-colors shrink-0">
                        <Plus className="w-4 h-4 mr-1.5" /> Log General Expense
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search by vendor, category or ID..." value={search} onChange={e => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
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
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="py-14 text-center text-slate-400">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">No expenses recorded yet.</div>
                ) : (
                    <>
                        {/* Mobile cards (< lg) */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {filtered.map(ex => (
                                <div key={ex.id} className="p-4 hover:bg-slate-50">
                                    <div className="flex items-start justify-between gap-3 mb-1">
                                        <div className="min-w-0">
                                            <p className="font-mono font-bold text-slate-700 text-sm truncate">{ex.expense_number}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{formatDate(ex.incurred_date)}</p>
                                        </div>
                                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${ex.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{ex.status}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{ex.vendor_name || 'N/A'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">{ex.category}</span>
                                                {ex.notes && <p className="text-xs text-slate-400 truncate">{ex.notes}</p>}
                                            </div>
                                        </div>
                                        <span className="shrink-0 font-bold text-slate-800 text-sm">₹{Number(ex.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table (≥ lg) */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Expense ID</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor / Detail</th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map(ex => (
                                        <tr key={ex.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3 font-mono font-bold text-slate-700 text-sm whitespace-nowrap">{ex.expense_number}</td>
                                            <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(ex.incurred_date)}</td>
                                            <td className="px-5 py-3"><span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded tracking-wide">{ex.category}</span></td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-medium text-slate-800">{ex.vendor_name || 'N/A'}</div>
                                                <div className="text-xs text-slate-400 truncate max-w-[200px]">{ex.notes}</div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${ex.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{ex.status}</span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                                ₹{Number(ex.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Log Expense</h3>
                            <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <Select value={form.category} onChange={v => setForm({ ...form, category: v })}
                                    options={['PARTS', 'LABOR', 'TRAVEL', 'OFFICE', 'SOFTWARE', 'OTHER'].map(c => ({ value: c, label: c }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input type="date" value={form.incurred_date} onChange={e => setForm({ ...form, incurred_date: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor/Payee</label>
                                <input type="text" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500" placeholder="e.g. Uber, Office Rent" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-rose-500 block" rows={2}></textarea>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg">{saving ? 'Saving...' : 'Save Expense'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Expenses;
