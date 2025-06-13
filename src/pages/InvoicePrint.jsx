import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const STATUS_BADGE = {
    DRAFT: 'bg-slate-100 text-slate-600',
    SENT: 'bg-blue-100 text-blue-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-emerald-100 text-emerald-700',
    OVERDUE: 'bg-red-100 text-red-700',
};

const InvoicePrint = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const { orgId } = useAuth();
    const [invoice, setInvoice] = useState(null);
    const [lineItems, setLineItems] = useState([]);
    const [org, setOrg] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [invoiceId, orgId]);

    const fetchData = async () => {
        setLoading(true);
        const [{ data: inv }, { data: lines }, { data: orgData }] = await Promise.all([
            supabase.from('invoices').select('*').eq('id', invoiceId).single(),
            supabase.from('invoice_line_items').select('*').eq('invoice_id', invoiceId).order('created_at'),
            orgId ? supabase.from('organizations').select('name, phone, address, gst_number, billing_email').eq('id', orgId).single() : { data: null },
        ]);
        if (inv) {
            const { data: clientData } = inv.client_id
                ? await supabase.from('clients').select('id, name, company_name, gst_number, address, phone, email').eq('id', inv.client_id).single()
                : { data: null };
            setInvoice({ ...inv, clients: clientData || null });
        }
        if (orgData) setOrg(orgData);
        setLineItems(lines || []);
        setLoading(false);
    };

    if (loading) return <div className="text-center py-20 text-slate-500">Loading invoice...</div>;
    if (!invoice) return <div className="text-center py-20 text-red-500">Invoice not found.</div>;

    const client = invoice.clients;
    const cName = org.name || 'Your Company Name';
    const cAddress = org.address || '123, Business Street, City';
    const cGst = org.gst_number || 'YOUR_GST_NUMBER';
    const cPhone = org.phone || '+91 00000 00000';

    return (
        <div>
            {/* Controls — hidden on print */}
            <div className="flex items-center gap-4 mb-6 print:hidden">
                <button onClick={() => navigate('/invoices')} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 group">
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Back to Invoices
                </button>
                <div className="ml-auto flex items-center gap-2">
                    {invoice.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" /> PAID
                        </span>
                    )}
                    <button onClick={() => window.print()} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
                        <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                    </button>
                </div>
            </div>

            {/* Printable doc */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:rounded-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">INVOICE</h1>
                        <p className="font-mono font-bold text-indigo-600 text-lg">{invoice.invoice_number}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[invoice.status] || STATUS_BADGE.DRAFT}`}>
                            {invoice.status}
                        </span>
                    </div>
                    <div className="text-right text-sm text-slate-600 space-y-0.5">
                        <p className="font-bold text-slate-900 text-base">{cName}</p>
                        <p className="whitespace-pre-line">{cAddress}</p>
                        <p>GST: {cGst}</p>
                        <p>Ph: {cPhone}</p>
                    </div>
                </div>

                {/* Bill To + Dates */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bill To</p>
                        <p className="font-bold text-slate-900 text-base">{client?.company_name || client?.name}</p>
                        {client?.address && <p className="text-sm text-slate-600 mt-1">{client.address}</p>}
                        {client?.gst_number && <p className="text-xs font-mono text-slate-500 mt-1">GSTIN: {client.gst_number}</p>}
                        {client?.phone && <p className="text-xs text-slate-500">Ph: {client.phone}</p>}
                        {client?.email && <p className="text-xs text-slate-500">{client.email}</p>}
                    </div>
                    <div className="text-right text-sm text-slate-600 space-y-1.5">
                        <div><span className="text-slate-400 mr-2">Invoice Date:</span><span className="font-semibold text-slate-800">{fmtD(invoice.created_at)}</span></div>
                        <div><span className="text-slate-400 mr-2">Due Date:</span><span className={`font-semibold ${invoice.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-800'}`}>{fmtD(invoice.due_date)}</span></div>
                        <div><span className="text-slate-400 mr-2">Type:</span><span className="font-semibold text-slate-800">{invoice.reference_type}</span></div>
                    </div>
                </div>

                {/* Line items */}
                <table className="w-full mb-6 text-sm">
                    <thead>
                        <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                            <th className="px-4 py-2.5 text-left w-8">#</th>
                            <th className="px-4 py-2.5 text-left">Description</th>
                            <th className="px-4 py-2.5 text-center">Qty</th>
                            <th className="px-4 py-2.5 text-right">Unit Rate</th>
                            <th className="px-4 py-2.5 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lineItems.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400 italic">No line items found.</td></tr>
                        ) : lineItems.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-4 py-2.5 text-slate-500">{idx + 1}</td>
                                <td className="px-4 py-2.5 font-medium text-slate-900">{item.description}</td>
                                <td className="px-4 py-2.5 text-center text-slate-700">{item.quantity}</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">{fmt(item.unit_price)}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{fmt(item.total_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-64 space-y-1.5 text-sm">
                        {invoice.subtotal > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Sub Total</span><span>{fmt(invoice.subtotal)}</span>
                            </div>
                        )}
                        {invoice.discount_amt > 0 && (
                            <div className="flex justify-between text-rose-600">
                                <span>Discount</span><span>– {fmt(invoice.discount_amt)}</span>
                            </div>
                        )}
                        {invoice.tax_amt > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>GST / Tax</span><span>{fmt(invoice.tax_amt)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-base border-t-2 border-slate-800 pt-2 mt-2 text-slate-900">
                            <span>GRAND TOTAL</span><span>{fmt(invoice.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <p className="text-xs font-bold uppercase text-indigo-600 mb-1">Notes</p>
                        <p className="text-sm text-slate-700">{invoice.notes}</p>
                    </div>
                )}

                {/* Signatures */}
                <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-12">
                    <div>
                        <div className="border-b border-slate-300 mb-1 h-8"></div>
                        <p className="text-xs text-slate-500">Authorised Signatory — {client?.company_name || client?.name}</p>
                    </div>
                    <div>
                        <div className="border-b border-slate-300 mb-1 h-8"></div>
                        <p className="text-xs text-slate-500">Authorised Signatory — {cName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePrint;
