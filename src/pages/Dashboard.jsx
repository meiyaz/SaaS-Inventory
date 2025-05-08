import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Package, AlertTriangle, FileText,
    ShieldAlert, ArrowDownToLine, ArrowUpRight, Activity, Clock, Plus,
    Cpu, Zap, Layers, CheckSquare, TrendingUp, TrendingDown, IndianRupee
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const { user, role } = useAuth();
    const [stats, setStats] = useState({
        lowStockItems: [],
        recentLogs: [],
        expiringAmcs: [],
        pendingQuotes: [],
        myTasks: [],
    });

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        let taskQuery = Promise.resolve({ data: null });
        if (role === 'TECHNICIAN' && user) {
            taskQuery = supabase.from('tasks').select('*').eq('assigned_to', user.id).neq('status', 'COMPLETED').order('priority', { ascending: false }).limit(4);
        }

        const [prodRes, logRes, amcRes, quoteRes, taskRes, invRes, expRes] = await Promise.all([
            supabase.from('products').select('id, name, sku, current_stock, min_stock_alert'),
            supabase.from('stock_transactions').select('id, transaction_type, quantity, created_at, products(name)').order('created_at', { ascending: false }).limit(6),
            supabase.from('amc_contracts').select('id, contract_number, end_date, clients(company_name, name)').in('status', ['ACTIVE']).lte('end_date', thirtyDaysFromNow.toISOString()).gte('end_date', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()).order('end_date'),
            supabase.from('quotations').select('id, quote_number, grand_total, created_at, projects(title)').eq('status', 'DRAFT').order('created_at', { ascending: false }).limit(4),
            taskQuery,
            supabase.from('invoices').select('grand_total').neq('status', 'DRAFT'),
            supabase.from('expenses').select('amount')
        ]);

        const products = prodRes.data || [];
        const lowStock = products.filter(p => p.current_stock <= p.min_stock_alert);

        const rev = (invRes.data || []).reduce((acc, curr) => acc + (Number(curr.grand_total) || 0), 0);
        const exp = (expRes.data || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        setStats({
            lowStockItems: lowStock,
            recentLogs: logRes.data || [],
            expiringAmcs: amcRes.data || [],
            pendingQuotes: quoteRes.data || [],
            myTasks: taskRes.data || [],
            totalRevenue: rev,
            totalExpense: exp,
            netProfit: rev - exp
        });
        setLoading(false);
    };

    const fmtDate = (d) => {
        const date = new Date(d);
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const timeAgo = (d) => {
        const diff = Math.floor((new Date() - new Date(d)) / 60000);
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {greeting}, {role === 'ADMIN' ? 'Admin' : role === 'MANAGER' ? 'Manager' : 'Team'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Here's an overview of your operation today.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => navigate('/products/in')} className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-200">
                        <ArrowDownToLine className="w-4 h-4 mr-2" /> Stock In
                    </button>
                    <button onClick={() => navigate('/products/out')} className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-200">
                        <ArrowUpRight className="w-4 h-4 mr-2" /> Dispatch
                    </button>
                    {role !== 'TECHNICIAN' ? (
                        <button onClick={() => navigate('/billing')} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                            <FileText className="w-4 h-4 mr-2" /> New Quote
                        </button>
                    ) : (
                        <button onClick={() => navigate('/tasks')} className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                            <CheckSquare className="w-4 h-4 mr-2" /> My Tasks
                        </button>
                    )}
                </div>
            </div>

            {role !== 'TECHNICIAN' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col hover:border-slate-300 transition-colors cursor-pointer" onClick={() => navigate('/invoices')}>
                        <span className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2">Gross Revenue</span>
                        <span className="text-2xl font-bold text-slate-800">₹{(stats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col hover:border-slate-300 transition-colors cursor-pointer" onClick={() => navigate('/expenses')}>
                        <span className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2">Total Expenses</span>
                        <span className="text-2xl font-bold text-slate-800">₹{(stats.totalExpense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col hover:border-slate-300 transition-colors">
                        <span className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2">Net Profit</span>
                        <span className={`text-2xl font-bold ${(stats.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ₹{(stats.netProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                <div className="xl:col-span-2 flex flex-col gap-8">

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                            <h3 className="font-bold text-slate-800 text-base flex items-center">
                                <div className="p-2 bg-red-100 rounded-lg mr-3 text-red-600">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                Priority Stock Replenishment
                            </h3>
                            <button onClick={() => navigate('/products')} className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View Inventory <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="p-2">
                            {stats.lowStockItems.length === 0
                                ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="p-4 bg-emerald-50 rounded-full mb-3 text-emerald-500">
                                            <ShieldAlert className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-800 font-bold">Stock levels are optimal</p>
                                        <p className="text-slate-500 text-sm mt-1">No items are currently below minimum thresholds.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                                        {stats.lowStockItems.map(p => (
                                            <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-red-200 transition-colors flex justify-between items-center group/card">
                                                <div className="min-w-0 pr-4">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                                                    <p className="text-xs font-mono text-slate-500 mt-1 flex items-center">
                                                        <Package className="w-3 h-3 mr-1" /> {p.sku}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 flex flex-col items-center justify-center min-w-[3rem]">
                                                        <span className={`text-xl font-black leading-none ${p.current_stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>{p.current_stock}</span>
                                                    </div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1.5 whitespace-nowrap">Min: {p.min_stock_alert}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {role === 'TECHNICIAN' ? (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group md:col-span-2 mt-0">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div> Priority Pending Tasks
                                    </h3>
                                    <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{stats.myTasks.length}</div>
                                </div>
                                <div className="divide-y divide-slate-50 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                                    {stats.myTasks.length === 0
                                        ? <div className="h-full flex items-center justify-center p-8 text-sm text-slate-400 min-w-full col-span-full"><p>All caught up!</p></div>
                                        : stats.myTasks.map(task => (
                                            <div key={task.id} onClick={() => navigate('/tasks')} className="p-4 hover:bg-emerald-50/30 cursor-pointer transition-colors block border-r border-slate-50 last:border-0 relative">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${task.priority === 'HIGH' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-400">{timeAgo(task.created_at)}</span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 line-clamp-2 mt-2 leading-snug">{task.title}</p>
                                                <p className="text-[11px] font-bold text-slate-500 mt-2">{task.status}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group mt-0">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-800 text-sm flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div> Draft Quotes
                                        </h3>
                                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{stats.pendingQuotes.length}</div>
                                    </div>
                                    <div className="divide-y divide-slate-50 flex-1">
                                        {stats.pendingQuotes.length === 0
                                            ? <div className="h-full flex items-center justify-center p-8 text-sm text-slate-400"><p>No drafts pending.</p></div>
                                            : stats.pendingQuotes.map(q => (
                                                <div key={q.id} onClick={() => navigate(`/billing/quotation/${q.id}`)} className="p-4 hover:bg-amber-50/30 cursor-pointer transition-colors block">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <p className="text-[13px] font-bold text-slate-900 font-mono">{q.quote_number}</p>
                                                        <span className="text-[11px] font-medium text-slate-400">{timeAgo(q.created_at)}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate mb-2">{q.projects?.title}</p>
                                                    <p className="text-sm font-black text-amber-600">₹{Number(q.grand_total).toLocaleString('en-IN')}</p>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group mt-0">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-800 text-sm flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div> AMC Renewals
                                        </h3>
                                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{stats.expiringAmcs.length}</div>
                                    </div>
                                    <div className="divide-y divide-slate-50 flex-1">
                                        {stats.expiringAmcs.length === 0
                                            ? <div className="h-full flex items-center justify-center p-8 text-sm text-slate-400"><p>No AMCs expiring in 30 days.</p></div>
                                            : stats.expiringAmcs.map(a => (
                                                <div key={a.id} onClick={() => navigate('/amc')} className="p-4 hover:bg-blue-50/30 cursor-pointer transition-colors block">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <p className="text-[13px] font-bold text-slate-900 font-mono">{a.contract_number}</p>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                                            Exp: {fmtDate(a.end_date)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{a.clients?.company_name || a.clients?.name}</p>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px] overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                        <h3 className="font-bold text-slate-900 text-base flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-indigo-500" /> Live Inventory Feed
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Real-time stock movement across all projects.</p>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto bg-slate-50/30">
                        {stats.recentLogs.length === 0
                            ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Layers className="w-12 h-12 mb-3 text-slate-200" />
                                    <p className="text-sm">Feed is quiet today.</p>
                                </div>
                            )
                            : (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-200 before:via-slate-200 before:to-transparent">
                                    {stats.recentLogs.map((log) => {
                                        const isOut = log.transaction_type === 'OUT';
                                        return (
                                            <div key={log.id} className="relative flex items-start gap-4 group">
                                                <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-sm shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${isOut ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>

                                                <div className="flex-1 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className={`inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${isOut ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                            {isOut ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownToLine className="w-3 h-3 mr-1" />}
                                                            {isOut ? 'Dispatched' : 'Received'}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-slate-400">
                                                            {timeAgo(log.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-800 leading-snug">
                                                        <strong className="text-slate-900 border-b-2 border-slate-200 pb-0.5">{log.quantity} units</strong> of <span className="text-slate-600">{log.products?.name}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        }
                    </div>
                    {stats.recentLogs.length > 0 && (
                        <div className="p-3 bg-white border-t border-slate-100 text-center">
                            <button onClick={() => navigate('/products/logs')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider">
                                View Full Activity Log →
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
