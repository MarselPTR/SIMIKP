import { useEffect, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogSize = "sm" | "md" | "lg" | "xl";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: DialogSize;
}

const sizes: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Dialog = ({ open, onClose, title, children, actions, size = "md" }: DialogProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative ${sizes[size]} w-full bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors`}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/40">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto flex-1 overscroll-contain text-gray-900 dark:text-gray-100">{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/80 dark:bg-gray-900/60 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
