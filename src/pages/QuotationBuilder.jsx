import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Printer, Calculator, Plus } from 'lucide-react';

const GST_RATES = [18, 12, 5, 0];
const DEFAULT_TERMS = `1. This quotation is valid for 30 days from the date of issue.
2. Prices are subject to change if final site dimensions differ significantly.
3. 50% advance payment required to confirm the order.
4. Balance due on completion of installation.
5. Warranty: 1 Year on Hardware, 90 Days on Labour.`;

const generateQuoteNumber = () => {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    return `QT-${y}${m}-${rand}`;
};

const QuotationBuilder = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [quoteNumber, setQuoteNumber] = useState(generateQuoteNumber());
    const [validUntil, setValidUntil] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    });
    const [gstRate, setGstRate] = useState(18);
    const [discountPct, setDiscountPct] = useState(0);
    const [cablingCost, setCablingCost] = useState(0);
    const [laborCost, setLaborCost] = useState(0);
    const [otherCost, setOtherCost] = useState(0);
    const [terms, setTerms] = useState(DEFAULT_TERMS);
    const [notes, setNotes] = useState('');

    useEffect(() => { fetchData(); }, [projectId]);

    const fetchData = async () => {
        setLoading(true);
        const [projRes, bomRes] = await Promise.all([
            supabase.from('projects').select('*, clients(name, company_name, gst_number, address, phone, email)').eq('id', projectId).single(),
            supabase.from('project_bom').select('*, products(name, sku, selling_price, tax_rate)').eq('project_id', projectId).order('created_at'),
        ]);
        if (projRes.data) setProject(projRes.data);
        if (!bomRes.error) setBomItems(bomRes.data || []);
        setLoading(false);
    };

    // Live Calculations
    const bomSellValue = bomItems.reduce((s, i) => s + (i.unit_sell_price * i.quantity), 0);
    const extrasCost = parseFloat(cablingCost || 0) + parseFloat(laborCost || 0) + parseFloat(otherCost || 0);
    const subTotal = bomSellValue + extrasCost;
    const discountAmt = subTotal * (parseFloat(discountPct || 0) / 100);
    const afterDiscount = subTotal - discountAmt;
    const gstAmt = afterDiscount * (parseFloat(gstRate) / 100);
    const grandTotal = afterDiscount + gstAmt;

    const handleSave = async (status = 'DRAFT') => {
        setSaving(true);
        setError('');
        try {
            const { data, error: err } = await supabase.from('quotations').insert([{
                quote_number: quoteNumber,
                project_id: projectId,
                status,
                valid_until: validUntil || null,
                bom_sell_value: bomSellValue,
                cabling_cost: parseFloat(cablingCost || 0),
                labor_cost: parseFloat(laborCost || 0),
                other_cost: parseFloat(otherCost || 0),
                discount_pct: parseFloat(discountPct || 0),
                discount_amt: discountAmt,
                subtotal_after_discount: afterDiscount,
                gst_rate: parseFloat(gstRate),
                gst_amt: gstAmt,
                grand_total: grandTotal,
                terms_and_conditions: terms,
                notes,
            }]).select().single();

            if (err) throw err;
            navigate(`/billing/quotation/${data.id}/print`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (loading) return <div className="text-center py-20 text-slate-500">Loading project data...</div>;

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/billing')}
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 group">
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Quotations
                </button>
                <div className="flex gap-2">
                    <button onClick={() => handleSave('DRAFT')} disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-60">
                        <Save className="w-4 h-4 mr-1.5" /> Save Draft
                    </button>
                    <button onClick={() => handleSave('SENT')} disabled={saving}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-60">
                        <Send className="w-4 h-4 mr-1.5" /> Generate & Print
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quote Settings */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Quotation Details</h3>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Quote Number</label>
                            <input value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono uppercase" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Valid Until</label>
                            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">GST Rate</label>
                            <select value={gstRate} onChange={e => setGstRate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white">
                                {GST_RATES.map(r => <option key={r} value={r}>{r}% GST</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Discount %</label>
                            <input type="number" min="0" max="100" step="0.5" value={discountPct} onChange={e => setDiscountPct(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                        <h3 className="font-bold text-slate-800 text-sm">Additional Costs</h3>
                        {[
                            { label: 'Cabling (₹)', val: cablingCost, set: setCablingCost },
                            { label: 'Labor (₹)', val: laborCost, set: setLaborCost },
                            { label: 'Other (₹)', val: otherCost, set: setOtherCost },
                        ].map(f => (
                            <div key={f.label}>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">{f.label}</label>
                                <input type="number" min="0" value={f.val} onChange={e => f.set(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-2">
                        <h3 className="font-bold text-amber-800 text-sm flex items-center"><Calculator className="w-4 h-4 mr-2" /> Live Total</h3>
                        {[
                            { l: 'BOM Sell Value', v: bomSellValue },
                            { l: 'Extras', v: extrasCost },
                            { l: `Discount (${discountPct}%)`, v: -discountAmt, neg: true },
                            { l: `GST @ ${gstRate}%`, v: gstAmt },
                        ].map((r, i) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span className="text-amber-700">{r.l}</span>
                                <span className={`font-medium ${r.neg && discountAmt > 0 ? 'text-rose-600' : 'text-amber-800'}`}>
                                    {r.neg && discountAmt > 0 ? `– ${fmt(discountAmt)}` : fmt(r.v)}
                                </span>
                            </div>
                        ))}
                        <div className="border-t border-amber-200 pt-2 flex justify-between">
                            <span className="font-bold text-amber-900 text-sm">Grand Total</span>
                            <span className="font-black text-amber-900 text-sm">{fmt(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Right: BOM Preview */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* Client / Project Header */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">Billed To</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Client</p>
                                <p className="font-bold text-slate-800">{project?.clients?.company_name || project?.clients?.name}</p>
                                <p className="text-slate-500 text-xs mt-1">{project?.clients?.address}</p>
                                {project?.clients?.gst_number && <p className="text-xs text-slate-500 mt-0.5 font-mono">GST: {project.clients.gst_number}</p>}
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Project</p>
                                <p className="font-bold text-slate-800">{project?.title}</p>
                                <p className="text-xs text-slate-500 font-mono">{project?.project_code}</p>
                                <p className="text-xs text-slate-500 mt-1">{project?.site_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* BOM Line Items */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 text-sm">Line Items from BOM</h3>
                        </div>
                        <table className="min-w-full text-sm">
                            <thead><tr className="text-xs text-slate-500 font-semibold uppercase bg-white">
                                <th className="px-4 py-2 text-left">Item</th>
                                <th className="px-4 py-2 text-right">Qty</th>
                                <th className="px-4 py-2 text-right">Unit Price</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {bomItems.length === 0
                                    ? <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-400 text-xs">
                                        No BOM items found. <button onClick={() => navigate(`/projects/${projectId}/bom`)}
                                            className="text-violet-600 underline">Add items to the BOM first.</button>
                                    </td></tr>
                                    : bomItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium">{item.products?.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{item.products?.sku}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right">{item.quantity}</td>
                                            <td className="px-4 py-2.5 text-right">₹{Number(item.unit_sell_price).toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right font-semibold">₹{(item.quantity * item.unit_sell_price).toFixed(2)}</td>
                                        </tr>
                                    ))
                                }
                                {/* Extras as rows */}
                                {parseFloat(cablingCost) > 0 && <tr className="bg-slate-50/50"><td className="px-4 py-2 text-slate-600 italic" colSpan="3">Cabling & Installation Material</td><td className="px-4 py-2 text-right font-semibold">₹{parseFloat(cablingCost).toFixed(2)}</td></tr>}
                                {parseFloat(laborCost) > 0 && <tr className="bg-slate-50/50"><td className="px-4 py-2 text-slate-600 italic" colSpan="3">Labour Charges</td><td className="px-4 py-2 text-right font-semibold">₹{parseFloat(laborCost).toFixed(2)}</td></tr>}
                                {parseFloat(otherCost) > 0 && <tr className="bg-slate-50/50"><td className="px-4 py-2 text-slate-600 italic" colSpan="3">Miscellaneous</td><td className="px-4 py-2 text-right font-semibold">₹{parseFloat(otherCost).toFixed(2)}</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Notes & Terms */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes (printed on quote)</label>
                            <textarea rows="2" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes for the client..."
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Terms & Conditions</label>
                            <textarea rows="5" value={terms} onChange={e => setTerms(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none font-mono text-xs" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationBuilder;
