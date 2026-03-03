import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, Filter, AlertCircle, Upload, Download, Printer } from 'lucide-react';
import ProductModal from '../components/products/ProductModal';
import { downloadCsv } from '../utils/exportCsv';

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);

        // Fetch products with their category and supplier names via JOINs
        const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
            supabase
                .from('products')
                .select(`
          *,
          categories (name),
          suppliers (company_name)
        `)
                .order('name'),
            supabase.from('categories').select('id, name').order('name'),
            supabase.from('suppliers').select('id, company_name').order('company_name')
        ]);

        if (productsRes.error) {
            console.error("Products fetch error:", productsRes.error);
        } else {
            setProducts(productsRes.data || []);
        }

        if (!categoriesRes.error) setCategories(categoriesRes.data || []);
        if (!suppliersRes.error) setSuppliers(suppliersRes.data || []);

        setLoading(false);
    };

    const handleCreateNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this product? WARNING: If this item has existing stock logs, deletion will fail to protect data integrity.')) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (!error) {
                setProducts(products.filter(p => p.id !== id));
            } else {
                alert('Could not delete product. It may be referenced in stock logs or bills.');
            }
        }
    };

    const handleModalClose = (refresh = false) => {
        setIsModalOpen(false);
        if (refresh) fetchInitialData();
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory ? product.category_id === filterCategory : true;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-blue-500" />
                        Master Product Catalog
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Manage SKUs, base cost, and pricing models.</p>
                </div>

                <div className="flex w-full flex-wrap sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-56">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search SKU or name..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative flex-1 sm:w-48">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                            title="Category Filter"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        New Product
                    </button>
                    <button
                        onClick={() => navigate('/products/import')}
                        className="inline-flex items-center px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-100"
                        title="Bulk import products via CSV"
                    >
                        <Upload className="h-4 w-4 mr-1.5" /> Import CSV
                    </button>
                    <button
                        onClick={() => downloadCsv('products_catalog', [
                            { label: 'SKU', key: 'sku' },
                            { label: 'Name', key: 'name' },
                            { label: 'Brand', key: 'brand' },
                            { label: 'Category', key: 'category', format: (_, r) => r.categories?.name || '' },
                            { label: 'Base Price', key: 'base_price' },
                            { label: 'Selling Price', key: 'selling_price' },
                            { label: 'Stock', key: 'current_stock' },
                            { label: 'Min Alert', key: 'min_stock_alert' },
                            { label: 'Unit', key: 'unit' },
                        ], filteredProducts)}
                        className="inline-flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                        title="Export to CSV"
                    >
                        <Download className="h-4 w-4 mr-1.5" /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Info</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Classification</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Base Cost</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Selling Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Current Stock</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    <div className="inline-flex items-center">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mr-3"></div>
                                        Loading master catalog...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No products found in the database.</p>
                                    <p className="text-sm mt-1 text-slate-400">Add a new product to begin tracking its stock levels.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="font-bold text-slate-900 group">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded">{product.sku}</span>
                                                    {product.brand && <span>| {product.brand}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{product.categories?.name || <span className="text-slate-400 italic">Uncategorized</span>}</div>
                                        <div className="text-xs text-slate-500 mt-0.5 pr-4 truncate max-w-[150px]" title={product.suppliers?.company_name}>
                                            {product.suppliers?.company_name || 'No Preferred Vendor'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-medium text-slate-900">₹{product.base_price?.toFixed(2) || '0.00'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-medium text-green-700">₹{product.selling_price?.toFixed(2) || '0.00'}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {product.base_price && product.selling_price
                                                ? `${Math.round(((product.selling_price - product.base_price) / product.base_price) * 100)}% Margin`
                                                : ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${product.current_stock <= (product.min_stock_alert || 0)
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                            {product.current_stock || 0} {product.unit || 'Units'}
                                        </span>
                                        {product.current_stock <= (product.min_stock_alert || 0) && product.current_stock > 0 && (
                                            <div className="text-[10px] text-red-500 mt-1 uppercase font-bold tracking-wider flex items-center justify-center">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Low Stock
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => handleEdit(product)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ProductModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    product={editingProduct}
                    categories={categories}
                    suppliers={suppliers}
                />
            )}
        </div>
    );
};

export default Products;
