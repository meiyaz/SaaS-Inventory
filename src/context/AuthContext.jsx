import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [orgId, setOrgId] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUserContext = async (userId) => {
        if (!userId) {
            setRole(null);
            setOrgId(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('organization_members')
                .select('role, organization_id, organizations(role_settings)')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                const userRole = data.role || 'TECHNICIAN';
                setRole(userRole);
                setOrgId(data.organization_id);

                if (userRole === 'ADMIN') {
                    setPermissions(['ADMIN_ALL']);
                } else {
                    const settings = data.organizations?.role_settings || {};
                    setPermissions(settings[userRole] || []);
                }
            } else {
                setRole('TECHNICIAN');
                setOrgId(null);
                setPermissions([]);
            }
        } catch (error) {
            console.warn("Could not fetch user context:", error.message);
            setRole('TECHNICIAN');
            setOrgId(null);
            setPermissions([]);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                const currentUser = session?.user ?? null;
                if (mounted) setUser(currentUser);

                if (currentUser) {
                    await fetchUserContext(currentUser.id);
                } else if (mounted) {
                    setRole(null);
                    setOrgId(null);
                }
            } catch (err) {
                console.warn("Session retrieval failed:", err.message);
                if (mounted) {
                    setUser(null);
                    setRole(null);
                    setOrgId(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            if (mounted) setUser(currentUser);

            if (currentUser) {
                fetchUserContext(currentUser.id).finally(() => {
                    if (mounted) setLoading(false);
                });
            } else {
                if (mounted) {
                    setRole(null);
                    setOrgId(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const logout = async () => {
        return await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, role, orgId, permissions, login, logout, loading }}>
            {loading ? (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Resolving Session...</p>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
