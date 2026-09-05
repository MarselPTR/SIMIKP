import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "info" | "success" | "error" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = ((globalThis as unknown as { __SIMIKP_TOAST_CTX__?: React.Context<ToastContextValue | null> })
  .__SIMIKP_TOAST_CTX__ ??= createContext<ToastContextValue | null>(null));

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      addToast: () => {},
    };
  }
  return ctx;
};

const TOAST_CONFIG: Record<
  ToastType,
  {
    borderColor: string;
    accentBar: string;
    iconBg: string;
    iconColor: string;
    badgeTitle: string;
    Icon: typeof CheckCircle2;
  }
> = {
  success: {
    borderColor: "border-emerald-200/90 dark:border-emerald-500/30",
    accentBar: "bg-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 ring-emerald-500/25",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeTitle: "Berhasil",
    Icon: CheckCircle2,
  },
  error: {
    borderColor: "border-rose-200/90 dark:border-rose-500/30",
    accentBar: "bg-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-950/60 ring-rose-500/25",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeTitle: "Pemberitahuan",
    Icon: XCircle,
  },
  warning: {
    borderColor: "border-amber-200/90 dark:border-amber-500/30",
    accentBar: "bg-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/60 ring-amber-500/25",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeTitle: "Perhatian",
    Icon: AlertTriangle,
  },
  info: {
    borderColor: "border-blue-200/90 dark:border-blue-500/30",
    accentBar: "bg-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/60 ring-blue-500/25",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeTitle: "Informasi",
    Icon: Info,
  },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = Date.now() + Math.random();
      const createdAt = Date.now();
      setToasts((prev) => [...prev, { id, message, type, duration, createdAt }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Notification Container for Mobile & Desktop */}
      <div
        aria-live="polite"
        className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:top-6 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-auto pointer-events-none transition-all"
      >
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.type];
          const Icon = config.Icon;

          return (
            <div
              key={toast.id}
              role="status"
              className={`relative overflow-hidden rounded-2xl border backdrop-blur-md shadow-xl bg-white/95 dark:bg-[#1c2128]/95 ${config.borderColor} p-3.5 sm:p-4 text-gray-800 dark:text-gray-100 flex items-start gap-3.5 transition-all duration-200 animate-in fade-in slide-in-from-top-3 sm:slide-in-from-right-4 pointer-events-auto group`}
            >
              {/* Left subtle accent indicator line */}
              <div className={`absolute top-0 bottom-0 left-0 w-1 ${config.accentBar}`} />

              {/* Status Icon Badge with ring highlight */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 shadow-2xs ${config.iconBg} ${config.iconColor}`}
              >
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </div>

              {/* Toast Message Body */}
              <div className="flex-1 min-w-0 pr-1 pt-0.5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                  {config.badgeTitle}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              {/* Close Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-lg transition-colors cursor-pointer shrink-0 -mr-1"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Dynamic Bottom Progress Timer Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gray-100 dark:bg-gray-800/60 overflow-hidden">
                <div
                  className={`h-full ${config.accentBar} opacity-60 animate-toast-progress origin-left`}
                  style={{ animationDuration: `${toast.duration}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
