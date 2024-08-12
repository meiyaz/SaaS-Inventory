import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { X, PackagePlus } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, product, categories, suppliers }) => {
    const isEditing = !!product;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        brand: '',
        category_id: '',
        supplier_id: '',
        description: '',
        base_price: '',
        selling_price: '',
        tax_rate: '18', // Default GST 18% for CCTV in India
        unit: 'Pieces',
        min_stock_alert: '5'
    });

    useEffect(() => {
        if (product) {
            setFormData({
                sku: product.sku || '',
                name: product.name || '',
                brand: product.brand || '',
                category_id: product.category_id || '',
                supplier_id: product.supplier_id || '',
                description: product.description || '',
                base_price: product.base_price || '',
                selling_price: product.selling_price || '',
                tax_rate: product.tax_rate || '18',
                unit: product.unit || 'Pieces',
                min_stock_alert: product.min_stock_alert || '5'
            });
        } else {
            setFormData({
                sku: '', name: '', brand: '', category_id: '', supplier_id: '', description: '', base_price: '', selling_price: '', tax_rate: '18', unit: 'Pieces', min_stock_alert: '5'
            });
        }
    }, [product]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Ensure numeric fields are actually numbers or null before inserting to PG
            const dataToSave = {
                ...formData,
                category_id: formData.category_id || null,
                supplier_id: formData.supplier_id || null,
                base_price: formData.base_price ? parseFloat(formData.base_price) : 0,
                selling_price: formData.selling_price ? parseFloat(formData.selling_price) : 0,
                tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : 0,
                min_stock_alert: formData.min_stock_alert ? parseInt(formData.min_stock_alert) : 0,
            };

            let resultError;

            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(dataToSave)
                    .eq('id', product.id);
                resultError = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([dataToSave]);
                resultError = insertError;
            }

            if (resultError) throw resultError;

            onClose(true); // Close and refresh
        } catch (err) {
            console.error(err);
            setError('Failed to save product. Does the "products" table exist with all listed columns? (' + err.message + ')');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-slate-900 opacity-75 backdrop-blur-sm"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
                    <div className="bg-slate-50 px-6 pt-5 pb-4 border-b border-slate-200">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                    <PackagePlus className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl leading-6 font-bold text-slate-900">
                                        {isEditing ? 'Edit Product Configuration' : 'Add Master Product'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">Define SKU, classifications, and standard pricing</p>
                                </div>
                            </div>
                            <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {error && (
                            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="bg-white px-6 py-6 pb-8">
                        <form id="productForm" onSubmit={handleSubmit} className="space-y-6">

                            {/* Identity Section */}
                            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Item Identity</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="2MP Bullet Camera" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">SKU / Item Code <span className="text-red-500">*</span></label>
                                        <input type="text" name="sku" required value={formData.sku} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase" placeholder="HIK-2MP-BUL" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Brand / Make</label>
                                        <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Hikvision" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Description</label>
                                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="1080p, IR 30m, IP67 Outdoor..." />
                                    </div>
                                </div>
                            </div>

                            {/* Classification Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                                    <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                                        <option value="">-- Select Category --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Supplier</label>
                                    <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                                        <option value="">-- Vendor (Optional) --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Pricing & Units */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-slate-100 pt-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Unit Type</label>
                                    <select name="unit" value={formData.unit} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                                        <option value="Pieces">Pieces</option>
                                        <option value="Meters">Meters (for Cable)</option>
                                        <option value="Boxes">Boxes</option>
                                        <option value="Labor">Labor/Service</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Base Buy Cost</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-slate-500 sm:text-sm">₹</span></div>
                                        <input type="number" step="0.01" name="base_price" required value={formData.base_price} onChange={handleChange} className="w-full pl-7 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Standard Selling Price</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-slate-500 sm:text-sm">₹</span></div>
                                        <input type="number" step="0.01" name="selling_price" required value={formData.selling_price} onChange={handleChange} className="w-full pl-7 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">GST / Tax Rate (%)</label>
                                    <input type="number" step="0.1" name="tax_rate" value={formData.tax_rate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="18" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Low Stock Alert Threshold</label>
                                    <input type="number" name="min_stock_alert" value={formData.min_stock_alert} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="5" />
                                </div>
                            </div>

                        </form>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center rounded-b-xl border-t border-slate-200">
                        <div className="text-xs text-slate-400">
                            Stock quantity is managed via Stock In/Out module.
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => onClose(false)}
                                className="w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-5 py-2.5 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="productForm"
                                disabled={loading}
                                className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Saving...' : (isEditing ? 'Save Product' : 'Create Product')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
