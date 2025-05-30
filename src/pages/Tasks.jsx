import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Plus, MessageSquare, Save, X, IndianRupee, FileText, Briefcase, ShieldCheck } from 'lucide-react';
import Select from '../components/ui/Select';
import { useToast } from '../context/ToastContext';

// ── Priority config ──────────────────────────────────────────────────────────
const PRIORITY = {
    HIGH: { cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
    MEDIUM: { cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    LOW: { cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

// ── Task type badge ──────────────────────────────────────────────────────────
const getTaskType = (task) => {
    if (task.amc_id) return { label: 'AMC', cls: 'bg-violet-100 text-violet-700 border-violet-200', Icon: ShieldCheck };
    if (task.project_id) return { label: 'PROJECT', cls: 'bg-blue-100 text-blue-700 border-blue-200', Icon: Briefcase };
    return { label: 'REGULAR', cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: CheckSquare };
};

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} `;

const Tasks = () => {
    const { user, role, orgId } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [amcs, setAmcs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showNewTask, setShowNewTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', priority: 'MEDIUM', due_date: '', project_id: '', amc_id: '', billable: false, billing_amount: '' });

    const [commentText, setCommentText] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskFilter, setTaskFilter] = useState('ACTIVE');
    const [generating, setGenerating] = useState(false);
    const toast = useToast();

    const isManager = role === 'ADMIN' || role === 'MANAGER';

    useEffect(() => { if (orgId) fetchData(); }, [orgId, role]);

    const fetchData = async () => {
        setLoading(true);
        const promises = [
            supabase.from('tasks')
                .select('*, assignee:users!tasks_assigned_to_fkey(email, raw_user_meta_data), creator:users!tasks_created_by_fkey(email, raw_user_meta_data), project:projects(title, client_id, clients(name, company_name)), amc:amc_contracts(contract_number, client_id, clients(name, company_name))')
                .order('created_at', { ascending: false }),
        ];

        if (isManager) {
            promises.push(
                supabase.from('organization_members').select('user_id, role, users(email, raw_user_meta_data)').eq('organization_id', orgId),
                supabase.from('projects').select('id, title, client_id').eq('organization_id', orgId),
                supabase.from('amc_contracts').select('id, contract_number, client_id').eq('organization_id', orgId).eq('status', 'ACTIVE'),
            );
        }

        const [taskRes, userRes, projRes, amcRes] = await Promise.all(promises);

        let q = taskRes.data || [];
        if (!isManager && user) q = q.filter(t => t.assigned_to === user.id);

        setTasks(q);
        if (isManager) {
            setUsers(userRes?.data || []);
            setProjects(projRes?.data || []);
            setAmcs(amcRes?.data || []);
        }
        setLoading(false);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        const payload = {
            organization_id: orgId,
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            due_date: newTask.due_date || null,
            assigned_to: newTask.assigned_to || null,
            created_by: user.id,
            project_id: newTask.project_id || null,
            amc_id: newTask.amc_id || null,
            billable: newTask.billable,
            billing_amount: newTask.billable ? (parseFloat(newTask.billing_amount) || 0) : 0,
        };
        await supabase.from('tasks').insert([payload]);
        setShowNewTask(false);
        setNewTask({ title: '', description: '', assigned_to: '', priority: 'MEDIUM', due_date: '', project_id: '', amc_id: '', billable: false, billing_amount: '' });
        fetchData();
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (selectedTask?.id === taskId) setSelectedTask(prev => ({ ...prev, status: newStatus }));
    };

    const handleAssigneeUpdate = async (taskId, newAssigneeId) => {
        const assignedUser = users.find(u => u.user_id === newAssigneeId);
        await supabase.from('tasks').update({ assigned_to: newAssigneeId || null }).eq('id', taskId);
        const newAssignee = assignedUser ? { email: assignedUser.users?.email, raw_user_meta_data: assignedUser.users?.raw_user_meta_data } : null;
        setTasks(tasks.map(t => t.id === taskId ? { ...t, assigned_to: newAssigneeId || null, assignee: newAssignee } : t));
        setSelectedTask(prev => ({ ...prev, assigned_to: newAssigneeId || null, assignee: newAssignee }));
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        const newComment = { id: Date.now(), text: commentText, author: user.email, timestamp: new Date().toISOString() };
        const current = Array.isArray(selectedTask.comments) ? selectedTask.comments : [];
        const updated = [...current, newComment];
        await supabase.from('tasks').update({ comments: updated }).eq('id', selectedTask.id);
        setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, comments: updated } : t));
        setSelectedTask(prev => ({ ...prev, comments: updated }));
        setCommentText('');
    };

    // Generate invoice for a completed billable task
    const handleGenerateInvoice = async () => {
        setGenerating(true);
        const task = selectedTask;
        // Derive client from project → amc → fallback null
        const client = task.project?.clients || task.amc?.clients;
        const clientId = task.project?.client_id || task.amc?.client_id;

        if (!clientId) {
            toast('This task has no linked project or AMC to identify the client. Please link a project or AMC first.', 'warning');
            setGenerating(false);
            return;
        }

        const invNumber = `INV-TASK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${task.id.slice(0, 6).toUpperCase()}`;
        const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 15);

        const { data: inv, error: invErr } = await supabase
            .from('invoices')
            .insert([{
                organization_id: orgId,
                invoice_number: invNumber,
                client_id: clientId,
                reference_type: 'TASK',
                reference_id: task.id,
                status: 'DRAFT',
                grand_total: task.billing_amount,
                subtotal: task.billing_amount,
                due_date: dueDate.toISOString().split('T')[0],
                notes: `Task: ${task.title} `,
            }])
            .select()
            .single();

        if (!invErr && inv) {
            await supabase.from('invoice_line_items').insert([{
                organization_id: orgId,
                invoice_id: inv.id,
                description: task.title,
                quantity: 1,
                unit_price: task.billing_amount,
                total_price: task.billing_amount,
            }]);
        }

        setGenerating(false);
        setSelectedTask(null);
        navigate('/invoices');
    };

    const getDisplayName = (uObj) => {
        if (!uObj) return 'Unassigned';
        const name = uObj.raw_user_meta_data?.full_name || uObj.raw_user_meta_data?.name;
        return name || uObj.email?.split('@')[0] || 'Unknown';
    };

    const filtered = tasks.filter(t => taskFilter === 'ACTIVE' ? t.status !== 'COMPLETED' : t.status === 'COMPLETED');

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Tasks...</div>;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <CheckSquare className="w-6 h-6 mr-2 text-blue-600" /> Task Management
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{isManager ? 'Assign and track operational duties.' : 'View and update your assigned tasks.'}</p>
                </div>
                {isManager && (
                    <button onClick={() => setShowNewTask(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                        <Plus className="w-4 h-4 mr-1.5" /> Assign Task
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="bg-slate-200 p-1 rounded-lg flex gap-1 shadow-inner self-start">
                <button onClick={() => setTaskFilter('ACTIVE')} className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${taskFilter === 'ACTIVE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-300/50'}`}>Active</button>
                <button onClick={() => setTaskFilter('COMPLETED')} className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${taskFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-300/50'}`}>Completed</button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Mobile View (< lg) */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {filtered.length === 0 && (
                        <div className="py-12 text-center px-4">
                            <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 font-medium">No {taskFilter.toLowerCase()} tasks found.</p>
                        </div>
                    )}
                    {filtered.map(task => {
                        const pMeta = PRIORITY[task.priority] || PRIORITY.MEDIUM;
                        const tMeta = getTaskType(task);
                        const TypeIcon = tMeta.Icon;
                        return (
                            <div key={task.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-3">
                                        <p className="font-bold text-slate-800 text-sm leading-tight flex-1">{task.title}</p>
                                        <button onClick={() => { setSelectedTask(task); setCommentText(''); }} className="shrink-0 text-indigo-600 text-[11px] font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                                            Manage
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${pMeta.cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dot}`}></span>{task.priority}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                task.status === 'BLOCKED' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>{task.status === 'IN_PROGRESS' ? 'WORKING' : task.status}</span>
                                        {task.billable && (
                                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                <IndianRupee className="w-2.5 h-2.5" />{Number(task.billing_amount).toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-md p-2 border border-slate-100">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <TypeIcon className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{tMeta.label}</span>
                                            {task.due_date && <span>| Due: {task.due_date}</span>}
                                        </div>
                                        {isManager && (
                                            <span className="font-semibold text-slate-700 truncate ml-2 max-w-[120px]" title={getDisplayName(task.assignee)}>{getDisplayName(task.assignee)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop View (≥ lg) */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider">Task</th>
                                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-center">Priority</th>
                                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-center">Status</th>
                                {isManager && <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider">Assignee</th>}
                                <th className="px-5 py-3 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 && (
                                <tr><td colSpan={isManager ? 5 : 4} className="py-12 text-center">
                                    <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p className="text-slate-500 font-medium">No {taskFilter.toLowerCase()} tasks found.</p>
                                </td></tr>
                            )}
                            {filtered.map(task => {
                                const pMeta = PRIORITY[task.priority] || PRIORITY.MEDIUM;
                                const tMeta = getTaskType(task);
                                const TypeIcon = tMeta.Icon;
                                return (
                                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-slate-800 text-sm">{task.title}</p>
                                            <div className="flex gap-2 mt-1 flex-wrap items-center">
                                                {task.due_date && <span className="text-[11px] text-slate-400 font-medium">Due: {task.due_date}</span>}
                                                {task.billable && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                        <IndianRupee className="w-2.5 h-2.5" />{Number(task.billing_amount).toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${pMeta.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${pMeta.dot}`}></span>{task.priority}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    task.status === 'BLOCKED' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>{task.status === 'IN_PROGRESS' ? 'WORKING' : task.status}</span>
                                        </td>
                                        {isManager && (
                                            <td className="px-5 py-3 text-sm text-slate-600 font-medium">{getDisplayName(task.assignee)}</td>
                                        )}
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => { setSelectedTask(task); setCommentText(''); }} className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold bg-indigo-50 px-4 py-1.5 rounded-lg hover:bg-indigo-100 whitespace-nowrap">
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Task Modal */}
            {showNewTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Assign New Task</h3>
                            <button onClick={() => setShowNewTask(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="taskForm" onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Task Title <span className="text-red-500">*</span></label>
                                    <input required type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Install cameras at Site B" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                                    <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:border-blue-500" placeholder="Brief details..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Assignee</label>
                                        <Select value={newTask.assigned_to} onChange={v => setNewTask({ ...newTask, assigned_to: v })}
                                            placeholder="Unassigned"
                                            options={users.map(u => ({ value: u.user_id, label: `${getDisplayName(u.users)} (${u.role})` }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                                        <Select value={newTask.priority} onChange={v => setNewTask({ ...newTask, priority: v })}
                                            options={[{ value: 'LOW', label: 'LOW' }, { value: 'MEDIUM', label: 'MEDIUM' }, { value: 'HIGH', label: 'HIGH' }]}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            <Briefcase className="w-3 h-3 inline mr-1" />Link to Project
                                        </label>
                                        <Select value={newTask.project_id} onChange={v => setNewTask({ ...newTask, project_id: v, amc_id: '' })}
                                            placeholder="— None —"
                                            options={projects.map(p => ({ value: p.id, label: p.title }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            <ShieldCheck className="w-3 h-3 inline mr-1" />Link to AMC
                                        </label>
                                        <Select value={newTask.amc_id} onChange={v => setNewTask({ ...newTask, amc_id: v, project_id: '' })}
                                            placeholder="— None —"
                                            options={amcs.map(a => ({ value: a.id, label: a.contract_number }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                                    <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800">Billable Task</p>
                                        <p className="text-[10px] text-emerald-600">Generates an invoice on completion</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={newTask.billable} onChange={e => setNewTask({ ...newTask, billable: e.target.checked, billing_amount: '' })} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                                {newTask.billable && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Amount (₹)</label>
                                        <input type="number" step="0.01" min="0" value={newTask.billing_amount} onChange={e => setNewTask({ ...newTask, billing_amount: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 5000" />
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button type="button" onClick={() => setShowNewTask(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                            <button type="submit" form="taskForm" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center">
                                <Save className="w-4 h-4 mr-2" /> Assign Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Task Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {(() => {
                                        const tMeta = getTaskType(selectedTask); const TIcon = tMeta.Icon;
                                        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${tMeta.cls}`}><TIcon className="w-3 h-3" />{tMeta.label}</span>;
                                    })()}
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY[selectedTask.priority]?.cls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY[selectedTask.priority]?.dot}`}></span>{selectedTask.priority}
                                    </span>
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{selectedTask.title}</h3>
                                {selectedTask.due_date && <p className="text-xs text-slate-500 mt-0.5">Due: {selectedTask.due_date}</p>}
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 rounded-md p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
                            {/* Left: Details */}
                            <div className="flex-1 space-y-5">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-100 min-h-[4rem]">
                                        {selectedTask.description || <span className="italic text-slate-400">No description provided.</span>}
                                    </div>
                                </div>

                                {/* Linked context */}
                                {(selectedTask.project || selectedTask.amc) && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Linked To</h4>
                                        <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100 flex items-center gap-3">
                                            {selectedTask.project ? <Briefcase className="w-4 h-4 text-blue-500 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-violet-500 shrink-0" />}
                                            <div>
                                                <p className="font-semibold text-slate-800">{selectedTask.project?.title || `AMC: ${selectedTask.amc?.contract_number} `}</p>
                                                <p className="text-xs text-slate-500">{(selectedTask.project?.clients || selectedTask.amc?.clients)?.company_name || (selectedTask.project?.clients || selectedTask.amc?.clients)?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Status picker */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</h4>
                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].map(s => (
                                            <button key={s} onClick={() => handleStatusUpdate(selectedTask.id, s)}
                                                className={`px-3 py-1.5 rounded-md border transition-colors ${selectedTask.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                                {s === 'IN_PROGRESS' ? 'WORKING' : s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Assignee */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assignee</h4>
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] mr-2">
                                                {getDisplayName(selectedTask.assignee).charAt(0).toUpperCase()}
                                            </div>
                                            {isManager ? (
                                                <Select value={selectedTask.assigned_to || ''}
                                                    onChange={v => handleAssigneeUpdate(selectedTask.id, v)}
                                                    placeholder="Unassigned"
                                                    options={users.map(u => ({ value: u.user_id, label: `${getDisplayName(u.users)} (${u.role})` }))}
                                                />
                                            ) : (
                                                <span className="font-semibold">{getDisplayName(selectedTask.assignee)}</span>
                                            )}
                                        </div>
                                        {selectedTask.creator && <span className="text-xs text-slate-400">by {getDisplayName(selectedTask.creator)}</span>}
                                    </div>
                                </div>

                                {/* Billing info */}
                                {selectedTask.billable && (
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <IndianRupee className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-emerald-800">Billable Task</p>
                                            <p className="text-sm font-black text-emerald-700">{fmtMoney(selectedTask.billing_amount)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Generate Invoice (admin/manager only, completed + billable) */}
                                {isManager && selectedTask.billable && selectedTask.status === 'COMPLETED' && (
                                    <button onClick={handleGenerateInvoice} disabled={generating}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60">
                                        <FileText className="w-4 h-4" />
                                        {generating ? 'Generating...' : 'Generate Invoice'}
                                    </button>
                                )}
                            </div>

                            {/* Right: Logs */}
                            <div className="w-full md:w-80 flex flex-col border-l border-slate-100 md:pl-6">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-1.5 text-slate-400" /> Technician Logs
                                </h4>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 max-h-56">
                                    {(selectedTask.comments || []).length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-100">
                                            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs font-medium">No logs yet.</p>
                                        </div>
                                    ) : (selectedTask.comments || []).map((c, i) => (
                                        <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                <span className="font-bold text-slate-600">{c.author}</span>
                                                <span>{new Date(c.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddComment} className="mt-auto shrink-0">
                                    <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                                        className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 mb-2 resize-none" rows="2" placeholder="Record an operation log..." />
                                    <button type="submit" disabled={!commentText.trim()} className="w-full bg-indigo-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                                        Submit Log
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
