import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          className={`
            w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
            text-slate-900 placeholder-slate-400
            focus:border-synapse-500 focus:ring-2 focus:ring-synapse-200 focus:outline-none
            transition-all duration-200
            disabled:bg-slate-50 disabled:text-slate-500
            ${error ? 'border-red-500 focus:ring-red-200' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};