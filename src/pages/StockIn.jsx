import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowDownToLine, Package, Filter, Save, Search } from 'lucide-react';

const StockIn = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('products')
            .select('id, name, sku, base_price, current_stock')
            .order('name');
        setProducts(data || []);
        setLoading(false);
    };

    // Auto-fill the unit cost based on the master product's base buy price when a product is selected
    const handleProductSelect = (e) => {
        const prodId = e.target.value;
        setSelectedProduct(prodId);

        if (prodId) {
            const prod = products.find(p => p.id === prodId);
            if (prod && prod.base_price) {
                setUnitCost(prod.base_price.toString());
            }
        } else {
            setUnitCost('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct || !quantity || quantity <= 0) return;

        setSubmitting(true);
        setSuccessMsg('');

        try {
            // 1. Get the current user email to log who did this
            const { data: { user } } = await supabase.auth.getUser();

            // 2. Insert into the transactions log
            const qtyInt = parseInt(quantity);
            const { error: logError } = await supabase
                .from('stock_transactions')
                .insert([{
                    product_id: selectedProduct,
                    transaction_type: 'IN',
                    quantity: qtyInt,
                    reference_no: referenceNo || null,
                    unit_cost: parseFloat(unitCost) || 0,
                    notes: notes,
                    user_email: user?.email || 'Unknown'
                }]);

            if (logError) throw logError;

            // 3. Update the master product's current_stock total
            const prod = products.find(p => p.id === selectedProduct);
            const newTotal = (prod.current_stock || 0) + qtyInt;

            const { error: updateError } = await supabase
                .from('products')
                .update({ current_stock: newTotal })
                .eq('id', selectedProduct);

            if (updateError) throw updateError;

            // 4. Success Reset
            setSuccessMsg(`Successfully added ${qtyInt} units to inventory!`);
            setSelectedProduct('');
            setQuantity('');
            setUnitCost('');
            setReferenceNo('');
            setNotes('');
            fetchProducts(); // Refresh stock counts

            setTimeout(() => setSuccessMsg(''), 4000);

        } catch (err) {
            console.error(err);
            alert('Failed to process inward stock entry. Run init_schema SQL.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProductDetails = products.find(p => p.id === selectedProduct);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <ArrowDownToLine className="w-6 h-6 mr-2 text-emerald-600" />
                    Stock Inward Entry
                </h2>
                <p className="text-slate-500 mt-1">Log new inventory received from suppliers or inward purchases.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Purchase Details</h3>
                </div>

                <div className="p-6">
                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Find Product */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Product <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <select
                                        required
                                        value={selectedProduct}
                                        onChange={handleProductSelect}
                                        className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="">-- Search & Select an Item --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.sku} - {p.name} (Current: {p.current_stock || 0})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedProductDetails && (
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Package className="w-5 h-5 text-blue-500 mr-3" />
                                        <div>
                                            <div className="text-sm font-semibold text-blue-900">{selectedProductDetails.name}</div>
                                            <div className="text-xs text-blue-700">Currently in warehouse: {selectedProductDetails.current_stock || 0}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity Received <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    placeholder="e.g. 50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Purchase Unit Cost</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-slate-500 sm:text-sm">₹</span></div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={unitCost}
                                        onChange={(e) => setUnitCost(e.target.value)}
                                        className="w-full pl-7 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Updates the log, does not change Master price.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Invoice / PO Number</label>
                                <input
                                    type="text"
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
                                    placeholder="INV-2024-..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Movement Notes</label>
                            <textarea
                                rows="2"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                                placeholder="Optional supplier notes, condition upon arrival, etc."
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || !selectedProduct}
                                className={`inline-flex items-center justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${submitting || !selectedProduct ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {submitting ? 'Logging Transaction...' : 'Confirm Stock Inward'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockIn;
