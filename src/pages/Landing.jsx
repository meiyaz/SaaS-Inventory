import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShieldCheck, ArrowRight, BarChart3, Users, Building2, CheckCircle2 } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">SaaS Inventory</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-all shadow-sm"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-16 px-6 lg:pt-40 lg:pb-24">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-blue-200">
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        <span>Built specifically for System Integrators</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                        Manage your inventory, quotes, <br className="hidden md:block" />
                        <span className="text-blue-600">
                            and AMCs flawlessly.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        SaaS Inventory is the definitive B2B platform designed to help hardware installation companies eliminate paperwork and scale their operations.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md group border border-transparent"
                        >
                            Start Your Free Trial
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-sm"
                        >
                            Log in to Dashboard
                        </button>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="max-w-7xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            title: 'Smart Inventory',
                            desc: 'Track cables, cameras, and DVRs across multiple warehouses in real-time. Never run out of stock.',
                            icon: Package,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                            border: 'border-blue-100'
                        },
                        {
                            title: 'Instant Quotations',
                            desc: 'Generate professional, branded PDF quotes with embedded labor and cabling costs in seconds.',
                            icon: BarChart3,
                            color: 'text-emerald-600',
                            bg: 'bg-emerald-50',
                            border: 'border-emerald-100'
                        },
                        {
                            title: 'AMC Management',
                            desc: 'Automate your Annual Maintenance Contracts. Get notified before contracts expire and retain clients.',
                            icon: ShieldCheck,
                            color: 'text-purple-600',
                            bg: 'bg-purple-50',
                            border: 'border-purple-100'
                        }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-6`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">{feature.desc}</p>

                            <ul className="mt-6 space-y-2">
                                <li className="flex items-center text-sm text-slate-500 font-medium">
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" /> Purpose-built tools
                                </li>
                                <li className="flex items-center text-sm text-slate-500 font-medium">
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" /> Cloud synchronized
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Landing;
