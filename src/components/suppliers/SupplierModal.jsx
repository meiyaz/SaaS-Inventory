import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { X, Building2 } from 'lucide-react';

const SupplierModal = ({ isOpen, onClose, supplier }) => {
    const isEditing = !!supplier;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        gst_number: '',
        categories: '',
        payment_terms: '',
        notes: ''
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                id: supplier.id,
                company_name: supplier.company_name || '',
                contact_person: supplier.contact_person || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                gst_number: supplier.gst_number || '',
                categories: supplier.categories || '',
                payment_terms: supplier.payment_terms || '',
                notes: supplier.notes || ''
            });
        } else {
            setFormData({
                company_name: '', contact_person: '', email: '', phone: '', address: '', gst_number: '', categories: '', payment_terms: '', notes: ''
            });
        }
    }, [supplier]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Reverted to setLoading as setSaving is not defined
        setError('');

        try {
            const dataToSave = { ...formData };
            let resultError;

            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('suppliers')
                    .update(dataToSave)
                    .eq('id', supplier.id);
                resultError = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('suppliers')
                    .insert([dataToSave]);
                resultError = insertError;
            }

            if (resultError) throw resultError;

            onClose(true); // Close and refresh
        } catch (err) {
            console.error(err);
            setError('Failed to save supplier. Does the "suppliers" table exist in Supabase? (' + err.message + ')');
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
                                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                    <Building2 className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl leading-6 font-bold text-slate-900">
                                    {isEditing ? 'Edit Supplier Profile' : 'Onboard New Supplier'}
                                </h3>
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

                    <div className="bg-white px-6 py-6">
                        <form id="supplierForm" onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="company_name" required value={formData.company_name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Hikvision Distributors Ltd" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Contact Person</label>
                                    <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Jane Doe" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="sales@vendor.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categories Provided</label>
                                    <input type="text" name="categories" value={formData.categories} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400" placeholder="Cameras, Cables, NVR (Comma separated)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">GST Number</label>
                                    <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase placeholder-slate-400" placeholder="22AAAAA0000A1Z5" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Address</label>
                                <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Warehouse exactly location..."></textarea>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Terms</label>
                                    <input type="text" name="payment_terms" value={formData.payment_terms} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Net 30, Advance, Cash" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Internal Notes</label>
                                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Pricing discounts, delivery speed, etc." />
                                </div>
                            </div>

                        </form>
                    </div>
                    <div className="bg-slate-50 px-6 py-4 flex flex-row-reverse rounded-b-xl border-t border-slate-200">
                        <button
                            type="submit"
                            form="supplierForm"
                            disabled={loading}
                            className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Saving to Database...' : (isEditing ? 'Save Details' : 'Register Supplier')}
                        </button>
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-5 py-2.5 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:ml-3 sm:w-auto"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierModal;
