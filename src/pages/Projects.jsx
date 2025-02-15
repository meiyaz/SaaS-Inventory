import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Search, ChevronRight, Building2, Calendar, User, ClipboardList } from 'lucide-react';
import ProjectModal from '../components/projects/ProjectModal';

const STATUS_PIPELINE = [
    { key: 'LEAD', label: 'Lead', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { key: 'SURVEY', label: 'Survey', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { key: 'QUOTED', label: 'Quoted', color: 'bg-violet-100 text-violet-700 border-violet-200' },
    { key: 'WON', label: 'Won / Active', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { key: 'INSTALLING', label: 'Installing', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { key: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { key: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' },
];

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select(`*, clients(name, company_name)`)
            .order('created_at', { ascending: false });
        if (!error) setProjects(data || []);
        setLoading(false);
    };

    const handleEdit = (project) => { setEditingProject(project); setIsModalOpen(true); };
    const handleNew = () => { setEditingProject(null); setIsModalOpen(true); };

    const filtered = projects.filter(p => {
        const matchSearch =
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.clients?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <FolderKanban className="w-6 h-6 mr-2 text-violet-500" />
                        Projects
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Full lifecycle tracking from Lead to Completion.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4 mr-1.5" /> New Project
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title, code, or client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setStatusFilter('ALL')} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${statusFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>All</button>
                    {STATUS_PIPELINE.map(s => (
                        <button key={s.key} onClick={() => setStatusFilter(s.key)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${statusFilter === s.key ? s.color + ' !border-current' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="text-center py-16 text-slate-500">Loading projects...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
                    <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No projects found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((proj) => {
                        const statusMeta = STATUS_PIPELINE.find(s => s.key === proj.status) || STATUS_PIPELINE[0];
                        return (
                            <div key={proj.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-violet-300 hover:shadow-md transition-all flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.color}`}>
                                        {statusMeta.label}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">{proj.project_code}</span>
                                </div>
                                <h3
                                    onClick={() => handleEdit(proj)}
                                    className="font-bold text-slate-900 hover:text-violet-700 cursor-pointer transition-colors leading-tight mb-2"
                                >
                                    {proj.title}
                                </h3>
                                <div className="space-y-1.5 mt-1 flex-1">
                                    {proj.clients && (
                                        <div className="flex items-center text-xs text-slate-600">
                                            <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                                            {proj.clients.company_name || proj.clients.name}
                                        </div>
                                    )}
                                    <div className="flex items-center text-xs text-slate-500">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                                        {formatDate(proj.start_date)}
                                        {proj.end_date && <> <ChevronRight className="w-3 h-3 mx-0.5 text-slate-300" /> {formatDate(proj.end_date)}</>}
                                    </div>
                                    {proj.project_manager && (
                                        <div className="flex items-center text-xs text-slate-500">
                                            <User className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                                            {proj.project_manager}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                    {proj.contract_value
                                        ? <span className="text-sm font-bold text-slate-800">₹{Number(proj.contract_value).toLocaleString('en-IN')}</span>
                                        : <span className="text-xs text-slate-400 italic">No contract value</span>
                                    }
                                    <button
                                        onClick={() => navigate(`/projects/${proj.id}/bom`)}
                                        className="inline-flex items-center text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-md transition-colors"
                                    >
                                        <ClipboardList className="w-3.5 h-3.5 mr-1" /> View BOM
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && (
                <ProjectModal
                    isOpen={isModalOpen}
                    onClose={(refresh) => { setIsModalOpen(false); if (refresh) fetchProjects(); }}
                    project={editingProject}
                />
            )}
        </div>
    );
};

export default Projects;
