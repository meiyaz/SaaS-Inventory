import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Percent, Ruler, FileText, Send } from 'lucide-react';

const GST_RATES = [
    { label: '18% GST (Standard)', value: 18 },
    { label: '12% GST', value: 12 },
    { label: '5% GST', value: 5 },
    { label: '0% (Exempt)', value: 0 },
];

const Pricing = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pricing engine inputs
    const [gstRate, setGstRate] = useState(18);
    const [discountPct, setDiscountPct] = useState(0);
    const [cablingMeters, setCablingMeters] = useState(0);
    const [cablingCostPm, setCablingCostPm] = useState(35);  // ₹35/meter is a typical CCTV coax rate
    const [laborCost, setLaborCost] = useState(0);
    const [otherCost, setOtherCost] = useState(0);
    const [marginOverride, setMarginOverride] = useState('');  // Optional manual margin % override

    useEffect(() => { fetchData(); }, [projectId]);

    const fetchData = async () => {
        setLoading(true);
        const [projRes, bomRes] = await Promise.all([
            supabase.from('projects').select('*, clients(name, company_name)').eq('id', projectId).single(),
            supabase.from('project_bom').select('*, products(name, sku, base_price, selling_price)').eq('project_id', projectId).order('created_at'),
        ]);
        if (projRes.data) setProject(projRes.data);
        if (!bomRes.error) setBomItems(bomRes.data || []);
        setLoading(false);
    };

    if (loading) return <div className="text-center py-20 text-slate-500">Loading pricing engine...</div>;
    if (!project) return <div className="text-center py-20 text-red-500">Project not found.</div>;

    // P&L Formulas
    const totalBuy = bomItems.reduce((sum, item) => sum + (Number(item.products?.base_price || 0) * item.quantity), 0);
    const totalSell = bomItems.reduce((sum, item) => sum + (Number(item.unit_sell_price || 0) * item.quantity), 0);

    const totalExtras = (Number(cablingMeters) * Number(cablingCostPm)) + Number(laborCost) + Number(otherCost);

    const subTotal = totalSell + totalExtras;

    const discountAmt = (subTotal * Number(discountPct)) / 100;
    const finalBeforeTax = subTotal - discountAmt;

    const gstAmt = (finalBeforeTax * Number(gstRate)) / 100;
    const grandTotal = finalBeforeTax + gstAmt;

    // Margin = (Final Pre-Tax Revenue - Total Base Cost) / Final Pre-Tax Revenue
    const marginPct = finalBeforeTax > 0 ? ((finalBeforeTax - totalBuy) / finalBeforeTax) * 100 : 0;

    const fmt = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Nav */}
            <div>
                <button onClick={() => navigate(`/projects/${projectId}/bom`)} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-4 group">
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                    Back to BOM
                </button>
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 font-mono mb-0.5">{project.project_code} · {project.clients?.company_name || project.clients?.name}</p>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center">
                            <Calculator className="w-5 h-5 mr-2 text-amber-500" />
                            Pricing Engine
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Grand Total (incl. GST)</p>
                            <p className="text-3xl font-black text-slate-900">{fmt(grandTotal)}</p>
                        </div>
                        <button
                            onClick={() => navigate(`/billing/quotation/new/${projectId}`)}
                            className="inline-flex items-center px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors shrink-0"
                        >
                            <Send className="w-4 h-4 mr-1.5" /> Create Quotation
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Adjustment Controls */}
                <div className="lg:col-span-1 flex flex-col gap-4">

                    {/* GST */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center text-sm"><Percent className="w-4 h-4 mr-2 text-amber-500" /> Tax Setting</h3>
                        <select value={gstRate} onChange={(e) => setGstRate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white">
                            {GST_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    {/* Discount */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">Discount</h3>
                        <div className="flex items-center gap-2">
                            <input type="number" min="0" max="100" step="0.5" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)}
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="0" />
                            <span className="text-slate-500 font-semibold text-sm">%</span>
                        </div>
                        {discountPct > 0 && <p className="text-xs text-rose-500 mt-1.5">Discount deduction: {fmt(discountAmt)}</p>}
                    </div>

                    {/* Cabling */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center text-sm"><Ruler className="w-4 h-4 mr-2 text-blue-500" /> Cabling Estimate</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Cable Run (Meters)</label>
                                <input type="number" min="0" value={cablingMeters} onChange={(e) => setCablingMeters(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Cost per Meter (₹)</label>
                                <input type="number" min="0" step="0.5" value={cablingCostPm} onChange={(e) => setCablingCostPm(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                            </div>
                            {cablingTotal > 0 && <p className="text-xs text-blue-600 font-medium">Cabling total: {fmt(cablingTotal)}</p>}
                        </div>
                    </div>

                    {/* Labor & Other */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">Additional Costs</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Labor / Installation (₹)</label>
                                <input type="number" min="0" value={laborCost} onChange={(e) => setLaborCost(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Other Charges (₹)</label>
                                <input type="number" min="0" value={otherCost} onChange={(e) => setOtherCost(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="0" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Breakdown */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* BOM Line Summary */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center"><FileText className="w-4 h-4 mr-2 text-slate-400" /> Material Lines from BOM</h3>
                        </div>
                        <table className="min-w-full text-sm divide-y divide-slate-100">
                            <thead><tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Qty</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Buy</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Sell</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Line Total</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {bomItems.length === 0
                                    ? <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400 text-xs">No BOM items. Add them in the BOM page first.</td></tr>
                                    : bomItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-slate-800">{item.products?.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{item.products?.sku}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-slate-700">{item.quantity}</td>
                                            <td className="px-4 py-2.5 text-right text-slate-500">₹{(item.products?.base_price || 0).toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right text-slate-700">₹{item.unit_sell_price.toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">₹{(item.quantity * item.unit_sell_price).toFixed(2)}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    {/* Final Breakdown */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">Final Price Breakdown</h3>
                        {[
                            { label: 'BOM Sell Value', value: bomSellValue, style: 'text-slate-700' },
                            { label: 'Cabling Cost', value: cablingTotal, style: 'text-slate-700' },
                            { label: 'Labor / Installation', value: laborTotal, style: 'text-slate-700' },
                            { label: 'Other Charges', value: otherTotal, style: 'text-slate-700' },
                            { label: 'Sub-Total', value: subTotal, style: 'font-bold text-slate-800', border: true },
                            { label: `Discount (${discountPct}%)`, value: -discountAmt, style: 'text-rose-600' },
                            { label: 'After Discount', value: afterDiscount, style: 'font-semibold text-slate-800' },
                            { label: `GST @ ${gstRate}%`, value: gstAmt, style: 'text-amber-700' },
                        ].map((row, i) => (
                            <div key={i} className={`flex justify-between items-center py-1.5 ${row.border ? 'border-t border-b border-slate-100 my-1' : ''}`}>
                                <span className={`text-sm ${row.style}`}>{row.label}</span>
                                <span className={`text-sm font-semibold tabular-nums ${row.style} ${row.value < 0 ? 'text-rose-600' : ''}`}>
                                    {row.value < 0 ? `– ${fmt(row.value)}` : fmt(row.value)}
                                </span>
                            </div>
                        ))}
                        <div className="border-t-2 border-slate-800 pt-3 flex justify-between items-center">
                            <span className="text-base font-bold text-slate-900">Grand Total (incl. GST)</span>
                            <span className="text-xl font-black text-slate-900">{fmt(grandTotal)}</span>
                        </div>
                    </div>

                    {/* Margin Card */}
                    <div className={`rounded-xl p-5 border ${marginPct >= 20 ? 'bg-emerald-50 border-emerald-200' : marginPct >= 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="font-bold text-sm mb-2 text-slate-700">Profitability Summary (excl. GST)</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Total Buy Cost</p>
                                <p className="text-lg font-bold text-slate-800">{fmt(totalBuyCost)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Gross Profit</p>
                                <p className={`text-lg font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{grossProfit >= 0 ? '' : '– '}{fmt(grossProfit)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Margin %</p>
                                <p className={`text-lg font-bold ${marginPct >= 20 ? 'text-emerald-700' : marginPct >= 0 ? 'text-amber-700' : 'text-red-700'}`}>{marginPct.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
