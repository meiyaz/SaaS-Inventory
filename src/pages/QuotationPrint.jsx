import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Printer, ArrowRightLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const QuotationPrint = () => {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const { orgId, user } = useAuth();
    const printRef = useRef();

    const [quote, setQuote] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [org, setOrg] = useState({});
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const [confirm, setConfirm] = useState(null);

    useEffect(() => { fetchData(); }, [quoteId, orgId]);

    const fetchData = async () => {
        setLoading(true);
        const [{ data: q }, { data: orgData }] = await Promise.all([
            supabase.from('quotations')
                .select('*, clients(name, company_name, gst_number, address, phone, email), projects(title, project_code, site_address, clients(name, company_name, gst_number, address, phone, email))')
                .eq('id', quoteId).single(),
            orgId ? supabase.from('organizations').select('name, phone, address, gst_number, billing_email').eq('id', orgId).single() : { data: null },
        ]);

        if (q) {
            setQuote(q);
            if (q.line_items && q.line_items.length > 0) {
                setBomItems(q.line_items);
            } else if (q.project_id) {
                const { data: bom } = await supabase
                    .from('project_bom')
                    .select('*, products(name, sku)')
                    .eq('project_id', q.project_id)
                    .order('created_at');

                setBomItems((bom || []).map(b => ({
                    ...b,
                    name: b.products?.name,
                    sku: b.products?.sku
                })));
            }
        }
        if (orgData) setOrg(orgData);
        setLoading(false);
    };

    const handlePrint = () => window.print();

    if (loading) return <div className="text-center py-20 text-slate-500">Loading estimate...</div>;
    if (!quote) return <div className="text-center py-20 text-red-500">Estimate not found.</div>;

    const handleConvertToTask = async () => {
        setConfirm({
            message: `Convert estimate ${quote.quote_number} into a billable task?`,
            confirmLabel: 'Convert',
            onConfirm: async () => {
                try {
                    const payload = {
                        organization_id: orgId,
                        title: `Execution: ${quote.quote_number}`,
                        description: `Auto-generated task to execute the accepted estimate.`,
                        project_id: quote.project_id || null,
                        priority: 'HIGH',
                        status: 'PENDING',
                        billable: true,
                        billing_amount: quote.grand_total,
                        created_by: user?.id,
                    };
                    const { error } = await supabase.from('tasks').insert([payload]);
                    if (error) throw error;
                    toast('Task created. Head over to Tasks to view it.', 'success');
                } catch (err) {
                    console.error(err);
                    toast('Failed to convert to task: ' + err.message, 'error');
                }
            },
        });
    };

    const client = quote.clients || quote.projects?.clients;
    const project = quote.projects;

    const cName = org.name || 'Your Company Name';
    const cAddress = org.address || '123, Business Street, City';
    const cGst = org.gst_number || 'YOUR_GST_NUMBER';
    const cPhone = org.phone || '+91 00000 00000';

    return (
        <div>
            {/* Print controls — hidden on actual print */}
            <div className="flex items-center gap-4 mb-6 print:hidden">
                <button onClick={() => navigate('/billing')}
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 group">
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Estimates
                </button>
                <div className="ml-auto flex items-center gap-3">
                    {quote.status === 'ACCEPTED' && (
                        <button onClick={handleConvertToTask}
                            className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
                            <ArrowRightLeft className="w-4 h-4 mr-2" /> Convert to Task
                        </button>
                    )}
                    <button onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors">
                        <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Printable Area */}
            <div ref={printRef} className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:rounded-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">ESTIMATE</h1>
                        <p className="font-mono font-bold text-amber-600 text-lg">{quote.quote_number}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600 space-y-0.5">
                        <p className="font-bold text-slate-900 text-base">{cName}</p>
                        <p className="whitespace-pre-line">{cAddress}</p>
                        <p>GST: {cGst}</p>
                        <p>Phone: {cPhone}</p>
                    </div>
                </div>

                {/* Client + Dates */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bill To</p>
                        <p className="font-bold text-slate-900 text-base">{client?.company_name || client?.name}</p>
                        {client?.address && <p className="text-sm text-slate-600 mt-1">{client.address}</p>}
                        {client?.gst_number && <p className="text-xs font-mono text-slate-500 mt-1">GSTIN: {client.gst_number}</p>}
                        {client?.phone && <p className="text-xs text-slate-500">Ph: {client.phone}</p>}
                    </div>
                    <div className="text-right text-sm text-slate-600 space-y-1.5">
                        <div><span className="text-slate-400 mr-2">Date:</span><span className="font-semibold text-slate-800">{fmtD(quote.created_at)}</span></div>
                        <div><span className="text-slate-400 mr-2">Valid Until:</span><span className="font-semibold text-slate-800">{fmtD(quote.valid_until)}</span></div>
                        <div><span className="text-slate-400 mr-2">Project:</span><span className="font-semibold text-slate-800">{project?.title}</span></div>
                        {project?.site_address && <div><span className="text-slate-400 mr-2">Site:</span><span className="text-slate-700">{project.site_address}</span></div>}
                    </div>
                </div>

                {/* Line Items */}
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
                        {bomItems.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-4 py-2.5 text-slate-500">{idx + 1}</td>
                                <td className="px-4 py-2.5">
                                    <div className="font-medium text-slate-900">{item.name}</div>
                                    <div className="text-xs text-slate-400 font-mono">{item.sku}</div>
                                </td>
                                <td className="px-4 py-2.5 text-center text-slate-700">{item.quantity}</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">{fmt(item.unit_sell_price)}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{fmt(item.quantity * item.unit_sell_price)}</td>
                            </tr>
                        ))}
                        {/* Extras */}
                        {[
                            { label: 'Cabling & Installation Material', value: quote.cabling_cost },
                            { label: 'Labour Charges', value: quote.labor_cost },
                            { label: 'Miscellaneous Expenditures', value: quote.other_cost },
                        ].filter(r => r.value > 0).map((r, i) => (
                            <tr key={i} className="bg-slate-50 italic">
                                <td className="px-4 py-2 text-slate-400 text-center">{bomItems.length + i + 1}</td>
                                <td className="px-4 py-2 text-slate-600" colSpan="3">{r.label}</td>
                                <td className="px-4 py-2 text-right font-semibold text-slate-900">{fmt(r.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-64 space-y-1.5 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Sub Total</span>
                            <span>{fmt(quote.bom_sell_value + quote.cabling_cost + quote.labor_cost + quote.other_cost)}</span>
                        </div>
                        {quote.discount_pct > 0 && (
                            <div className="flex justify-between text-rose-600">
                                <span>Discount ({quote.discount_pct}%)</span>
                                <span>– {fmt(quote.discount_amt)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                            <span>GST @ {quote.gst_rate}%</span>
                            <span>{fmt(quote.gst_amt)}</span>
                        </div>
                        <div className="flex justify-between font-black text-base border-t-2 border-slate-800 pt-2 mt-2 text-slate-900">
                            <span>GRAND TOTAL</span>
                            <span>{fmt(quote.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                        <p className="text-xs font-bold uppercase text-amber-600 mb-1">Notes</p>
                        <p className="text-sm text-slate-700">{quote.notes}</p>
                    </div>
                )}

                {/* Terms */}
                {quote.terms_and_conditions && (
                    <div className="border-t border-slate-200 pt-4">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-2">Terms & Conditions</p>
                        <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">{quote.terms_and_conditions}</p>
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
            <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
        </div>
    );
};

export default QuotationPrint;
