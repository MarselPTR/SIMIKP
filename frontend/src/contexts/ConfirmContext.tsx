import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = ((globalThis as unknown as { __SIMIKP_CONFIRM_CTX__?: React.Context<ConfirmContextValue | null> })
  .__SIMIKP_CONFIRM_CTX__ ??= createContext<ConfirmContextValue | null>(null));

export const useConfirm = (): ((options: ConfirmOptions | string) => Promise<boolean>) => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (options: ConfirmOptions | string) => {
      const msg = typeof options === "string" ? options : options.message;
      return window.confirm(msg);
    };
  }
  return async (options: ConfirmOptions | string) => {
    if (typeof options === "string") {
      return ctx.confirm({ message: options });
    }
    return ctx.confirm(options);
  };
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOptions, setDialogOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogOptions(options);
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  // Keyboard navigation: Enter to confirm, Escape to cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const variant = dialogOptions?.variant || "danger";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isOpen && dialogOptions && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-all duration-200 animate-in fade-in"
          onClick={() => handleClose(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white dark:bg-[#1c2128] rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-7 overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top subtle glow line based on variant */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                variant === "danger"
                  ? "bg-gradient-to-r from-rose-500 to-red-600"
                  : variant === "warning"
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
              }`}
            />

            {/* Close X button */}
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              {/* Icon badge */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-8 shadow-xs ${
                  variant === "danger"
                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-rose-50/60 dark:ring-rose-950/30"
                    : variant === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-amber-50/60 dark:ring-amber-950/30"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-blue-50/60 dark:ring-blue-950/30"
                }`}
              >
                {variant === "danger" ? (
                  <Trash2 className="w-6 h-6" strokeWidth={2} />
                ) : variant === "warning" ? (
                  <AlertTriangle className="w-6 h-6" strokeWidth={2} />
                ) : (
                  <Info className="w-6 h-6" strokeWidth={2} />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  {dialogOptions.title || (
                    variant === "danger"
                      ? (language === "en" ? "Confirm Action" : "Konfirmasi Tindakan")
                      : variant === "warning"
                      ? (language === "en" ? "Warning" : "Peringatan")
                      : (language === "en" ? "Information" : "Informasi")
                  )}
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-0 sm:pl-16 mb-6">
              {dialogOptions.message}
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 font-semibold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer shadow-2xs text-center"
              >
                {dialogOptions.cancelText || (language === "en" ? "Cancel" : "Batal")}
              </button>

              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm transition cursor-pointer shadow-md text-center active:scale-95 ${
                  variant === "danger"
                    ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/20"
                    : variant === "warning"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20"
                }`}
              >
                {dialogOptions.confirmText || (
                  variant === "danger"
                    ? (language === "en" ? "Yes, Delete" : "Ya, Hapus")
                    : (language === "en" ? "Confirm" : "Konfirmasi")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
