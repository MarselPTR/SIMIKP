import Button from "../ui/Button";
import { useLanguage } from "../../lib/LanguageContext";

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
  title,
  description,
  icon = "📭",
}: EmptyStateProps) => {
  const { language } = useLanguage();
  const defaultTitle = language === "en" ? "No data found" : "Tidak ada data";
  const defaultDesc = language === "en" ? "No records available right now." : "Belum ada data yang tersedia.";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title || defaultTitle}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description || defaultDesc}</p>
    </div>
  );
};

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  const { language } = useLanguage();
  const defaultTitle = language === "en" ? "An Error Occurred" : "Terjadi Kesalahan";
  const defaultMsg = message || (language === "en" ? "Something went wrong. Please try again." : "Terjadi kesalahan pada sistem.");

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">⚠️</span>
      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{defaultTitle}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{defaultMsg}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4 cursor-pointer" onClick={onRetry}>
          {language === "en" ? "Retry" : "Coba Lagi"}
        </Button>
      )}
    </div>
  );
};
