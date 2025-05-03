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
    CheckSquare,
    Wallet,
    Receipt
} from 'lucide-react';
import Scrollbar from '../components/ui/Scrollbar';

const SidebarContent = ({ onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, permissions, role, logout } = useAuth();

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
            title: 'Finance & Billing',
            items: [
                { name: 'Estimates', icon: FileText, path: '/billing', role: 'billing' },
                { name: 'Invoices', icon: Receipt, path: '/invoices', role: 'billing' },
                { name: 'Expenses', icon: Wallet, path: '/expenses', role: 'billing' },
                { name: 'Billing Logs', icon: History, path: '/billing/logs', role: 'billing' },
            ]
        },
        {
            title: 'Inventory',
            items: [
                { name: 'Products', icon: Package, path: '/products', role: 'products' },
                { name: 'Stock In', icon: ArrowDownToLine, path: '/products/in', role: 'products_in' },
                { name: 'Stock Out', icon: ArrowUpRight, path: '/products/out', role: 'products_out' },
                { name: 'Stock Logs', icon: History, path: '/products/logs', role: 'products_logs' },
            ]
        },
        {
            title: 'Admin',
            items: [
                { name: 'Team Directory', icon: Users, path: '/team' },
                { name: 'Audit Logs', icon: History, path: '/audit-logs' },
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

            <Scrollbar as="nav" className="flex-1 px-4 py-6 space-y-1" dark>
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
            </Scrollbar>
        </div>
    );
};

export const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();
    const { user, role, logout, orgName } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

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
                <header className="h-14 lg:h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8 justify-between z-30 shrink-0 sticky top-0 shadow-sm">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 mr-3 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors">
                            <Menu className="h-5 w-5" />
                        </button>
                        <h2 className="text-sm font-semibold text-slate-800 lg:hidden uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            {orgName || 'SaaS Inventory'}
                        </h2>
                        <div className="hidden lg:flex items-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 mr-2" />
                            <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase">
                                {orgName || 'SECURE SESSION'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative">
                        {/* Profile Dropdown Toggle */}
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-3 hover:bg-slate-100 p-1.5 pr-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-md border-2 border-white ring-2 ring-slate-100 shrink-0">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="hidden sm:flex flex-col items-start text-left">
                                <p className="text-sm font-bold text-slate-800 capitalize leading-none mb-1">
                                    {user?.email?.split('@')[0].replace(/[._]/g, ' ') || 'User Account'}
                                </p>
                                <span className={`inline-flex items-center px-1.5 py-[2px] rounded text-[9px] uppercase font-bold tracking-widest leading-none border ${role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-200' :
                                    role === 'MANAGER' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    }`}>
                                    {role || 'USER'}
                                </span>
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {profileOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                                <div className="absolute right-0 top-12 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <p className="text-sm font-extrabold text-slate-800 truncate mb-0.5">
                                            {user?.email?.split('@')[0].replace(/[._]/g, ' ') || 'User Account'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>

                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                                            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4 mr-3 opacity-70" /> Account Settings
                                        </button>
                                        <button
                                            onClick={() => { setProfileOpen(false); navigate('/team'); }}
                                            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                                        >
                                            <Users className="w-4 h-4 mr-3 opacity-70" /> Team Directory
                                        </button>
                                    </div>

                                    <div className="p-2 border-t border-slate-100">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-3 opacity-70" /> Sign Out from App
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>
                <Scrollbar as="main" className="flex-1 p-4 lg:p-8 w-full block bg-slate-50/50">
                    <div className="max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </Scrollbar>
            </div>
        </div>
    );
};

export default DashboardLayout;
