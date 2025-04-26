import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Calculator, Plus, X, Search, Trash2 } from 'lucide-react';

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
    const [clients, setClients] = useState([]);
    const [clientId, setClientId] = useState('');
    const [lineItems, setLineItems] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [showNewClient, setShowNewClient] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableProducts, setAvailableProducts] = useState([]);

    // New Client Form State
    const [newClientData, setNewClientData] = useState({ company_name: '', name: '', phone: '', email: '', gst_number: '' });

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
        if (projectId) {
            const [projRes, bomRes] = await Promise.all([
                supabase.from('projects').select('*, clients(id, name, company_name, gst_number, address, phone, email)').eq('id', projectId).single(),
                supabase.from('project_bom').select('*, products(name, sku, selling_price, tax_rate)').eq('project_id', projectId).order('created_at'),
            ]);
            if (projRes.data) {
                setProject(projRes.data);
                setClientId(projRes.data.client_id);
            }
            if (bomRes.data) {
                // Map BOM to line items format
                setLineItems(bomRes.data.map(b => ({
                    id: crypto.randomUUID(),
                    product_id: b.product_id,
                    name: b.products?.name,
                    sku: b.products?.sku,
                    quantity: b.quantity,
                    unit_sell_price: b.unit_sell_price
                })));
            }
        } else {
            // Standalone mode: load clients
            const { data } = await supabase.from('clients').select('id, name, company_name').order('company_name');
            setClients(data || []);
        }

        // Load products for manual picking
        const pRes = await supabase.from('products').select('id, name, sku, selling_price').order('name');
        setAvailableProducts(pRes.data || []);

        setLoading(false);
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setError('');
        if (!newClientData.company_name && !newClientData.name) {
            setError("Company name or contact name is required.");
            return;
        }

        try {
            const { data, error: err } = await supabase.from('clients').insert([newClientData]).select().single();
            if (err) throw err;
            setClients(prev => [...prev, data]);
            setClientId(data.id);
            setShowNewClient(false);
            setNewClientData({ company_name: '', name: '', phone: '', email: '', gst_number: '' });
        } catch (err) {
            setError("Failed to create client: " + err.message);
        }
    };

    const handleAddItem = (product) => {
        setLineItems(prev => [...prev, {
            id: crypto.randomUUID(),
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 1,
            unit_sell_price: product.selling_price
        }]);
        setShowPicker(false);
        setSearchQuery('');
    };

    const updateItemQty = (id, newQty) => {
        setLineItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, newQty) } : i));
    };

    const updateItemPrice = (id, newPrice) => {
        setLineItems(prev => prev.map(i => i.id === id ? { ...i, unit_sell_price: parseFloat(newPrice) || 0 } : i));
    };

    const removeItem = (id) => {
        setLineItems(prev => prev.filter(i => i.id !== id));
    };

    // Live Calculations
    const bomSellValue = lineItems.reduce((s, i) => s + ((parseFloat(i.unit_sell_price) || 0) * parseInt(i.quantity || 1)), 0);
    const extrasCost = parseFloat(cablingCost || 0) + parseFloat(laborCost || 0) + parseFloat(otherCost || 0);
    const subTotal = bomSellValue + extrasCost;
    const discountAmt = subTotal * (parseFloat(discountPct || 0) / 100);
    const afterDiscount = subTotal - discountAmt;
    const gstAmt = afterDiscount * (parseFloat(gstRate) / 100);
    const grandTotal = afterDiscount + gstAmt;

    const handleSave = async (status = 'DRAFT') => {
        if (!clientId && !projectId) {
            setError("You must select a client for this quotation.");
            return;
        }

        setSaving(true);
        setError('');
        try {
            const { data, error: err } = await supabase.from('quotations').insert([{
                quote_number: quoteNumber,
                project_id: projectId || null,
                client_id: clientId || project?.client_id || null,
                line_items: lineItems,
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

    if (loading) return <div className="text-center py-20 text-slate-500">Loading builder...</div>;

    const filteredProducts = availableProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6 relative">
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
                        <h3 className="font-bold text-slate-800 text-sm">Quotation Options</h3>

                        {!projectId && (
                            <div className="pb-2 border-b border-slate-100 mb-2">
                                <label className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                                    <span>Billed To (Client) <span className="text-red-500">*</span></span>
                                    <button onClick={() => setShowNewClient(true)} className="text-amber-600 hover:text-amber-700 hover:underline flex items-center">
                                        <Plus className="w-3 h-3 mr-0.5" /> New
                                    </button>
                                </label>
                                <select value={clientId} onChange={e => setClientId(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-slate-50">
                                    <option value="">-- Select Client --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                                </select>
                            </div>
                        )}

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
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-2 sticky top-6">
                        <h3 className="font-bold text-amber-800 text-sm flex items-center"><Calculator className="w-4 h-4 mr-2" /> Live Total</h3>
                        {[
                            { l: 'Line Items Value', v: bomSellValue },
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

                    {projectId && project && (
                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h3 className="font-bold text-slate-800 mb-3 text-sm">Project Reference</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Client</p>
                                    <p className="font-bold text-slate-800">{project.clients?.company_name || project.clients?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Project</p>
                                    <p className="font-bold text-slate-800">{project.title}</p>
                                    <p className="text-xs text-slate-500 font-mono">{project.project_code}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOM Line Items */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[300px]">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">Products & Services</h3>
                            <button onClick={() => setShowPicker(true)}
                                className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded hover:bg-amber-100 transition-colors">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Item
                            </button>
                        </div>

                        <table className="min-w-full text-sm">
                            <thead><tr className="text-xs text-slate-500 font-semibold uppercase bg-white border-b border-slate-100">
                                <th className="px-4 py-3 text-left">Item Details</th>
                                <th className="px-4 py-3 text-right w-24">Qty</th>
                                <th className="px-4 py-3 text-right w-32">Unit Price (₹)</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-center w-12"></th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {lineItems.length === 0
                                    ? <tr><td colSpan="5" className="px-4 py-12 text-center">
                                        <div className="text-slate-400 text-sm mb-2">No items added to this quotation yet.</div>
                                        <button onClick={() => setShowPicker(true)} className="text-amber-600 font-medium hover:underline text-sm">
                                            Search entire inventory to add items
                                        </button>
                                    </td></tr>
                                    : lineItems.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50 group">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800">{item.name}</div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <input type="number" min="1" value={item.quantity} onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 1)}
                                                    className="w-16 text-right border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-400" />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <input type="number" min="0" step="0.01" value={item.unit_sell_price} onChange={(e) => updateItemPrice(item.id, e.target.value)}
                                                    className="w-24 text-right border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-400" />
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-700">
                                                ₹{((parseFloat(item.unit_sell_price) || 0) * parseInt(item.quantity || 1)).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                }
                                {/* Extras as rows contextually */}
                                {parseFloat(cablingCost) > 0 && <tr className="bg-slate-50 text-xs"><td className="px-4 py-2 text-slate-500 text-right" colSpan="3">Cabling & Installation Material</td><td className="px-4 py-2 text-right font-semibold text-slate-700">₹{parseFloat(cablingCost).toFixed(2)}</td><td></td></tr>}
                                {parseFloat(laborCost) > 0 && <tr className="bg-slate-50 text-xs"><td className="px-4 py-2 text-slate-500 text-right" colSpan="3">Labour Charges</td><td className="px-4 py-2 text-right font-semibold text-slate-700">₹{parseFloat(laborCost).toFixed(2)}</td><td></td></tr>}
                                {parseFloat(otherCost) > 0 && <tr className="bg-slate-50 text-xs"><td className="px-4 py-2 text-slate-500 text-right" colSpan="3">Miscellaneous Expenses</td><td className="px-4 py-2 text-right font-semibold text-slate-700">₹{parseFloat(otherCost).toFixed(2)}</td><td></td></tr>}
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

            {/* Product Picker Modal */}
            {showPicker && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Add Line Item</h3>
                            <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-slate-700 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-slate-100 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search inventory by product name or SKU..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 bg-slate-50/50">
                            {filteredProducts.length === 0 ? (
                                <p className="text-center text-sm text-slate-400 py-10">No products found matching "{searchQuery}"</p>
                            ) : (
                                <ul className="space-y-1">
                                    {filteredProducts.map(p => (
                                        <li key={p.id}>
                                            <button onClick={() => handleAddItem(p)}
                                                className="w-full text-left p-3 rounded-lg hover:bg-amber-50 hover:text-amber-900 border border-transparent hover:border-amber-200 transition-all flex justify-between items-center group">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800 group-hover:text-amber-900">{p.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{p.sku}</div>
                                                </div>
                                                <div className="text-sm font-bold text-slate-700">
                                                    ₹{p.selling_price}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Client Modal */}
            {showNewClient && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">New Client</h3>
                            <button onClick={() => setShowNewClient(false)} className="text-slate-400 hover:text-slate-700 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClient} className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Company Name</label>
                                <input type="text" autoFocus value={newClientData.company_name} onChange={e => setNewClientData({ ...newClientData, company_name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">Contact Name</label>
                                    <input type="text" value={newClientData.name} onChange={e => setNewClientData({ ...newClientData, name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">Phone</label>
                                    <input type="text" value={newClientData.phone} onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="98765..." />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-amber-500 text-white font-semibold py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm">Save & Select</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationBuilder;
