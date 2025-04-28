import React, { useState, useEffect } from 'react';
import { Settings2, Building2, Save, Key, Bell, Palette, CreditCard, CheckCircle2, Shield } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const TABS = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'permissions', label: 'Role Permissions', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
];

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

const field = (label, children) => (
    <div>
        <label className={labelCls}>{label}</label>
        {children}
    </div>
);

const Settings = () => {
    const { orgId } = useAuth();
    const [tab, setTab] = useState('company');
    const [saved, setSaved] = useState(false);
    const [roleSettings, setRoleSettings] = useState({ MANAGER: [], TECHNICIAN: [] });

    useEffect(() => {
        if (orgId) {
            supabase.from('organizations').select('role_settings').eq('id', orgId).single().then(({ data }) => {
                if (data?.role_settings) setRoleSettings(data.role_settings);
            });
        }
    }, [orgId]);

    // Company profile stored in localStorage for demo
    const [company, setCompany] = useState(() => {
        try { return JSON.parse(localStorage.getItem('company_profile') || '{}'); } catch { return {}; }
    });

    const [prefs, setPrefs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('app_prefs') || '{}'); } catch { return {}; }
    });

    const handleSaveCompany = () => {
        localStorage.setItem('company_profile', JSON.stringify(company));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleSavePrefs = () => {
        localStorage.setItem('app_prefs', JSON.stringify(prefs));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleSavePermissions = async () => {
        await supabase.from('organizations').update({ role_settings: roleSettings }).eq('id', orgId);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const togglePermission = (role, moduleKey) => {
        setRoleSettings(prev => {
            const current = prev[role] || [];
            if (current.includes(moduleKey)) {
                return { ...prev, [role]: current.filter(m => m !== moduleKey) };
            } else {
                return { ...prev, [role]: [...current, moduleKey] };
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Settings2 className="w-6 h-6 mr-2 text-slate-500" />
                    Settings
                </h2>
                <p className="text-slate-500 text-sm mt-1">Configure company profile, preferences, and system settings.</p>
            </div>

            <div className="flex gap-6">
                {/* Tab List */}
                <div className="w-48 shrink-0 flex flex-col gap-1">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${tab === t.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                                <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">

                    {/* Save Banner */}
                    {saved && (
                        <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2">
                            <Save className="w-4 h-4" /> Settings saved successfully.
                        </div>
                    )}

                    {/* Billing & Subscription */}
                    {tab === 'billing' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">Subscription Plan</h3>
                                <p className="text-xs text-slate-500 mt-1">Manage your SaaS billing and active workspace limits.</p>
                            </div>

                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500/30 text-xs font-bold tracking-wider uppercase mb-3 border border-blue-400/20">
                                            Current Plan
                                        </div>
                                        <h4 className="text-3xl font-extrabold mb-1">SaaS Inventory Pro</h4>
                                        <p className="text-blue-200 text-sm mb-6">Billed $29.00/month. Next charge on Oct 1st.</p>

                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Unlimited Products</div>
                                            <div className="flex items-center text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> 5 Technician Accounts</div>
                                            <div className="flex items-center text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Quotation Builder</div>
                                            <div className="flex items-center text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> API Access</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <button className="bg-white text-blue-700 hover:bg-slate-50 px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-colors">
                                            Manage via Stripe
                                        </button>
                                        <div className="mt-4 text-xs font-medium text-blue-200">
                                            Account ID: {company?.name?.slice(0, 3).toUpperCase() || 'ORG'}-001<br />
                                            Since: Mar 2026
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                                <h4 className="font-bold text-slate-800 mb-2">Need Enterprise Features?</h4>
                                <p className="text-sm text-slate-600 mb-4">Upgrade to Enterprise for white-labeled client portals, massive storage, and unmetered API endpoints.</p>
                                <button className="px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-700 transition">
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Role Permissions */}
                    {tab === 'permissions' && (
                        <div className="space-y-5">
                            <h3 className="font-bold text-slate-800 text-base flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                                Role Access Control
                            </h3>
                            <p className="text-xs text-slate-500 border-b border-slate-100 pb-4">
                                Granularly configure which application modules are available to your operational teams. Admin roles have overriding access strictly mapped to all available endpoints.
                            </p>

                            {['MANAGER', 'TECHNICIAN'].map(roleType => (
                                <div key={roleType} className="pt-2">
                                    <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider mb-3 bg-slate-100 py-1.5 px-3 rounded-md border border-slate-200 inline-block">{roleType} ACCOUNTS</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                        {[
                                            { key: 'dashboard', label: 'Dashboard' },
                                            { key: 'projects', label: 'Projects CRM' },
                                            { key: 'clients', label: 'Clients' },
                                            { key: 'suppliers', label: 'Suppliers' },
                                            { key: 'categories', label: 'Categories' },
                                            { key: 'products', label: 'Products Master' },
                                            { key: 'products_in', label: 'Stock Verify (In)' },
                                            { key: 'products_out', label: 'Stock Issue (Out)' },
                                            { key: 'products_logs', label: 'Stock Tracking Logs' },
                                            { key: 'tasks', label: 'Operational Tasks' },
                                            { key: 'amc', label: 'AMC Contracts' },
                                            { key: 'billing', label: 'Billing & Quotations' },
                                            { key: 'reports', label: 'Analytics Reports' }
                                        ].map(mod => (
                                            <div key={mod.key}
                                                onClick={() => togglePermission(roleType, mod.key)}
                                                className={`p-3 rounded-xl border flex items-center cursor-pointer transition-all ${(roleSettings[roleType] || []).includes(mod.key)
                                                        ? 'bg-blue-50/50 border-blue-200 opacity-100 shadow-sm'
                                                        : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                                                    }`}>
                                                <div className={`w-4 h-4 rounded shadow-sm border mr-2.5 flex items-center justify-center transition-colors ${(roleSettings[roleType] || []).includes(mod.key)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white border-slate-300'
                                                    }`}>
                                                    {(roleSettings[roleType] || []).includes(mod.key) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={`text-xs font-semibold ${(roleSettings[roleType] || []).includes(mod.key) ? 'text-blue-800' : 'text-slate-600'
                                                    }`}>{mod.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button onClick={handleSavePermissions} className="inline-flex items-center px-5 py-2.5 mt-2 bg-slate-900 text-white shadow-sm rounded-lg text-sm font-semibold hover:bg-black transition-colors">
                                <Save className="w-4 h-4 mr-1.5" /> Commit Access Policies
                            </button>
                        </div>
                    )}

                    {/* Company Profile */}
                    {tab === 'company' && (
                        <div className="space-y-5">
                            <h3 className="font-bold text-slate-800 text-base">Company Profile</h3>
                            <p className="text-xs text-slate-500">This information appears on printed Quotations and documents.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {field('Company Name', <input value={company.name || ''} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} className={inputCls} placeholder="e.g. SecureVision Systems" />)}
                                {field('GST Number', <input value={company.gst || ''} onChange={e => setCompany(c => ({ ...c, gst: e.target.value }))} className={inputCls} placeholder="27AABCX0000Y1Z5" />)}
                                {field('Phone', <input value={company.phone || ''} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} className={inputCls} placeholder="+91 98200 00000" />)}
                                {field('Email', <input type="email" value={company.email || ''} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} className={inputCls} placeholder="billing@company.com" />)}
                                <div className="col-span-2">
                                    {field('Address', <textarea rows="2" value={company.address || ''} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Full address including city, state, PIN" />)}
                                </div>
                                {field('Website', <input value={company.website || ''} onChange={e => setCompany(c => ({ ...c, website: e.target.value }))} className={inputCls} placeholder="https://www.company.com" />)}
                                {field('Default GST Rate (%)', <select value={company.defaultGst || '18'} onChange={e => setCompany(c => ({ ...c, defaultGst: e.target.value }))} className={inputCls}>
                                    {['0', '5', '12', '18'].map(v => <option key={v} value={v}>{v}%</option>)}
                                </select>)}
                            </div>
                            <button onClick={handleSaveCompany} className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-1.5" /> Save Company Profile
                            </button>
                        </div>
                    )}

                    {/* Preferences */}
                    {tab === 'preferences' && (
                        <div className="space-y-5">
                            <h3 className="font-bold text-slate-800 text-base">Application Preferences</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {field('Currency Symbol', <select value={prefs.currency || '₹'} onChange={e => setPrefs(p => ({ ...p, currency: e.target.value }))} className={inputCls}>
                                    <option value="₹">₹ — Indian Rupee (INR)</option>
                                    <option value="$">$ — US Dollar (USD)</option>
                                    <option value="£">£ — British Pound (GBP)</option>
                                </select>)}
                                {field('Date Format', <select value={prefs.dateFormat || 'DD MMM YYYY'} onChange={e => setPrefs(p => ({ ...p, dateFormat: e.target.value }))} className={inputCls}>
                                    <option value="DD MMM YYYY">DD MMM YYYY (24 Feb 2026)</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                </select>)}
                                {field('Low Stock Alert Threshold (global default)', <input type="number" min="1" value={prefs.lowStockDefault || '5'} onChange={e => setPrefs(p => ({ ...p, lowStockDefault: e.target.value }))} className={inputCls} />)}
                                {field('AMC Renewal Alert (days before)', <select value={prefs.amcAlertDays || '60'} onChange={e => setPrefs(p => ({ ...p, amcAlertDays: e.target.value }))} className={inputCls}>
                                    {['30', '45', '60', '90'].map(d => <option key={d} value={d}>{d} days</option>)}
                                </select>)}
                            </div>
                            <button onClick={handleSavePrefs} className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-1.5" /> Save Preferences
                            </button>
                        </div>
                    )}

                    {/* Notifications */}
                    {tab === 'notifications' && (
                        <div className="space-y-5">
                            <h3 className="font-bold text-slate-800 text-base">Notification Settings</h3>
                            <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                Email notifications require backend function configuration in Supabase. These toggles control which events are tracked in the UI.
                            </p>
                            {[
                                { label: 'Low Stock Alert', sub: 'When a product falls below its minimum threshold', key: 'lowStock' },
                                { label: 'AMC Renewal Due', sub: 'When a contract is within the alert window', key: 'amcRenewal' },
                                { label: 'Project Status Change', sub: 'When a project moves stages in the pipeline', key: 'projectStatus' },
                                { label: 'Quotation Accepted/Rejected', sub: 'When a quote status changes', key: 'quoteStatus' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                        <p className="text-xs text-slate-500">{item.sub}</p>
                                    </div>
                                    <button
                                        onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${prefs[item.key] ? 'bg-blue-500' : 'bg-slate-200'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Security */}
                    {tab === 'security' && (
                        <div className="space-y-5">
                            <h3 className="font-bold text-slate-800 text-base">Security Settings</h3>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-sm font-semibold text-blue-800 mb-1">Authentication via Supabase</p>
                                <p className="text-xs text-blue-600">Password changes, MFA, and session management are handled in the Supabase Auth dashboard.</p>
                                <a href="https://supabase.com" target="_blank" rel="noreferrer"
                                    className="inline-block mt-2 text-xs font-semibold text-blue-600 underline hover:text-blue-800">
                                    Open Supabase Dashboard →
                                </a>
                            </div>
                            {[
                                { label: 'Session Timeout', sub: 'Enforce logout after inactivity', key: 'sessionTimeout', default: '60' },
                            ].map(s => (
                                <div key={s.key}>
                                    {field(s.label, <select value={prefs[s.key] || s.default} onChange={e => setPrefs(p => ({ ...p, [s.key]: e.target.value }))} className={inputCls}>
                                        <option value="30">30 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="120">2 hours</option>
                                        <option value="480">8 hours</option>
                                        <option value="never">Never</option>
                                    </select>)}
                                </div>
                            ))}
                            <button onClick={handleSavePrefs} className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-1.5" /> Save Security Settings
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
