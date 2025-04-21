import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowUpRight, Search, AlertTriangle, CheckCircle2, PackageMinus } from 'lucide-react';

const StockOut = () => {
    const [products, setProducts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Form State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [referenceNo, setReferenceNo] = useState(''); // E.g., Project ID or Invoice Number
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        // In the future, we will fetch active Projects here for the Reference field dropdown
        // For now, we'll just fetch products that actually have stock > 0
        const { data } = await supabase
            .from('products')
            .select('id, name, sku, current_stock, selling_price')
            .gt('current_stock', 0) // Only show items that are in stock!
            .order('name');

        setProducts(data || []);
        setLoading(false);
    };

    const handleProductSelect = (e) => {
        setSelectedProduct(e.target.value);
        setErrorMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct || !quantity || quantity <= 0) return;

        setSubmitting(true);
        setErrorMsg('');
        setSuccessMsg('');

        const qtyInt = parseInt(quantity);
        const prod = products.find(p => p.id === selectedProduct);

        // Hard safeguard against Negative Stock
        if (qtyInt > prod.current_stock) {
            setErrorMsg(`Allocation Failed: You are trying to dispatch ${qtyInt}, but only ${prod.current_stock} are available in the warehouse.`);
            setSubmitting(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error: txError } = await supabase.from('stock_transactions').insert([{
                product_id: selectedProduct,
                transaction_type: 'OUT',
                quantity: qtyInt,
                unit_cost: prod.selling_price || 0,
                reference_no: referenceNo || null,
                notes: notes || null,
                user_email: user?.email || 'unknown'
            }]);
            if (txError) throw txError;

            const newStock = prod.current_stock - qtyInt;
            const { error: prodError } = await supabase.from('products')
                .update({ current_stock: newStock })
                .eq('id', selectedProduct);
            if (prodError) throw prodError;

            setSuccessMsg(`Successfully dispatched ${qtyInt} units.`);
            setSelectedProduct('');
            setQuantity('');
            setReferenceNo('');
            setNotes('');

            fetchInitialData();

            setTimeout(() => setSuccessMsg(''), 5000);

        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to process stock outward entry. Check your database connection.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProductDetails = products.find(p => p.id === selectedProduct);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <ArrowUpRight className="w-6 h-6 mr-2 text-rose-600" />
                        Stock Dispatch (Outward)
                    </h2>
                    <p className="text-slate-500 mt-1">Allocate inventory to a Project, Client, or Direct Sale.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center">
                    <PackageMinus className="w-5 h-5 text-rose-600 mr-2" />
                    <h3 className="font-semibold text-rose-900">Dispatch Details</h3>
                </div>

                <div className="p-6">
                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                            {successMsg}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg flex items-start">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{errorMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select In-Stock Item <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <select
                                        required
                                        value={selectedProduct}
                                        onChange={handleProductSelect}
                                        className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white"
                                    >
                                        <option value="">-- Find Available Inventory --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                [{p.current_stock} available] {p.sku} - {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-slate-500 mt-1.5 ml-1">Items with zero stock are hidden from this dropdown to prevent negative allocation.</p>
                            </div>

                            {selectedProductDetails && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`flex items-center justify-center h-10 w-10 rounded-full mr-4 ${selectedProductDetails.current_stock > 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                            <PackageMinus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{selectedProductDetails.name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {selectedProductDetails.sku}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Current Stock</div>
                                        <div className="text-lg font-bold text-slate-800">{selectedProductDetails.current_stock}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dispatch Quantity <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedProductDetails ? selectedProductDetails.current_stock : ""}
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                    placeholder="How many units leaving?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project / Invoice Reference</label>
                                <input
                                    type="text"
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 uppercase"
                                    placeholder="e.g. PRJ-TATA-01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dispatch Notes (Optional)</label>
                            <textarea
                                rows="2"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                                placeholder="Technician hand-over, courier details, or reason for dispatch..."
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || !selectedProduct}
                                className={`inline-flex items-center justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${submitting || !selectedProduct ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <ArrowUpRight className="w-5 h-5 mr-2" />
                                {submitting ? 'Allocating...' : 'Confirm Dispatch'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockOut;
