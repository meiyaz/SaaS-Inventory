import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ClipboardList, Package, Save, AlertCircle, Calculator } from 'lucide-react';

const STATUS_COLOR = {
    LEAD: 'bg-slate-100 text-slate-700',
    SURVEY: 'bg-blue-100 text-blue-700',
    QUOTED: 'bg-violet-100 text-violet-700',
    WON: 'bg-amber-100 text-amber-700',
    INSTALLING: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    LOST: 'bg-red-100 text-red-700',
};

const BOM = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // New line state
    const [newProductId, setNewProductId] = useState('');
    const [newQty, setNewQty] = useState(1);
    const [newUnitSellPrice, setNewUnitSellPrice] = useState('');
    const [newNotes, setNewNotes] = useState('');

    useEffect(() => { fetchData(); }, [projectId]);

    const fetchData = async () => {
        setLoading(true);
        const [projRes, bomRes, prodRes] = await Promise.all([
            supabase.from('projects').select('*, clients(name, company_name)').eq('id', projectId).single(),
            supabase.from('project_bom').select('*, products(name, sku, brand, selling_price)').eq('project_id', projectId).order('created_at'),
            supabase.from('products').select('id, name, sku, selling_price, current_stock').order('name'),
        ]);
        if (projRes.data) setProject(projRes.data);
        if (!bomRes.error) setBomItems(bomRes.data || []);
        if (!prodRes.error) setProducts(prodRes.data || []);
        setLoading(false);
    };

    // Auto-fill sell price from master product's selling_price when a product is selected
    const handleProductSelect = (e) => {
        const id = e.target.value;
        setNewProductId(id);
        if (id) {
            const prod = products.find(p => p.id === id);
            if (prod) setNewUnitSellPrice(prod.selling_price?.toString() || '');
        } else {
            setNewUnitSellPrice('');
        }
    };

    const handleAddLine = async (e) => {
        e.preventDefault();
        if (!newProductId || !newQty || !newUnitSellPrice) return;
        setSaving(true);
        setError('');

        const { error: err } = await supabase.from('project_bom').insert([{
            project_id: projectId,
            product_id: newProductId,
            quantity: parseInt(newQty),
            unit_sell_price: parseFloat(newUnitSellPrice),
            notes: newNotes || null,
        }]);

        if (err) {
            setError('Failed to add item: ' + err.message);
        } else {
            setNewProductId('');
            setNewQty(1);
            setNewUnitSellPrice('');
            setNewNotes('');
            fetchData();
        }
        setSaving(false);
    };

    const handleDeleteLine = async (id) => {
        if (!window.confirm('Remove this item from the BOM?')) return;
        await supabase.from('project_bom').delete().eq('id', id);
        fetchData();
    };

    // Summary calculations
    const totalMaterialCost = bomItems.reduce((sum, item) => sum + ((item.products?.selling_price || 0) * item.quantity), 0);
    const totalProjectValue = bomItems.reduce((sum, item) => sum + (item.unit_sell_price * item.quantity), 0);
    const totalProfit = totalProjectValue - totalMaterialCost;

    if (loading) return <div className="text-center py-20 text-slate-500">Loading BOM...</div>;
    if (!project) return <div className="text-center py-20 text-red-500"><AlertCircle className="mx-auto mb-2 w-8 h-8" /> Project not found.</div>;

    const statusStyle = STATUS_COLOR[project.status] || 'bg-slate-100 text-slate-700';

    return (
        <div className="flex flex-col gap-6">
            {/* Back + Project Header */}
            <div>
                <button onClick={() => navigate('/projects')} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-4 group">
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects
                </button>
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusStyle}`}>{project.status}</span>
                            <span className="text-xs text-slate-400 font-mono">{project.project_code}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{project.title}</h2>
                        {project.clients && <p className="text-sm text-slate-500 mt-0.5">{project.clients.company_name || project.clients.name}</p>}
                    </div>
                    {project.contract_value && (
                        <div className="text-right shrink-0">
                            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Contract Value</div>
                            <div className="text-2xl font-bold text-slate-800">₹{Number(project.contract_value).toLocaleString('en-IN')}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* BOM Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-violet-500" />
                    <h3 className="font-bold text-slate-800">Bill of Materials</h3>
                    <span className="ml-3 text-xs text-slate-400">{bomItems.length} line items</span>
                    <button
                        onClick={() => navigate(`/projects/${projectId}/pricing`)}
                        className="ml-auto inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Calculator className="w-3.5 h-3.5 mr-1.5" /> Open Pricing Engine
                    </button>
                </div>

                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Sell Price</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Total</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {bomItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-10 text-center text-slate-400">
                                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                                    No items added yet. Use the form below to add products.
                                </td>
                            </tr>
                        ) : (
                            bomItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <div className="font-semibold text-sm text-slate-900">{item.products?.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{item.products?.sku}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right text-sm font-medium text-slate-800">{item.quantity}</td>
                                    <td className="px-5 py-3 text-right text-sm text-slate-700">₹{Number(item.unit_sell_price).toFixed(2)}</td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-slate-900">₹{(item.quantity * item.unit_sell_price).toFixed(2)}</td>
                                    <td className="px-5 py-3 text-xs text-slate-500 italic">{item.notes || '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => handleDeleteLine(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Add Line Form */}
                <div className="p-5 border-t border-slate-200 bg-slate-50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Add Item</h4>
                    {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                    <form onSubmit={handleAddLine} className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Product <span className="text-red-500">*</span></label>
                            <select required value={newProductId} onChange={handleProductSelect}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 bg-white">
                                <option value="">— Select Product —</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>[{p.current_stock} in stock] {p.sku} – {p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Qty <span className="text-red-500">*</span></label>
                            <input type="number" min="1" required value={newQty} onChange={(e) => setNewQty(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                        </div>
                        <div className="w-36">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Sell Price (₹) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.01" min="0" required value={newUnitSellPrice} onChange={(e) => setNewUnitSellPrice(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                            <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional note"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                        </div>
                        <button type="submit" disabled={saving}
                            className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-60">
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </button>
                    </form>
                </div>
            </div>

            {/* Cost Summary */}
            {bomItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Save className="w-4 h-4 mr-2 text-slate-400" /> Cost Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Material Cost</p>
                            <p className="text-2xl font-bold text-slate-800">₹{totalMaterialCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-slate-400 mt-1">Based on master selling prices</p>
                        </div>
                        <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1">BOM Sell Value</p>
                            <p className="text-2xl font-bold text-violet-700">₹{totalProjectValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-violet-400 mt-1">Sum of all line totals</p>
                        </div>
                        <div className={`rounded-lg p-4 border ${totalProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Estimated Profit</p>
                            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                ₹{Math.abs(totalProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-xs mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {totalMaterialCost > 0 ? `${Math.round((totalProfit / totalMaterialCost) * 100)}% margin` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BOM;
