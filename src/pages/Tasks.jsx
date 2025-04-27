import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Plus, MessageSquare, AlertCircle, Clock, Save, X } from 'lucide-react';

const Tasks = () => {
    const { user, role, orgId } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showNewTask, setShowNewTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', priority: 'MEDIUM', due_date: '' });

    // Comment State
    const [commentText, setCommentText] = useState('');
    const [activeCommentTask, setActiveCommentTask] = useState(null);

    const isManager = role === 'ADMIN' || role === 'MANAGER';

    useEffect(() => {
        if (orgId) {
            fetchData();
        }
    }, [orgId, role]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch users for assignment map
        if (isManager) {
            const { data: userData } = await supabase
                .from('organization_members')
                .select('user_id, role, users:user_id(email)')
                .eq('organization_id', orgId);
            setUsers(userData || []);
        }

        // Fetch tasks
        let query = supabase.from('tasks').select('*, assigned:assigned_to(email), creator:created_by(email)').order('created_at', { ascending: false });

        // Technicians only see their own tasks
        if (!isManager && user) {
            query = query.eq('assigned_to', user.id);
        }

        const { data } = await query;
        setTasks(data || []);
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
            created_by: user.id
        };

        await supabase.from('tasks').insert([payload]);
        setShowNewTask(false);
        setNewTask({ title: '', description: '', assigned_to: '', priority: 'MEDIUM', due_date: '' });
        fetchData();
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    };

    const handleAddComment = async (e, task) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        const newComment = {
            id: Date.now(),
            text: commentText,
            author: user.email,
            timestamp: new Date().toISOString()
        };

        const currentComments = Array.isArray(task.comments) ? task.comments : [];
        const payload = [...currentComments, newComment];

        await supabase.from('tasks').update({ comments: payload }).eq('id', task.id);
        setTasks(tasks.map(t => t.id === task.id ? { ...t, comments: payload } : t));
        setCommentText('');
        setActiveCommentTask(null);
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            PENDING: 'bg-slate-100 text-slate-600',
            IN_PROGRESS: 'bg-blue-100 text-blue-700',
            COMPLETED: 'bg-emerald-100 text-emerald-700',
            BLOCKED: 'bg-rose-100 text-rose-700'
        };
        return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${colors[status] || colors.PENDING}`}>{status}</span>;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Tasks...</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <CheckSquare className="w-6 h-6 mr-2 text-blue-600" />
                        Task Management
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{isManager ? 'Assign and track operational duties.' : 'View and update your assigned tasks.'}</p>
                </div>
                {isManager && (
                    <button onClick={() => setShowNewTask(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors">
                        <Plus className="w-4 h-4 mr-1.5" /> Assign Task
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{task.title}</h3>
                                <StatusBadge status={task.status} />
                            </div>
                            <p className="text-sm text-slate-600 mb-4">{task.description || 'No description provided.'}</p>

                            <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-medium">
                                <div className="flex items-center"><CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Assigned: {task.assigned?.email || 'Unassigned'}</div>
                                {task.due_date && <div className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5" /> Due: {task.due_date}</div>}
                                <div className="flex items-center">
                                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Priority:
                                    <span className={`ml-1 font-bold ${task.priority === 'HIGH' ? 'text-red-500' : task.priority === 'LOW' ? 'text-slate-400' : 'text-blue-500'}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Update Actions (Both can update) */}
                        <div className="px-5 py-3 bg-slate-50 flex flex-wrap gap-2 text-xs font-semibold">
                            {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].map(status => (
                                <button key={status}
                                    onClick={() => handleStatusUpdate(task.id, status)}
                                    className={`px-3 py-1.5 rounded-md border transition-colors ${task.status === status ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                >
                                    {status === 'IN_PROGRESS' ? 'WORKING' : status}
                                </button>
                            ))}
                        </div>

                        {/* Comments System */}
                        <div className="p-5 flex-1 bg-white border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center">
                                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                Technician Logs
                            </h4>
                            <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
                                {(task.comments || []).map((c, i) => (
                                    <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span className="font-bold text-slate-600">{c.author}</span>
                                            <span>{new Date(c.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-700">{c.text}</p>
                                    </div>
                                ))}
                                {(!task.comments || task.comments.length === 0) && (
                                    <span className="text-xs text-slate-400 italic">No logs added yet.</span>
                                )}
                            </div>

                            {activeCommentTask === task.id ? (
                                <form onSubmit={(e) => handleAddComment(e, task)} className="flex flex-col gap-2">
                                    <textarea
                                        autoFocus
                                        value={commentText} onChange={e => setCommentText(e.target.value)}
                                        className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        rows="2" placeholder="Write an update..."
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700">Save</button>
                                        <button type="button" onClick={() => setActiveCommentTask(null)} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-slate-300">Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <button onClick={() => { setActiveCommentTask(task.id); setCommentText(''); }} className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                                    <Plus className="w-3 h-3 mr-1" /> Add Log Entry
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                        <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-lg text-slate-600">No active tasks.</p>
                        <p className="text-sm">You're all caught up!</p>
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {showNewTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Assign New Task</h3>
                            <button onClick={() => setShowNewTask(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="taskForm" onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Task Title <span className="text-red-500">*</span></label>
                                    <input required type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Install cameras at Site B" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                                    <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-24" placeholder="Brief details about the operation..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Assignee</label>
                                        <select value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 bg-white">
                                            <option value="">Unassigned</option>
                                            {users.map(u => (
                                                <option key={u.user_id} value={u.user_id}>{u.users?.email} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                                        <input disabled value="PENDING" className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                                        <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 bg-white">
                                            <option value="LOW">LOW</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HIGH">HIGH</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                                        <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button type="button" onClick={() => setShowNewTask(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" form="taskForm" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
                                <Save className="w-4 h-4 mr-2" /> Assign Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
