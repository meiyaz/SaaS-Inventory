import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Camera, Server, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600 mr-2" />
                            <span className="font-bold text-xl tracking-tight text-slate-900">Stock Sight</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <a href="#features" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">Features</a>
                            <a href="#about" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition">About</a>
                            <Link to="/login" className="ml-4 inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition">
                                Partner Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 pb-2">
                        The Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">CCTV Project</span> Platform
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 mb-10">
                        Streamline your security installations. Manage inventory, generate BOMs instantly, and track profitability all in one centralized dashboard.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/login" className="inline-flex items-center px-8 py-3.5 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition">
                            Access Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Showcase */}
            <div id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Built for Security Integrators</h2>
                        <p className="mt-4 text-lg text-slate-500">Everything you need to quote, deploy, and support CCTV projects efficiently.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {/* Feature 1 */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <Camera className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Smart BOM Builder</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Input your requirements and automatically generate a Bill of Materials with accurate cabling estimates and margin calculations.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                                <Server className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Live Stock Tracking</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Never run out of crucial components. Real-time sync between incoming purchases and project outward allocations.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Instant Quotations</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Convert approved BOMs into branded PDF quotations in seconds. Track client approvals and automate invoicing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Shield className="h-6 w-6 text-blue-500 mr-2" />
                            <span className="font-bold text-lg">Stock Sight</span>
                        </div>
                        <div className="text-slate-400 text-sm">
                            © 2024 Stock Sight Security Systems. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
