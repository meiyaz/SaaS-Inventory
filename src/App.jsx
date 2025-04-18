import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
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
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role || 'TECHNICIAN')) {
        return <Navigate to="/dashboard" replace />;
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
                    <Route path="/" element={<LandingPage />} />
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
                        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><Dashboard /></ProtectedRoute>} />
                        <Route path="projects" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><Projects /></ProtectedRoute>} />
                        <Route path="projects/:projectId/bom" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><BOM /></ProtectedRoute>} />
                        <Route path="projects/:projectId/pricing" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Pricing /></ProtectedRoute>} />
                        <Route path="clients" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Clients /></ProtectedRoute>} />
                        <Route path="suppliers" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Suppliers /></ProtectedRoute>} />
                        <Route path="categories" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Categories /></ProtectedRoute>} />
                        <Route path="inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><Products /></ProtectedRoute>} />
                        <Route path="inventory/import" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><ProductImport /></ProtectedRoute>} />
                        <Route path="inventory/in" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><StockIn /></ProtectedRoute>} />
                        <Route path="inventory/out" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><StockOut /></ProtectedRoute>} />
                        <Route path="inventory/logs" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><StockLogs /></ProtectedRoute>} />
                        <Route path="billing" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Quotations /></ProtectedRoute>} />
                        <Route path="billing/quotation/new/:projectId" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><QuotationBuilder /></ProtectedRoute>} />
                        <Route path="billing/quotation/:quoteId" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><QuotationPrint /></ProtectedRoute>} />
                        <Route path="billing/quotation/:quoteId/print" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><QuotationPrint /></ProtectedRoute>} />
                        <Route path="amc" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><AMC /></ProtectedRoute>} />
                        <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Reports /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><Settings /></ProtectedRoute>} />
                    </Route>

                    {/* Fallback routing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
