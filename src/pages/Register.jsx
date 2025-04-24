import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Building2, Mail, Lock, Phone, ArrowRight, Package } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        companyName: '',
        phone: '',
        email: '',
        password: '',
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Sign Up the User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            // Wait a brief moment to ensure auth state is populated
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user || authData?.user;

            if (!user) throw new Error("Failed to register user. Please try again.");

            // 2. Create the Organization (RLS allows INSERT with check true)
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert([{
                    name: formData.companyName,
                    phone: formData.phone,
                    billing_email: formData.email
                }])
                .select()
                .single();

            if (orgError) {
                console.warn("Could not create organization automatically. RLS policies might block it.", orgError);
            } else {
                // 3. Link User to Organization as Admin
                const { error: memberError } = await supabase
                    .from('organization_members')
                    .insert([{
                        organization_id: orgData.id,
                        user_id: user.id,
                        role: 'ADMIN'
                    }]);

                if (memberError) console.warn("Could not link member:", memberError);
            }

            // Redirect to dashboard
            navigate('/dashboard');

        } catch (err) {
            console.error("Registration Error:", err);
            setError(err.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Create your workspace
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Or{' '}
                    <button onClick={() => navigate('/login')} className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                        log in to your existing account
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200">
                    <form className="space-y-6" onSubmit={handleRegister}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm font-medium flex items-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Company Name</label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="block w-full pl-11 bg-white border border-slate-300 rounded-xl py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="Acme Security Solutions"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Email</label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full pl-11 bg-white border border-slate-300 rounded-xl py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="admin@acmesecurity.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="block w-full pl-11 bg-white border border-slate-300 rounded-xl py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="Company Contact"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Password</label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="block w-full pl-11 bg-white border border-slate-300 rounded-xl py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                        Creating Workspace...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Create Account
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
