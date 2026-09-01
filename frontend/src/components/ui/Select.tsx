import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, options = [], error, placeholder = "Pilih...", ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <select
        ref={ref}
        className={`w-full rounded-xl border ${
          error ? "border-rose-500" : "border-gray-200 dark:border-gray-700"
        } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-xs sm:text-sm transition-all focus:border-[#0f1f5c] dark:focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]/20 dark:focus:ring-sky-500/20 disabled:bg-gray-100 dark:disabled:bg-gray-800 ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  ),
);

Select.displayName = "Select";

export default Select;
