import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { X, FolderPlus, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = [
    'LEAD', 'SURVEY', 'QUOTED', 'WON', 'INSTALLING', 'COMPLETED', 'LOST'
];

const ProjectModal = ({ isOpen, onClose, project }) => {
    const isEditing = !!project;
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '', project_code: '', client_id: '', status: 'LEAD',
        project_manager: '', start_date: '', end_date: '',
        contract_value: '', site_address: '', scope_notes: ''
    });

    useEffect(() => {
        supabase.from('clients').select('id, name, company_name').order('name').then(({ data }) => setClients(data || []));
        if (project) {
            setForm({
                title: project.title || '',
                project_code: project.project_code || '',
                client_id: project.client_id || '',
                status: project.status || 'LEAD',
                project_manager: project.project_manager || '',
                start_date: project.start_date?.split('T')[0] || '',
                end_date: project.end_date?.split('T')[0] || '',
                contract_value: project.contract_value || '',
                site_address: project.site_address || '',
                scope_notes: project.scope_notes || '',
            });
        }
    }, [project]);

    if (!isOpen) return null;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...form,
            client_id: form.client_id || null,
            contract_value: form.contract_value ? parseFloat(form.contract_value) : null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
        };

        try {
            if (isEditing) {
                const { error: e } = await supabase.from('projects').update(payload).eq('id', project.id);
                if (e) throw e;
            } else {
                const { error: e } = await supabase.from('projects').insert([payload]);
                if (e) throw e;
            }
            onClose(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Permanently delete this project? All BOM and linked data will also be removed.')) return;
        await supabase.from('projects').delete().eq('id', project.id);
        onClose(true);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => onClose(false)} />
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full relative z-10">
                    {/* Title bar */}
                    <div className="bg-slate-50 px-6 pt-5 pb-4 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-violet-100 p-2 rounded-lg"><FolderPlus className="h-5 w-5 text-violet-600" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Project' : 'New Project'}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Fill in the project brief and lifecycle details</p>
                            </div>
                        </div>
                        <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full border border-slate-200 bg-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form id="projForm" onSubmit={handleSubmit}>
                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}

                            {/* Title + Code */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Title <span className="text-red-500">*</span></label>
                                    <input name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Tata Motors – CCTV Surveillance" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Code</label>
                                    <input name="project_code" value={form.project_code} onChange={handleChange} placeholder="PRJ-001" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 uppercase" />
                                </div>
                            </div>

                            {/* Client + Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                                    <select name="client_id" value={form.client_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 bg-white">
                                        <option value="">-- Select Client --</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pipeline Status <span className="text-red-500">*</span></label>
                                    <select name="status" required value={form.status} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 bg-white">
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Project Manager + Contract Value */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Manager</label>
                                    <input name="project_manager" value={form.project_manager} onChange={handleChange} placeholder="Technician / PM name" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contract Value (₹)</label>
                                    <input type="number" step="0.01" name="contract_value" value={form.contract_value} onChange={handleChange} placeholder="0.00" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date</label>
                                    <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Estimated Completion</label>
                                    <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                                </div>
                            </div>

                            {/* Site Address */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Site / Installation Address</label>
                                <input name="site_address" value={form.site_address} onChange={handleChange} placeholder="Full installation site address" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500" />
                            </div>

                            {/* Scope */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Scope & Notes</label>
                                <textarea name="scope_notes" rows="3" value={form.scope_notes} onChange={handleChange} placeholder="Summary of requirements, number of cameras, NVR setup, cabling length, etc." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none" />
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center rounded-b-xl">
                        <div>
                            {isEditing && (
                                <button type="button" onClick={handleDelete} className="inline-flex items-center text-sm text-red-600 hover:text-red-800 font-medium">
                                    <Trash2 className="w-4 h-4 mr-1" /> Delete Project
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => onClose(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
                            <button type="submit" form="projForm" disabled={loading} className={`px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
