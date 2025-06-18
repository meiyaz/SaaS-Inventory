import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
};

const BG = {
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50',
};

let _id = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm text-slate-800 pointer-events-auto animate-in slide-in-from-right-2 fade-in duration-200 ${BG[t.type]}`}>
                        {ICONS[t.type]}
                        <span className="flex-1 leading-snug">{t.message}</span>
                        <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600 mt-0.5">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
