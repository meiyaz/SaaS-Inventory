import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Shield, X, Mail, Lock, Building, CheckCircle2, Ban, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Select from '../components/ui/Select';

const Team = () => {
    const { orgId, role, user } = useAuth();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        role: 'TECHNICIAN'
    });

    // Managers cannot create other Managers
    const availableRoles = role === 'ADMIN' ? ['MANAGER', 'TECHNICIAN'] : ['TECHNICIAN'];

    useEffect(() => {
        if (orgId) fetchMembers();
    }, [orgId]);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organization_members')
            .select('user_id, role, created_at, is_active, assigned_manager_id, users!organization_members_user_id_fkey(email)')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching team:", error);
        }

        setMembers(data || []);
        setLoading(false);
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setError(null);
        setAdding(true);

        try {
            if (newUser.password.length < 6) throw new Error("Password must be at least 6 characters.");

            // Call the secure Postgres RPC function 
            const { error: rpcError } = await supabase.rpc('add_team_member', {
                p_email: newUser.email,
                p_password: newUser.password,
                p_role: newUser.role,
                p_org_id: orgId
            });

            if (rpcError) throw new Error(rpcError.message);

            setSuccess(true);
            setNewUser({ email: '', password: '', role: 'TECHNICIAN' });
            fetchMembers();

            setTimeout(() => {
                setSuccess(false);
                setShowModal(false);
            }, 2000);

        } catch (err) {
            setError(err.message || "Failed to create user. Ensure the email is not already registered.");
        } finally {
            setAdding(false);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setAdding(true);
        setError(null);
        try {
            const { error: updateError } = await supabase
                .from('organization_members')
                .update({
                    role: editingMember.role,
                    is_active: editingMember.is_active,
                    assigned_manager_id: editingMember.role === 'TECHNICIAN' ? (editingMember.assigned_manager_id || null) : null,
                    created_at: new Date(editingMember.created_at).toISOString()
                })
                .eq('organization_id', orgId)
                .eq('user_id', editingMember.user_id);

            if (updateError) throw new Error(updateError.message);
            setEditingMember(null);
            fetchMembers();
        } catch (err) {
            console.error("Failed to update member:", err);
            setError(err.message || "Failed to update member.");
        } finally {
            setAdding(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Team Directory...</div>;

    const roleColors = {
        ADMIN: 'bg-red-50 text-red-700 border-red-200',
        MANAGER: 'bg-amber-50 text-amber-700 border-amber-200',
        TECHNICIAN: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    const getVisibleMembers = () => {
        return members.filter(m => {
            // Never show self
            if (m.user_id === user?.id) return false;

            // ADMIN sees all sub-roles
            if (role === 'ADMIN') return true;

            // MANAGER sees TECHNICIAN (their reportees) and ADMIN (their reporting up)
            if (role === 'MANAGER') return m.role === 'TECHNICIAN' || m.role === 'ADMIN';

            // TECHNICIAN sees MANAGER and ADMIN (their reporting structure)
            if (role === 'TECHNICIAN') return m.role === 'MANAGER' || m.role === 'ADMIN';

            return false;
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Users className="w-6 h-6 mr-2 text-indigo-600" />
                        Team Directory
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Manage organization members and provision operational accounts.</p>
                </div>
                <div className="flex gap-3">
                    {role === 'ADMIN' && (
                        <button onClick={() => navigate('/settings')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center shadow-sm transition-colors border border-slate-200">
                            <Shield className="w-4 h-4 mr-2" /> Manage Roles
                        </button>
                    )}
                    {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center shadow-sm transition-colors">
                            <UserPlus className="w-4 h-4 mr-2" /> Add Member
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Account Member</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Access Role</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Reports To ↑</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Direct Reports ↓</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Joined On</th>
                            {role === 'ADMIN' && <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {getVisibleMembers().map((m) => {
                            // Who this member reports to
                            const reportsTo = (() => {
                                if (m.role === 'ADMIN') return 'NONE'; // top of chain
                                if (m.role === 'MANAGER') {
                                    // Managers report to Admin
                                    const admins = members.filter(a => a.role === 'ADMIN');
                                    return admins.length > 0
                                        ? admins.map(a => a.users?.email?.split('@')[0]).join(', ')
                                        : 'Admin';
                                }
                                if (m.role === 'TECHNICIAN') {
                                    if (m.assigned_manager_id) {
                                        const mgr = members.find(x => x.user_id === m.assigned_manager_id);
                                        return mgr?.users?.email?.split('@')[0] || 'Unknown Manager';
                                    }
                                    return 'UNASSIGNED';
                                }
                                return null;
                            })();

                            // Who directly reports to this member
                            const directReports = (() => {
                                if (m.role === 'ADMIN') {
                                    return members.filter(x => x.role === 'MANAGER');
                                }
                                if (m.role === 'MANAGER') {
                                    return members.filter(x => x.role === 'TECHNICIAN' && x.assigned_manager_id === m.user_id);
                                }
                                return [];
                            })();

                            return (
                                <tr key={m.user_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 mr-3 shrink-0">
                                                {m.users?.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{m.users?.email?.split('@')[0].replace(/[._]/g, ' ') || 'User'}</p>
                                                <p className="text-xs text-slate-500 font-medium">{m.users?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-widest uppercase border border-opacity-50 ${m.is_active === false ? 'bg-slate-100 text-slate-400 border-slate-200' : (roleColors[m.role] || roleColors.TECHNICIAN)}`}>
                                            <Shield className="w-3 h-3 mr-1 opacity-70" />
                                            {m.is_active === false ? `DISABLED (${m.role})` : m.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {reportsTo === 'NONE'
                                            ? <span className="text-slate-300 text-xs italic">Top of hierarchy</span>
                                            : reportsTo === 'UNASSIGNED'
                                                ? <span className="text-slate-400 text-xs italic text-orange-600/70">Unassigned (Reports to Admin)</span>
                                                : <span className="font-medium text-slate-700">{reportsTo}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {directReports.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {directReports.slice(0, 3).map(r => (
                                                    <span key={r.user_id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                                                        {r.users?.email?.split('@')[0] || '?'}
                                                    </span>
                                                ))}
                                                {directReports.length > 3 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                                                        +{directReports.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-xs italic">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                                        {new Date(m.created_at).toLocaleDateString()}
                                    </td>
                                    {role === 'ADMIN' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Inline enable/disable — saves immediately */}
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const newStatus = m.is_active === false ? true : false;
                                                        await supabase
                                                            .from('organization_members')
                                                            .update({ is_active: newStatus })
                                                            .eq('organization_id', orgId)
                                                            .eq('user_id', m.user_id);
                                                        fetchMembers();
                                                    }}
                                                    title={m.is_active === false ? 'Enable Account' : 'Disable Account'}
                                                    className={`p-1.5 rounded-lg transition-colors text-xs font-semibold border ${m.is_active === false ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-200 hover:text-red-500 hover:bg-red-50 hover:border-red-200'}`}
                                                >
                                                    {m.is_active === false
                                                        ? <CheckCircle2 className="w-4 h-4" />
                                                        : <Ban className="w-4 h-4" />}
                                                </button>
                                                {/* Edit — opens full modal */}
                                                <button
                                                    onClick={() => setEditingMember({ ...m, created_at: m.created_at.split('T')[0] })}
                                                    title="Edit Member"
                                                    className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Provision New Account</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Securely generate credentials for your staff.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 rounded-md p-1 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6">
                            {success ? (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110 animate-pulse">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-bold text-lg text-slate-800">Account Provisioned!</h4>
                                    <p className="text-sm text-slate-500 mt-2">The credentials are now active.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleInvite} className="space-y-4">
                                    {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold">{error}</div>}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="technician@company.com" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Temporary Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input required minLength={6} type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Minimum 6 characters" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Access Role</label>
                                        <Select
                                            value={newUser.role}
                                            onChange={v => setNewUser({ ...newUser, role: v })}
                                            options={availableRoles.map(r => ({ value: r, label: r }))}
                                        />
                                        <p className="mt-1.5 text-[10px] text-slate-500 font-medium leading-relaxed">
                                            {newUser.role === 'MANAGER' ? 'Managers can oversee projects, quote clients, and assign tasks.' : 'Technicians can view assigned tasks and log maintenance data.'}
                                        </p>
                                    </div>

                                    <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={adding} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center transition-colors disabled:opacity-70">
                                            {adding ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Provision Account'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {editingMember && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Edit Team Member</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Modify access role or toggle active state.</p>
                            </div>
                            <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 rounded-md p-1 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold">{error}</div>}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Member Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input disabled value={editingMember.users?.email || ''} className="block w-full pl-10 pr-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Joined Date</label>
                                    <input required type="date" value={editingMember.created_at} onChange={e => setEditingMember({ ...editingMember, created_at: e.target.value })} className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Access Role</label>
                                    <Select
                                        value={editingMember.role}
                                        onChange={v => setEditingMember({ ...editingMember, role: v })}
                                        options={['ADMIN', 'MANAGER', 'TECHNICIAN'].map(r => ({ value: r, label: r }))}
                                    />
                                </div>

                                {editingMember.role === 'TECHNICIAN' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Assigned Manager</label>
                                        <Select
                                            value={editingMember.assigned_manager_id || ''}
                                            onChange={v => setEditingMember({ ...editingMember, assigned_manager_id: v })}
                                            options={[
                                                { value: '', label: 'None (Unassigned)' },
                                                ...members.filter(m => m.role === 'MANAGER' || m.role === 'ADMIN').map(m => ({
                                                    value: m.user_id,
                                                    label: m.users?.email || m.user_id
                                                }))
                                            ]}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Account Status</p>
                                        <p className="text-xs text-slate-500">{editingMember.is_active === false ? 'Disabled accounts cannot log in.' : 'Active and authenticated.'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingMember(p => ({ ...p, is_active: p.is_active === false ? true : false }))}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${editingMember.is_active !== false ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingMember.is_active !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
                                    <button type="button" onClick={() => setEditingMember(null)} className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={adding} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center transition-colors disabled:opacity-70">
                                        {adding ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
