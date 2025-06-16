import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { History, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const AuditLogs = () => {
    const { role } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (role === 'ADMIN') {
            fetchLogs();
        } else {
            setLoading(false);
        }
    }, [role]);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (!error) setLogs(data || []);
        else console.error('Failed to fetch audit logs:', error);

        setLoading(false);
    };

    if (role !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <History className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Access Denied</h3>
                <p className="text-slate-500">Only Administrators can view the system audit trail.</p>
            </div>
        );
    }

    const filtered = logs.filter(l =>
        (l.table_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.action_type || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.users?.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <History className="w-6 h-6 mr-2 text-indigo-500" />
                        System Audit Logs
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Review historical tracking of sensitive record modifications.</p>
                </div>
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search by table, action, user email..." value={search} onChange={e => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Mobile View (< lg) */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="py-14 text-center text-slate-400">Loading trail...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">No audit records found.</div>
                    ) : filtered.map(l => (
                        <div key={l.id} className="p-4 hover:bg-slate-50 border-l-4 border-l-transparent hover:border-l-indigo-500 transition-colors">
                            <div className="flex justify-between items-start mb-2 gap-2">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">{l.table_name}</div>
                                    <div className="text-xs text-slate-500">{formatDate(l.timestamp)}</div>
                                </div>
                                <span className={`shrink-0 inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ${l.action_type === 'INSERT' ? 'bg-emerald-100 text-emerald-700' :
                                    l.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {l.action_type}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-3 bg-slate-50 p-2 rounded border border-slate-100">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">User</div>
                                    <div className="text-xs font-medium text-slate-700 truncate max-w-[120px]" title={l.users?.email || 'System'}>{l.users?.email || 'System'}</div>
                                </div>
                                <div className="text-right pl-2">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Record ID</div>
                                    <div className="font-mono text-xs text-slate-500 truncate max-w-[100px]" title={l.record_id}>{l.record_id}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View (≥ lg) */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Table</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Record ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="py-14 text-center text-slate-400">Loading trail...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="py-16 text-center text-slate-400">No audit records found.</td></tr>
                            ) : filtered.map(l => (
                                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 text-sm text-slate-600 border-l-4 border-l-transparent hover:border-l-indigo-500">{formatDate(l.timestamp)}</td>
                                    <td className="px-5 py-3 text-sm font-medium text-slate-800">{l.users?.email || 'System'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-widest ${l.action_type === 'INSERT' ? 'bg-emerald-100 text-emerald-700' :
                                            l.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {l.action_type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-sm font-semibold text-slate-700">{l.table_name}</td>
                                    <td className="px-5 py-3 font-mono text-xs text-slate-500 truncate max-w-[200px]" title={l.record_id}>{l.record_id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
