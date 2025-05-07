import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Building2, Mail, Lock, Phone, MapPin, FileText, Globe, ArrowRight, Package, ChevronDown } from 'lucide-react';

const inputCls = "block w-full pl-11 bg-white border border-slate-300 rounded-xl py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm";

const Field = ({ icon: Icon, label, required, children }) => (
    <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-slate-400" />
            </div>
            {children}
        </div>
    </div>
);

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1=account, 2=company
    const [formData, setFormData] = useState({
        // Step 1
        email: '',
        password: '',
        // Step 2 — company profile
        companyName: '',
        phone: '',
        address: '',
        gstNumber: '',
        website: '',
        locationUrl: '',
    });

    const set = (key) => (e) => setFormData(f => ({ ...f, [key]: e.target.value }));

    const handleNext = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });
            if (authError) throw authError;

            await new Promise(r => setTimeout(r, 1000));
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user || authData?.user;
            if (!user) throw new Error("Failed to register user. Please try again.");

            const newOrgId = crypto.randomUUID();

            const { error: orgError } = await supabase.from('organizations').insert([{
                id: newOrgId,
                name: formData.companyName,
                phone: formData.phone,
                address: formData.address || null,
                location_url: formData.locationUrl || null,
                gst_number: formData.gstNumber || null,
                website: formData.website || null,
                billing_email: formData.email,
            }]);

            if (orgError) throw new Error("Failed to create workspace. Please contact support.");

            await supabase.from('organization_members').insert([{
                organization_id: newOrgId,
                user_id: user.id,
                role: 'ADMIN'
            }]);

            navigate('/dashboard');
        } catch (err) {
            console.error("Registration Error:", err);
            setError(err.message || 'An error occurred during registration.');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    {step === 1 ? 'Create your workspace' : 'Company profile'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                    {step === 1 ? (
                        <>Already have one?{' '}<button onClick={() => navigate('/login')} className="font-semibold text-blue-600 hover:text-blue-500">Sign in</button></>
                    ) : (
                        <span className="text-slate-400">This info will appear on quotes and invoices</span>
                    )}
                </p>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mt-5">
                    {[1, 2].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-blue-600' : s < step ? 'w-8 bg-emerald-400' : 'w-4 bg-slate-200'}`} />
                    ))}
                </div>
            </div>

            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200">

                    {error && (
                        <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form className="space-y-5" onSubmit={handleNext}>
                            <Field icon={Mail} label="Admin Email" required>
                                <input type="email" required value={formData.email} onChange={set('email')} className={inputCls} placeholder="admin@yourcompany.com" />
                            </Field>
                            <Field icon={Lock} label="Admin Password" required>
                                <input type="password" required minLength={6} value={formData.password} onChange={set('password')} className={inputCls} placeholder="At least 6 characters" />
                            </Field>
                            <button type="submit"
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm group">
                                Next: Company Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-4" onSubmit={handleRegister}>
                            <Field icon={Building2} label="Company Name" required>
                                <input type="text" required value={formData.companyName} onChange={set('companyName')} className={inputCls} placeholder="Acme Security Solutions" />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field icon={Phone} label="Phone" required>
                                    <input type="tel" required value={formData.phone} onChange={set('phone')} className={inputCls} placeholder="+91 98200 00000" />
                                </Field>
                                <Field icon={FileText} label="GST Number">
                                    <input type="text" value={formData.gstNumber} onChange={set('gstNumber')} className={inputCls} placeholder="27AABCX0000Y1Z5" />
                                </Field>
                            </div>

                            <Field icon={Globe} label="Website">
                                <input type="url" value={formData.website} onChange={set('website')} className={inputCls} placeholder="https://yourcompany.com" />
                            </Field>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Office Address</label>
                                <textarea rows={2} value={formData.address} onChange={set('address')}
                                    className="block w-full bg-white border border-slate-300 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm resize-none"
                                    placeholder="Full address including city, state, PIN" />
                            </div>

                            <Field icon={MapPin} label="Location URL (optional)">
                                <input type="url" value={formData.locationUrl} onChange={set('locationUrl')} className={inputCls} placeholder="https://maps.google.com/?q=..." />
                            </Field>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setStep(1)}
                                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors">
                                    Back
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                                    {loading ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                                    ) : (
                                        <>Create Workspace <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
