import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { X } from 'lucide-react';

const ClientModal = ({ isOpen, onClose, client }) => {
    const isEditing = !!client;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        gst_number: '',
        notes: ''
    });

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                company_name: client.company_name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                gst_number: client.gst_number || '',
                notes: client.notes || ''
            });
        } else {
            setFormData({
                name: '', company_name: '', email: '', phone: '', address: '', gst_number: '', notes: ''
            });
        }
    }, [client]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create copy of data to save
            const dataToSave = { ...formData };

            let resultError;

            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('clients')
                    .update(dataToSave)
                    .eq('id', client.id);
                resultError = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('clients')
                    .insert([dataToSave]);
                resultError = insertError;
            }

            if (resultError) throw resultError;

            onClose(true); // Close and refresh
        } catch (err) {
            console.error(err);
            setError('Failed to save client. Does the table exist in Supabase? (' + err.message + ')');
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

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-100">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl leading-6 font-bold text-slate-900">
                                {isEditing ? 'Edit Client' : 'Add New Client'}
                            </h3>
                            <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        <form id="clientForm" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Acme Corp" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                                <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase" placeholder="22AAAAA0000A1Z5" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Site Address</label>
                                <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" placeholder="123 Main St, City, State ZIP"></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                                <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Preferred equipment, specific requirements, etc."></textarea>
                            </div>
                        </form>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-slate-100">
                        <button
                            type="submit"
                            form="clientForm"
                            disabled={loading}
                            className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Client')}
                        </button>
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientModal;
