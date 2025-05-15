import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ArrowLeft, User, FileText, Receipt, FolderKanban, Phone, Mail, MapPin, Hash, Globe } from 'lucide-react';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLORS = {
    DRAFT: 'bg-slate-100 text-slate-600',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-orange-100 text-orange-700',
    CANCELLED: 'bg-slate-200 text-slate-500',
    PAID: 'bg-emerald-100 text-emerald-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    UNPAID: 'bg-red-100 text-red-700',
    OVERDUE: 'bg-rose-100 text-rose-700',
    PLANNING: 'bg-slate-100 text-slate-600',
    INSTALLING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    ON_HOLD: 'bg-orange-100 text-orange-700',
};

const Badge = ({ status }) => (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
        {status?.replace(/_/g, ' ')}
    </span>
);

const TABS = [
    { id: 'quotes', label: 'Estimates', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
];

const ClientDetail = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('quotes');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const [cRes, qRes, iRes, pRes] = await Promise.all([
                supabase.from('clients').select('*').eq('id', clientId).single(),
                supabase.from('quotations').select('id, quote_number, status, grand_total, created_at, valid_until').eq('client_id', clientId).order('created_at', { ascending: false }),
                supabase.from('invoices').select('id, invoice_number, status, grand_total, due_date, created_at').eq('client_id', clientId).order('created_at', { ascending: false }),
                supabase.from('projects').select('id, title, project_code, status, start_date').eq('client_id', clientId).order('created_at', { ascending: false }),
            ]);
            setClient(cRes.data);
            setQuotes(qRes.data || []);
            setInvoices(iRes.data || []);
            setProjects(pRes.data || []);
            setLoading(false);
        };
        fetchAll();
    }, [clientId]);

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-amber-500 animate-spin" />
        </div>
    );

    if (!client) return (
        <div className="text-center py-24 text-slate-500">Client not found.</div>
    );

    const totQuotes = quotes.reduce((s, q) => s + (Number(q.grand_total) || 0), 0);
    const totInvoices = invoices.reduce((s, i) => s + (Number(i.grand_total) || 0), 0);

    return (
        <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <button onClick={() => navigate('/clients')}
                className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 group w-fit">
                <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                Back to Clients
            </button>

            {/* Profile Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="w-14 h-14 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                        {(client.company_name || client.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-slate-800">{client.company_name || client.name}</h1>
                        {client.company_name && <p className="text-slate-500 text-sm mt-0.5">Contact: {client.name}</p>}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" />{client.phone}</span>}
                            {client.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" />{client.email}</span>}
                            {client.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{client.address}</span>}
                            {client.gst_number && <span className="flex items-center gap-1.5"><Hash className="w-4 h-4 text-slate-400" />GST: {client.gst_number}</span>}
                            {client.website && <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline"><Globe className="w-4 h-4" />{client.website}</a>}
                        </div>
                        {client.location_url && (
                            <a href={client.location_url} target="_blank" rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                                📍 View on Map
                            </a>
                        )}
                    </div>

                    {/* Summary Stats */}
                    <div className="flex gap-4 flex-shrink-0">
                        <div className="text-center px-4 py-3 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="text-lg font-bold text-amber-700">{quotes.length}</div>
                            <div className="text-xs text-amber-600 font-medium">Estimates</div>
                            <div className="text-xs text-slate-500 mt-0.5">{fmt(totQuotes)}</div>
                        </div>
                        <div className="text-center px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="text-lg font-bold text-indigo-700">{invoices.length}</div>
                            <div className="text-xs text-indigo-600 font-medium">Invoices</div>
                            <div className="text-xs text-slate-500 mt-0.5">{fmt(totInvoices)}</div>
                        </div>
                        <div className="text-center px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="text-lg font-bold text-emerald-700">{projects.length}</div>
                            <div className="text-xs text-emerald-600 font-medium">Projects</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-amber-500 text-amber-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Quotes Tab */}
                {activeTab === 'quotes' && (
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estimate #</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Created</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Valid Until</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quotes.length === 0 ? (
                                <tr><td colSpan="6" className="py-12 text-center text-slate-400 text-sm">No estimates found for this client.</td></tr>
                            ) : quotes.map(q => (
                                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 font-mono font-bold text-slate-800 text-sm">{q.quote_number}</td>
                                    <td className="px-5 py-3"><Badge status={q.status} /></td>
                                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(q.grand_total)}</td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{fmtDate(q.created_at)}</td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{fmtDate(q.valid_until)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => navigate(`/billing/quotation/${q.id}`)}
                                            className="text-xs font-semibold text-amber-600 hover:text-amber-800 hover:underline">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Invoice #</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400 text-sm">No invoices found for this client.</td></tr>
                            ) : invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 font-mono font-bold text-slate-800 text-sm">{inv.invoice_number}</td>
                                    <td className="px-5 py-3"><Badge status={inv.status} /></td>
                                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(inv.grand_total)}</td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{fmtDate(inv.due_date)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => navigate(`/invoices/${inv.id}`)}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Project</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Code</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Start Date</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400 text-sm">No projects found for this client.</td></tr>
                            ) : projects.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 font-semibold text-slate-800 text-sm">{p.title}</td>
                                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.project_code}</td>
                                    <td className="px-5 py-3"><Badge status={p.status} /></td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{fmtDate(p.start_date)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => navigate(`/projects/${p.id}`)}
                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ClientDetail;
