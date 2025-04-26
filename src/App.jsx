import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Projects from './pages/Projects';
import Categories from './pages/Categories';
import Products from './pages/Products';
import BOM from './pages/BOM';
import Pricing from './pages/Pricing';
import Quotations from './pages/Quotations';
import QuotationBuilder from './pages/QuotationBuilder';
import QuotationPrint from './pages/QuotationPrint';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import StockLogs from './pages/StockLogs';
import AMC from './pages/AMC';
import Settings from './pages/Settings';
import ProductImport from './pages/ProductImport';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, requiredPermission, allowedRoles }) => {
    const { user, role, permissions, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role-based fallback (for legacy mapping)
    if (allowedRoles && !allowedRoles.includes(role || 'TECHNICIAN')) {
        return <Navigate to="/dashboard" replace />;
    }

    // Dynamic Permission check
    if (requiredPermission && role !== 'ADMIN') {
        if (!permissions || !permissions.includes(requiredPermission)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

// Placeholder components for the dashboard routes
const DashboardHome = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Overview</h2>
        <p className="text-slate-600">Welcome back! Authentication is now live via Supabase.</p>
    </div>
);

const PlaceholderView = ({ title }) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title} Management</h2>
        <p className="text-slate-500 text-sm">Module is currently under construction.</p>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected Admin Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="dashboard" element={<ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute>} />
                        <Route path="projects" element={<ProtectedRoute requiredPermission="projects"><Projects /></ProtectedRoute>} />
                        <Route path="projects/:projectId/bom" element={<ProtectedRoute requiredPermission="projects"><BOM /></ProtectedRoute>} />
                        <Route path="projects/:projectId/pricing" element={<ProtectedRoute requiredPermission="projects"><Pricing /></ProtectedRoute>} />
                        <Route path="clients" element={<ProtectedRoute requiredPermission="clients"><Clients /></ProtectedRoute>} />
                        <Route path="suppliers" element={<ProtectedRoute requiredPermission="suppliers"><Suppliers /></ProtectedRoute>} />
                        <Route path="categories" element={<ProtectedRoute requiredPermission="categories"><Categories /></ProtectedRoute>} />
                        <Route path="products" element={<ProtectedRoute requiredPermission="products"><Products /></ProtectedRoute>} />
                        <Route path="products/import" element={<ProtectedRoute requiredPermission="products_import"><ProductImport /></ProtectedRoute>} />
                        <Route path="products/in" element={<ProtectedRoute requiredPermission="products_in"><StockIn /></ProtectedRoute>} />
                        <Route path="products/out" element={<ProtectedRoute requiredPermission="products_out"><StockOut /></ProtectedRoute>} />
                        <Route path="products/logs" element={<ProtectedRoute requiredPermission="products_logs"><StockLogs /></ProtectedRoute>} />
                        <Route path="billing" element={<ProtectedRoute requiredPermission="billing"><Quotations /></ProtectedRoute>} />
                        <Route path="billing/quotation/new" element={<ProtectedRoute requiredPermission="billing"><QuotationBuilder /></ProtectedRoute>} />
                        <Route path="billing/quotation/new/:projectId" element={<ProtectedRoute requiredPermission="billing"><QuotationBuilder /></ProtectedRoute>} />
                        <Route path="billing/quotation/:quoteId" element={<ProtectedRoute requiredPermission="billing"><QuotationPrint /></ProtectedRoute>} />
                        <Route path="billing/quotation/:quoteId/print" element={<ProtectedRoute requiredPermission="billing"><QuotationPrint /></ProtectedRoute>} />
                        <Route path="amc" element={<ProtectedRoute requiredPermission="amc"><AMC /></ProtectedRoute>} />
                        <Route path="reports" element={<ProtectedRoute requiredPermission="reports"><Reports /></ProtectedRoute>} />
                        <Route path="tasks" element={<ProtectedRoute requiredPermission="tasks"><Tasks /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute requiredPermission="settings"><Settings /></ProtectedRoute>} />
                    </Route>

                    {/* Fallback routing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
