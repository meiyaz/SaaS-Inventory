import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Plus, Edit, Trash2, Tag, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';

const CategoryModal = ({ isOpen, onClose }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const toast = useToast();
    const [confirm, setConfirm] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (isOpen) fetchCategories();
    }, [isOpen]);

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (!error && data) {
            setCategories(data);
        }
        setLoading(false);
    };

    const handleOpenForm = (category = null) => {
        if (category) {
            setEditingId(category.id);
            setFormData({ name: category.name, description: category.description || '' });
        } else {
            setEditingId(null);
            setFormData({ name: '', description: '' });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                await supabase.from('categories').update(formData).eq('id', editingId);
            } else {
                await supabase.from('categories').insert([formData]);
            }
            setHasChanges(true);
            setIsFormOpen(false);
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast('Failed to save category', 'error');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setConfirm({
            message: 'Delete this category? Products using this category might lose their reference.',
            confirmLabel: 'Delete',
            danger: true,
            onConfirm: async () => {
                await supabase.from('categories').delete().eq('id', id);
                setHasChanges(true);
                fetchCategories();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-indigo-500" />
                            Manage Categories
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleOpenForm()}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-semibold transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </button>
                        <button onClick={() => onClose(hasChanges)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {isFormOpen && (
                        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white border border-slate-200 shadow-sm rounded-lg">
                            <h3 className="font-semibold text-slate-800 mb-3">{editingId ? 'Edit Category' : 'New Category'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Cables"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        placeholder="Optional details"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={loading} className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">{loading ? 'Saving...' : 'Save Category'}</button>
                            </div>
                        </form>
                    )}

                    {loading && !isFormOpen ? (
                        <div className="text-center py-8 text-slate-500">Loading categories...</div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 bg-white rounded-lg">
                            <Tag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No categories found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-300 transition-colors flex justify-between items-center group">
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{cat.name}</h4>
                                        {cat.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{cat.description}</p>}
                                    </div>
                                    <div className="flex gap-1 shrink-0 ml-2">
                                        <button onClick={() => handleOpenForm(cat)} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
            </div>
        </div>
    );
};

export default CategoryModal;
