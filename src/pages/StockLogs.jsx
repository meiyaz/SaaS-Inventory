import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { History, Search, ArrowDownToLine, ArrowUpRight, ArrowLeftRight, Clock, Download, Printer } from 'lucide-react';
import { downloadCsv, printTable } from '../utils/exportCsv';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

const TransactionIcon = ({ type }) => {
    switch (type) {
        case 'IN': return <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md"><ArrowDownToLine className="w-4 h-4" /></div>;
        case 'OUT': return <div className="p-1.5 bg-rose-100 text-rose-600 rounded-md"><ArrowUpRight className="w-4 h-4" /></div>;
        default: return <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><ArrowLeftRight className="w-4 h-4" /></div>;
    }
};

const TransactionBadge = ({ type }) => {
    switch (type) {
        case 'IN': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 tracking-wide">STOCK IN (PURCHASE)</span>;
        case 'OUT': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 tracking-wide">STOCK OUT (DISPATCH)</span>;
        default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 tracking-wide">ADJUSTMENT</span>;
    }
};

const StockLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stock_transactions')
            .select(`
        *,
        products (name, sku, brand)
      `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setLogs(data);
        }
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.reference_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterType === 'ALL' ? true : log.transaction_type === filterType;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 rounded-t-lg">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <History className="w-5 h-5 mr-2 text-indigo-500" />
                        Inventory Audit Logs
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Timeline of all system stock movements across the company.</p>
                </div>

                <div className="flex w-full flex-wrap sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search item, SKU, or Invoice #"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white lg:min-w-[280px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        title="Filter Type"
                        className="block sm:w-48 pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="ALL">All Transactions</option>
                        <option value="IN">Stock Inward (Purchases)</option>
                        <option value="OUT">Stock Outward (Dispatch)</option>
                    </select>

                    <button
                        onClick={() => downloadCsv('stock_logs', [
                            { label: 'Date', key: 'created_at', format: v => new Date(v).toLocaleDateString('en-IN') },
                            { label: 'Type', key: 'transaction_type' },
                            { label: 'Product', key: 'product', format: (_, r) => r.products?.name || '' },
                            { label: 'SKU', key: 'sku', format: (_, r) => r.products?.sku || '' },
                            { label: 'Qty', key: 'quantity' },
                            { label: 'Unit Cost', key: 'unit_cost' },
                            { label: 'Reference', key: 'reference_no' },
                            { label: 'Notes', key: 'notes' },
                            { label: 'User', key: 'user_email' },
                        ], filteredLogs)}
                        className="inline-flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        <Download className="h-4 w-4 mr-1.5" /> Export CSV
                    </button>
                    <button
                        onClick={() => printTable('Inventory Audit Log', [
                            { label: 'Date', key: 'created_at', format: v => new Date(v).toLocaleDateString('en-IN') },
                            { label: 'Type', key: 'transaction_type' },
                            { label: 'Product', key: 'product', format: (_, r) => r.products?.name || '' },
                            { label: 'Qty', key: 'quantity' },
                            { label: 'Reference', key: 'reference_no' },
                            { label: 'Notes', key: 'notes' },
                        ], filteredLogs)}
                        className="inline-flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        <Printer className="h-4 w-4 mr-1.5" /> Print
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Info</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty Affected</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference / Unit Cost</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes & User</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    <div className="inline-flex items-center">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin mr-3"></div>
                                        Loading historical transactions...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No transactions match your search.</p>
                                    <p className="text-sm mt-1 text-slate-400">Perform a Stock In/Out operation to see it logged here.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{formatDate(log.created_at).split(',')[0]}</div>
                                        <div className="text-xs text-slate-500">{formatDate(log.created_at).split(',')[1]}</div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <TransactionIcon type={log.transaction_type} />
                                            <TransactionBadge type={log.transaction_type} />
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">{log.products?.name || 'Unknown Product'}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-1">SKU: {log.products?.sku}</div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`text-lg font-bold ${log.transaction_type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {log.transaction_type === 'IN' ? '+' : '-'}{log.quantity}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900 font-mono">{log.reference_no || '-'}</div>
                                        <div className="text-xs text-slate-500 mt-1">₹{log.unit_cost?.toFixed(2)} / unit</div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-700 italic truncate max-w-xs" title={log.notes}>{log.notes || 'No description provided'}</div>
                                        <div className="text-xs text-slate-400 mt-1">{log.user_email}</div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockLogs;
