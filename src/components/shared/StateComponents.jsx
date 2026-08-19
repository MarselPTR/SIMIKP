import Button from '../ui/Button';

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizes[size] ?? sizes.md} border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin`}
      />
    </div>
  );
};

export const EmptyState = ({
  title = 'Tidak ada data',
  description = 'Belum ada data yang tersedia.',
  icon = '📭',
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">{icon}</span>
    <h4 className="text-lg font-medium text-gray-900">{title}</h4>
    <p className="text-sm text-gray-500 mt-1">{description}</p>
  </div>
);

export const ErrorState = ({ message = 'Terjadi kesalahan', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">⚠️</span>
    <h4 className="text-lg font-medium text-gray-900">Terjadi Kesalahan</h4>
    <p className="text-sm text-gray-500 mt-1">{message}</p>
    {onRetry && (
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Coba Lagi
      </Button>
    )}
  </div>
);
