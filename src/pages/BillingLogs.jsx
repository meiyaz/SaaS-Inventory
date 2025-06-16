import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { History, Search, Download, Printer, Clock, FileText } from 'lucide-react';
import { downloadCsv, printTable } from '../utils/exportCsv';
import Select from '../components/ui/Select';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

const ActionBadge = ({ action }) => {
    switch (action) {
        case 'INSERT': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 tracking-wider">CREATED</span>;
        case 'UPDATE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 tracking-wider">MODIFIED</span>;
        case 'DELETE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 tracking-wider">DELETED</span>;
        default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 tracking-wider">{action}</span>;
    }
};

const ModuleBadge = ({ table }) => {
    switch (table) {
        case 'quotations': return <span className="inline-flex min-w-[80px] justify-center px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold tracking-wide rounded-md border border-amber-200 uppercase">Quote</span>;
        case 'invoices': return <span className="inline-flex min-w-[80px] justify-center px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wide rounded-md border border-indigo-200 uppercase">Invoice</span>;
        case 'expenses': return <span className="inline-flex min-w-[80px] justify-center px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold tracking-wide rounded-md border border-rose-200 uppercase">Expense</span>;
        default: return <span className="inline-flex min-w-[80px] justify-center px-2 py-1 bg-slate-50 text-slate-700 text-xs font-bold tracking-wide rounded-md border border-slate-200 uppercase">{table}</span>;
    }
};

const extractReference = (table, data) => {
    if (!data) return '-';
    if (table === 'quotations') return data.quote_number;
    if (table === 'invoices') return data.invoice_number;
    if (table === 'expenses') return data.expense_number;
    return 'Unknown Ref';
};

const extractTotal = (data) => {
    if (!data || !data.grand_total) return '—';
    return `₹${Number(data.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const resolveChangeSummary = (action, oldData, newData) => {
    if (action === 'INSERT') {
        return `Created entirely new record initialized as ${newData?.status || 'Active'}`;
    }
    if (action === 'DELETE') {
        return `Record permanently removed from database`;
    }
    if (action === 'UPDATE') {
        if (oldData?.status !== newData?.status) {
            return `Status transitioned: ${oldData?.status || '—'} ➔ ${newData?.status}`;
        }
        if (oldData?.grand_total !== newData?.grand_total) {
            return `Financial values updated (Total changed)`;
        }
        return `Entity properties modified without status/financial change`;
    }
    return 'Details updated';
};

const BillingLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState('ALL');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`*`)
            .in('table_name', ['quotations', 'invoices', 'expenses'])
            .order('timestamp', { ascending: false })
            .limit(300);

        if (!error && data) {
            setLogs(data);
        }
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        const payloadData = log.new_data || log.old_data || {};
        const refStr = extractReference(log.table_name, payloadData) || '';

        const matchesSearch =
            refStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.users?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = moduleFilter === 'ALL' ? true : log.table_name === moduleFilter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 rounded-t-lg">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <History className="w-5 h-5 mr-2 text-indigo-500" />
                        Billing & Finance Audit Logs
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Immutable trail of all operational changes in Quotations, Invoices, and Expenses.</p>
                </div>

                <div className="flex w-full flex-wrap md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Ref #, user, or action..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white min-w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="z-10 w-full sm:w-auto">
                        <Select
                            value={moduleFilter}
                            onChange={v => setModuleFilter(v)}
                            options={[
                                { value: 'ALL', label: 'All Modules' },
                                { value: 'quotations', label: 'Quotations Only' },
                                { value: 'invoices', label: 'Invoices Only' },
                                { value: 'expenses', label: 'Expenses Only' },
                            ]}
                            className="sm:w-48"
                        />
                    </div>

                    <button
                        onClick={() => downloadCsv('billing_logs', [
                            { label: 'Timestamp', key: 'timestamp', format: v => new Date(v).toLocaleString('en-IN') },
                            { label: 'Action', key: 'action_type' },
                            { label: 'Module', key: 'table_name' },
                            { label: 'Reference', key: 'ref', format: (_, r) => extractReference(r.table_name, r.new_data || r.old_data) },
                            { label: 'Actor', key: 'user', format: (_, r) => r.users?.email },
                            { label: 'Summary', key: 'summary', format: (_, r) => resolveChangeSummary(r.action_type, r.old_data, r.new_data) },
                        ], filteredLogs)}
                        className="inline-flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </button>
                    <button
                        onClick={() => printTable('Billing Audit Log', [
                            { label: 'Timestamp', key: 'timestamp', format: v => new Date(v).toLocaleString('en-IN') },
                            { label: 'Action', key: 'action_type' },
                            { label: 'Module', key: 'table_name' },
                            { label: 'Reference', key: 'ref', format: (_, r) => extractReference(r.table_name, r.new_data || r.old_data) },
                            { label: 'Summary', key: 'summary', format: (_, r) => resolveChangeSummary(r.action_type, r.old_data, r.new_data) },
                        ], filteredLogs)}
                        className="inline-flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        <Printer className="h-4 w-4 mr-1.5" /> Print
                    </button>
                </div>
            </div>

            {/* Table */}
            {/* Mobile View (< lg) */}
            <div className="lg:hidden divide-y divide-slate-100 flex-1">
                {loading ? (
                    <div className="py-12 text-center text-slate-500">
                        <div className="inline-flex items-center">
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin mr-3"></div>
                            Fetching financial ledger history...
                        </div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="py-16 text-center px-4">
                        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No audited financial actions found.</p>
                        <p className="text-sm mt-1 text-slate-400">Actions taken inside Quotations or Billing modules will be permanently recorded here.</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => {
                        const payload = log.new_data || log.old_data || {};
                        return (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div>
                                        <div className="text-sm font-medium text-slate-900">{formatDate(log.timestamp).split(',')[0]}</div>
                                        <div className="text-xs text-slate-500">{formatDate(log.timestamp).split(',')[1]}</div>
                                    </div>
                                    <ActionBadge action={log.action_type} />
                                </div>
                                <div className="flex items-center gap-3 mb-3 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                    <ModuleBadge table={log.table_name} />
                                    <span className="font-mono text-sm font-bold text-slate-800 flex-1 truncate">{extractReference(log.table_name, payload)}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="text-sm text-slate-700 bg-white border border-slate-200 rounded p-2">
                                        {resolveChangeSummary(log.action_type, log.old_data, log.new_data)}
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Actor</span>
                                        <div className="text-xs font-semibold text-slate-800">{log.users?.raw_user_meta_data?.full_name || 'System / Admin'}</div>
                                        <div className="text-[10px] text-slate-500">{log.users?.email}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-800 text-sm">{extractTotal(payload)}</div>
                                        {payload.status && <div className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{payload.status}</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop View (≥ lg) */}
            <div className="hidden lg:block flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Module & Ref</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial Snapshot</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Change Synopsis</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actor</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    <div className="inline-flex items-center">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin mr-3"></div>
                                        Fetching financial ledger history...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No audited financial actions found.</p>
                                    <p className="text-sm mt-1 text-slate-400">Actions taken inside Quotations or Billing modules will be permanently recorded here.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => {
                                const payload = log.new_data || log.old_data || {};
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{formatDate(log.timestamp).split(',')[0]}</div>
                                            <div className="text-xs text-slate-500">{formatDate(log.timestamp).split(',')[1]}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ActionBadge action={log.action_type} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <ModuleBadge table={log.table_name} />
                                                <span className="font-mono text-sm font-bold text-slate-800">{extractReference(log.table_name, payload)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="font-bold text-slate-700">{extractTotal(payload)}</div>
                                            {payload.status && <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">{payload.status}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-700 truncate max-w-sm" title={resolveChangeSummary(log.action_type, log.old_data, log.new_data)}>
                                                {resolveChangeSummary(log.action_type, log.old_data, log.new_data)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-800">{log.users?.raw_user_meta_data?.full_name || 'System / Admin'}</div>
                                            <div className="text-xs text-slate-400">{log.users?.email}</div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillingLogs;
