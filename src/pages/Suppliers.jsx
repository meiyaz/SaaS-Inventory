import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Search, MapPin, Phone, Mail, FileText, Trash2, Edit } from 'lucide-react';
import SupplierModal from '../components/suppliers/SupplierModal';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const toast = useToast();
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching suppliers:', error);
            setSuppliers([]);
        } else {
            setSuppliers(data || []);
        }
        setLoading(false);
    };

    const handleCreateNew = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        setConfirm({
            message: 'Are you sure you want to delete this supplier? This may affect inventory records.',
            confirmLabel: 'Delete',
            danger: true,
            onConfirm: async () => {
                const { error } = await supabase.from('suppliers').delete().eq('id', id);
                if (!error) setSuppliers(suppliers.filter(s => s.id !== id));
                else toast('Failed to delete supplier.', 'error');
            },
        });
    };

    const handleModalClose = (refresh = false) => {
        setIsModalOpen(false);
        if (refresh) fetchSuppliers();
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.categories?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Supplier Directory</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage external vendors providing cameras, cabling, and hardware.</p>
                </div>

                <div className="flex w-full sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by company or category..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
                    </button>
                </div>
            </div>

            {/* Grid of Suppliers instead of a Table for better display of rich info */}
            <div className="p-6 bg-slate-50 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-48 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                        Loading vendor database...
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No suppliers found.</p>
                        <p className="text-sm mt-1 text-slate-400">Add your first product vendor to start tracking inventory purchases.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map((supplier) => (
                            <div key={supplier.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow relative group">
                                {/* Action Buttons (visible on hover) */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                    <button onClick={() => handleEdit(supplier)} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex items-start mb-4">
                                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl mr-4 shrink-0">
                                        {supplier.company_name.substring(0, 1)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{supplier.company_name}</h3>
                                        <p className="text-sm text-slate-500 block">{supplier.contact_person}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    {supplier.phone && (
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Phone className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                                            {supplier.phone}
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Mail className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                                            <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline truncate">{supplier.email}</a>
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-start text-sm text-slate-600 mt-2">
                                            <MapPin className="h-4 w-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">{supplier.address}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 w-full flex items-center">
                                            <FileText className="h-3 w-3 mr-1" /> GST NO
                                        </span>
                                        <span className="text-sm font-medium text-slate-700">
                                            {supplier.gst_number || 'Unregistered'}
                                        </span>
                                    </div>

                                    {supplier.categories && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {supplier.categories.split(',').map((cat, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {cat.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <SupplierModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    supplier={editingSupplier}
                />
            )}
            <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
        </div>
    );
};

export default Suppliers;
