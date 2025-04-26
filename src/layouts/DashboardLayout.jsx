import React from 'react';
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
    Truck,
    Tags,
    ArrowDownToLine,
    ArrowUpRight,
    History,
    FolderKanban,
    ShieldCheck,
    BarChart3,
    CheckSquare // Added CheckSquare icon
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Added useLocation
    const { user, permissions, role, logout } = useAuth(); // Added permissions

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // New navigation structure with sections and permission roles
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
            title: 'Inventory Management',
            items: [
                { name: 'Categories', icon: Tags, path: '/categories', role: 'categories' },
                { name: 'Products', icon: Package, path: '/products', role: 'products' },
                { name: 'Stock Inward', icon: ArrowDownToLine, path: '/products/in', role: 'products_in' },
                { name: 'Stock Outward', icon: ArrowUpRight, path: '/products/out', role: 'products_out' },
                { name: 'Stock Logs', icon: History, path: '/products/logs', role: 'products_logs' },
            ]
        },
        {
            title: 'Operations & Service',
            items: [
                { name: 'Tasks', icon: CheckSquare, path: '/tasks', role: 'tasks' }, // Added Tasks module
                { name: 'AMC Tracker', icon: ShieldCheck, path: '/amc', role: 'amc' },
                { name: 'Billing', icon: FileText, path: '/billing', role: 'billing' },
            ]
        },
        {
            title: 'Analytics & Admin',
            items: [
                { name: 'Reports', icon: BarChart3, path: '/reports', role: 'reports' },
                { name: 'Settings', icon: Settings, path: '/settings', role: 'settings' }
            ]
        }
    ];

    // Removed old navItems and filtering logic

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-screen transition-all duration-300">
            <div className="p-6 flex items-center justify-center border-b border-slate-800 shrink-0">
                <h1 className="text-xl font-bold tracking-wider text-blue-400">SAAS INVENTORY</h1>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                {navigation.map((section, idx) => {
                    const visibleItems = section.items.filter(item => {
                        if (role === 'ADMIN') return true; // Admin sees everything
                        if (!item.role) return true; // Items without a specific role are visible to all authenticated users
                        return permissions?.includes(item.role); // Check if user has the required permission
                    });

                    if (visibleItems.length === 0) return null; // Don't render section if no items are visible

                    return (
                        <div key={idx}>
                            {section.title && (
                                <h4 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">
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
                                            className={`flex items - center py - 2.5 rounded - lg transition - colors px - 4
                                                ${isActive
                                                    ? 'bg-blue-600/90 text-white shadow-sm'
                                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                } `
                                            }
                                        >
                                            <Icon className="w-5 h-5 mr-3" />
                                            <span className="font-medium">{item.name}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                <div className="flex items-center px-3 py-3 mb-3 rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-inner group transition-all hover:bg-slate-800 hover:border-slate-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] shrink-0 relative z-10 border border-slate-700/50">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden ml-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white truncate capitalize pr-2">
                                {user?.email?.split('@')[0].replace(/[._]/g, ' ') || 'User Account'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{user?.email || 'Loading...'}</p>
                            <span className={`inline - flex items - center px - 1.5 py - 0.5 rounded text - [9px] uppercase font - bold tracking - wider border shrink - 0 ml - 2 ${role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                    role === 'MANAGER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                } `}>
                                {role || 'USER'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-300 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 hover:text-red-400 transition-all group"
                >
                    <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export const DashboardLayout = () => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm z-10 shrink-0">
                    <button className="p-2 mr-4 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden">
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1"></div>
                    <div className="flex items-center space-x-4">
                        {/* Future top nav items like notifications */}
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
