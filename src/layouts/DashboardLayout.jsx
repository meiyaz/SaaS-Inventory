import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    BarChart3
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, role, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    let navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
        { name: 'Projects', icon: FolderKanban, path: '/projects', roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
        { name: 'Billing', icon: FileText, path: '/billing', roles: ['ADMIN', 'MANAGER'] },
        { name: 'AMC', icon: ShieldCheck, path: '/amc', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Clients', icon: Users, path: '/clients', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Suppliers', icon: Truck, path: '/suppliers', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Categories', icon: Tags, path: '/categories', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Inventory Master', icon: Package, path: '/inventory', roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
        { name: 'Stock Inward', icon: ArrowDownToLine, path: '/inventory/in', isSub: true, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
        { name: 'Stock Outward', icon: ArrowUpRight, path: '/inventory/out', isSub: true, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
        { name: 'Stock Logs', icon: History, path: '/inventory/logs', isSub: true, roles: ['ADMIN', 'MANAGER', 'TECHNICIAN'] },
        { name: 'Settings', icon: Settings, path: '/settings', roles: ['ADMIN'] },
    ];

    navItems = navItems.filter(item => item.roles.includes(role || 'TECHNICIAN'));

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-screen transition-all duration-300">
            <div className="p-6 flex items-center justify-center border-b border-slate-800 shrink-0">
                <h1 className="text-xl font-bold tracking-wider text-blue-400">STOCK SIGHT</h1>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center py-2.5 rounded-lg transition-colors ${item.isSub ? 'ml-6 px-3 text-sm border-l border-slate-700' : 'px-4'
                                } ${isActive
                                    ? 'bg-blue-600/90 text-white shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <Icon className={`${item.isSub ? 'w-4 h-4 mr-2 text-slate-400' : 'w-5 h-5 mr-3'} ${/* dynamic color on active handled by parent text color */ ''}`} />
                            <span className={item.isSub ? 'font-normal' : 'font-medium'}>{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="flex items-center px-4 py-3 mb-2 rounded-lg bg-slate-800">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold mr-3 uppercase">
                        {user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate capitalize">{role ? role.toLowerCase() : 'User'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email || 'Loading...'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-slate-800 hover:text-red-300 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
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
