import Button from "../ui/Button";

type SpinnerSize = "sm" | "md" | "lg";

const spinnerSizes: Record<SpinnerSize, string> = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export const LoadingSpinner = ({
  size = "md",
  text,
}: {
  size?: SpinnerSize;
  text?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <div
      className={`${spinnerSizes[size]} border-4 border-gray-200 dark:border-gray-700 border-t-[#0f1f5c] dark:border-t-sky-400 rounded-full animate-spin`}
    />
    {text && (
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 animate-pulse">
        {text}
      </p>
    )}
  </div>
);

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
}

export const EmptyState = ({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia.",
  icon = "📭",
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">{icon}</span>
    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
  </div>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message = "Terjadi kesalahan", onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">⚠️</span>
    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">Terjadi Kesalahan</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
    {onRetry && (
      <Button variant="outline" className="mt-4 cursor-pointer" onClick={onRetry}>
        Coba Lagi
      </Button>
    )}
  </div>
);
