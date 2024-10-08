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

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
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
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="projects/:projectId/bom" element={<BOM />} />
                        <Route path="projects/:projectId/pricing" element={<Pricing />} />
                        <Route path="clients" element={<Clients />} />
                        <Route path="suppliers" element={<Suppliers />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="inventory" element={<Products />} />
                        <Route path="inventory/import" element={<ProductImport />} />
                        <Route path="inventory/in" element={<StockIn />} />
                        <Route path="inventory/out" element={<StockOut />} />
                        <Route path="inventory/logs" element={<StockLogs />} />
                        <Route path="billing" element={<Quotations />} />
                        <Route path="billing/quotation/new/:projectId" element={<QuotationBuilder />} />
                        <Route path="billing/quotation/:quoteId" element={<QuotationPrint />} />
                        <Route path="billing/quotation/:quoteId/print" element={<QuotationPrint />} />
                        <Route path="amc" element={<AMC />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* Fallback routing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
