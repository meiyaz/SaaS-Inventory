import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom Select — drop-in replacement for native <select>.
 * Props: value, onChange(value), options=[{value,label}], placeholder, className, disabled
 */
const Select = ({ value, onChange, options = [], placeholder = 'Select…', className = '', disabled = false }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-white border rounded-lg transition-colors
                    ${open ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300 hover:border-slate-400'}
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}
                    focus:outline-none`}
            >
                <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
                    {selected?.label || placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-[200] mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <ul className="max-h-56 overflow-y-auto py-1">
                        {options.map(opt => (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors
                                        ${opt.value === value
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {opt.label}
                                    {opt.value === value && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Select;
