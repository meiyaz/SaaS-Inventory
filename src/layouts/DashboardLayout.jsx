import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Building2,
    Users,
    Package,
    FileText,
    LayoutDashboard,
    Settings,
    LogOut,
    Menu,
    X,
    Truck,
    Tags,
    ArrowDownToLine,
    ArrowUpRight,
    History,
    FolderKanban,
    ShieldCheck,
    BarChart3,
    CheckSquare
} from 'lucide-react';

const SidebarContent = ({ onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, permissions, role, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navigation = [
        {
            title: 'Main',
            items: [
                { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', role: 'dashboard' },
                { name: 'Projects', icon: FolderKanban, path: '/projects', role: 'projects' },
                { name: 'Clients', icon: Users, path: '/clients', role: 'clients' },
                { name: 'Suppliers', icon: Truck, path: '/suppliers', role: 'suppliers' },
            ]
        },
        {
            title: 'Inventory',
            items: [
                { name: 'Categories', icon: Tags, path: '/categories', role: 'categories' },
                { name: 'Products', icon: Package, path: '/products', role: 'products' },
                { name: 'Stock In', icon: ArrowDownToLine, path: '/products/in', role: 'products_in' },
                { name: 'Stock Out', icon: ArrowUpRight, path: '/products/out', role: 'products_out' },
                { name: 'Stock Logs', icon: History, path: '/products/logs', role: 'products_logs' },
            ]
        },
        {
            title: 'Operations & Service',
            items: [
                { name: 'Tasks', icon: CheckSquare, path: '/tasks', role: 'tasks' },
                { name: 'AMC Tracker', icon: ShieldCheck, path: '/amc', role: 'amc' },
                { name: 'Billing', icon: FileText, path: '/billing', role: 'billing' },
            ]
        },
        {
            title: 'Admin',
            items: [
                { name: 'Reports', icon: BarChart3, path: '/reports', role: 'reports' },
                { name: 'Settings', icon: Settings, path: '/settings', role: 'settings' }
            ]
        }
    ];

    return (
        <div className="w-64 bg-slate-900 flex flex-col h-full text-slate-300">
            <div className="p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
                <h1 className="text-lg font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">SAAS INVENTORY</h1>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition lg:hidden">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
                {navigation.map((section, idx) => {
                    const visibleItems = section.items.filter(item => {
                        if (role === 'ADMIN') return true;
                        if (!item.role) return true;
                        return permissions?.includes(item.role);
                    });

                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx} className="mb-4">
                            {section.title && (
                                <h4 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 mt-3">
                                    {section.title}
                                </h4>
                            )}
                            <div className="space-y-0.5">
                                {visibleItems.map(item => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                                    return (
                                        <NavLink
                                            key={item.name}
                                            to={item.path}
                                            onClick={onClose}
                                            className={`flex items-center py-2.5 px-3 rounded-lg transition-all text-sm font-medium
                                                ${isActive
                                                    ? 'bg-blue-600/10 text-blue-400 font-bold'
                                                    : 'hover:bg-slate-800 hover:text-white'
                                                }`
                                            }
                                        >
                                            <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-500' : 'opacity-70'}`} />
                                            {item.name}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900/50">
                <div className="flex items-center px-3 py-2.5 mb-3 rounded-xl bg-slate-800/40 border border-slate-700/30 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden ml-3">
                        <p className="text-xs font-bold text-white truncate pr-2 capitalize">
                            {user?.email?.split('@')[0].replace(/[._]/g, ' ') || 'User Account'}
                        </p>
                        <div className="flex items-center mt-0.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider leading-none border ${role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    role === 'MANAGER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                {role || 'USER'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-400 rounded-lg hover:bg-slate-800 hover:text-rose-400 transition-colors"
                >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 z-20 shadow-xl shadow-slate-900/20">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden flex">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex flex-col w-64 max-w-sm h-full shadow-2xl transform transition-transform duration-300 translate-x-0">
                        <SidebarContent onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300">
                <header className="h-14 lg:h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8 justify-between z-10 shrink-0 sticky top-0">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 mr-3 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors">
                            <Menu className="h-5 w-5" />
                        </button>
                        <h2 className="text-sm font-semibold text-slate-800 lg:hidden uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">SaaS Inventory</h2>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8 w-full block">
                    <div className="max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
