import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserRole = async (userId) => {
        if (!userId) {
            setRole(null);
            return;
        }
        try {
            const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
            if (error) throw error;
            setRole(data?.role || 'TECHNICIAN');
        } catch (error) {
            console.warn("Could not fetch user role, defaulting to TECHNICIAN:", error.message);
            setRole('TECHNICIAN');
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
                    await fetchUserRole(currentUser.id);
                } else if (mounted) {
                    setRole(null);
                }
            } catch (err) {
                console.warn("Session retrieval failed:", err.message);
                if (mounted) {
                    setUser(null);
                    setRole(null);
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
                fetchUserRole(currentUser.id).finally(() => {
                    if (mounted) setLoading(false);
                });
            } else {
                if (mounted) {
                    setRole(null);
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
        <AuthContext.Provider value={{ user, role, login, logout, loading }}>
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
