import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const Card = ({ children, className = "", title, subtitle, actions }: CardProps) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 shadow-xs transition-colors ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div>
          {title && <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>}
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export default Card;
