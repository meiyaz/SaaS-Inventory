import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

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
            setIsFormOpen(false);
            fetchCategories();
        } catch (error) {
            console.error(error);
            alert('Failed to save category');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category? Products using this category might lose their reference.')) {
            await supabase.from('categories').delete().eq('id', id);
            fetchCategories();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <Tag className="w-5 h-5 mr-2 text-indigo-500" />
                        Product Categories
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Organize your master inventory (e.g. Cameras, NVRs, Cables)</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Category
                </button>
            </div>

            <div className="p-6">
                {isFormOpen && (
                    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h3 className="font-semibold text-slate-800 mb-4">{editingId ? 'Edit Category' : 'New Category'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. IP Cameras"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Optional details about this category"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Save</button>
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50">Cancel</button>
                        </div>
                    </form>
                )}

                {loading && !isFormOpen ? (
                    <div className="text-center py-8 text-slate-500">Loading categories...</div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                        <Tag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No categories found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{cat.name}</h4>
                                        {cat.description && <p className="text-sm text-slate-500 mt-1">{cat.description}</p>}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenForm(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;
