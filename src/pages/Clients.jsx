import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ChevronRight } from 'lucide-react';
import ClientModal from '../components/clients/ClientModal';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const Clients = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const toast = useToast();
    const [confirm, setConfirm] = useState(null);

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching clients:', error);
        setClients(data || []);
        setLoading(false);
    };

    const handleEdit = (e, client) => {
        e.stopPropagation();
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        setConfirm({
            message: 'Are you sure you want to delete this client?',
            confirmLabel: 'Delete',
            danger: true,
            onConfirm: async () => {
                const { error } = await supabase.from('clients').delete().eq('id', id);
                if (!error) setClients(clients.filter(c => c.id !== id));
                else toast('Failed to delete client.', 'error');
            },
        });
    };

    const handleModalClose = (refresh = false) => {
        setIsModalOpen(false);
        if (refresh) fetchClients();
    };

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Client Management</h2>
                    <p className="text-sm text-slate-500 mt-1">Click a row to view full activity history.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 rounded-lg text-sm font-medium text-white hover:bg-amber-600"
                    >
                        <Plus className="h-4 w-4 mr-2" /> New Client
                    </button>
                </div>
            </div>

            {/* Client List */}
            <div className="flex-1">
                {loading ? (
                    <div className="px-6 py-12 text-center text-slate-500">
                        <div className="inline-flex items-center">
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-amber-500 animate-spin mr-3"></div>
                            Loading clients...
                        </div>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500"><p>No clients found.</p></div>
                ) : (
                    <>
                        {/* Mobile cards (< lg) */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {filteredClients.map(client => (
                                <div key={client.id}
                                    onClick={() => navigate(`/clients/${client.id}`)}
                                    className="p-4 hover:bg-amber-50 transition-colors cursor-pointer">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{client.company_name || client.name}</p>
                                            {client.company_name && <p className="text-xs text-slate-500 truncate">{client.name}</p>}
                                            <p className="text-xs text-slate-500 mt-0.5">{client.phone} {client.email && `· ${client.email}`}</p>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            <button onClick={(e) => handleEdit(e, client)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                            <button onClick={(e) => handleDelete(e, client.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            <ChevronRight className="h-4 w-4 text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table (≥ lg) */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Info</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GST No.</th>
                                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredClients.map(client => (
                                        <tr key={client.id}
                                            onClick={() => navigate(`/clients/${client.id}`)}
                                            className="hover:bg-amber-50 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-900">{client.company_name || client.name}</div>
                                                {client.company_name && <div className="text-xs text-slate-500">{client.name}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900">{client.phone}</div>
                                                <div className="text-sm text-slate-500">{client.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900 truncate max-w-[180px]">{client.address}</div>
                                                {client.location_url && (
                                                    <a href={client.location_url} target="_blank" rel="noopener noreferrer"
                                                        onClick={e => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-0.5">
                                                        📍 View on Map
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                                    {client.gst_number || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button onClick={(e) => handleEdit(e, client)} className="text-slate-400 hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                                    <button onClick={(e) => handleDelete(e, client.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {isModalOpen && (
                <ClientModal isOpen={isModalOpen} onClose={handleModalClose} client={editingClient} />
            )}
            <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
        </div>
    );
};

export default Clients;
