import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Usage: (manage state in parent)
 * const [confirm, setConfirm] = useState(null);
 * setConfirm({ message: '...', onConfirm: () => doSomething() });
 * <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
 */
const ConfirmModal = ({ config, onClose }) => {
    if (!config) return null;

    const { message, onConfirm, confirmLabel = 'Confirm', danger = false } = config;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9998]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
                            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm mb-1">Are you sure?</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 pb-5 flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleConfirm}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
