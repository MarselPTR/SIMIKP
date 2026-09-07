interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination = ({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) => {
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="px-3.5 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161b22] text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-[#0f1f5c] dark:hover:bg-blue-950/40 dark:hover:text-sky-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 dark:disabled:hover:bg-[#161b22] dark:disabled:hover:text-gray-300 transition"
      >
        Previous
      </button>
      {start > 1 && <span className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
            p === currentPage
              ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-sm"
              : "bg-white dark:bg-[#161b22] text-gray-600 dark:text-gray-300 border border-transparent hover:bg-blue-50 hover:text-[#0f1f5c] dark:hover:bg-blue-950/40 dark:hover:text-sky-300"
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">…</span>}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="px-3.5 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161b22] text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-[#0f1f5c] dark:hover:bg-blue-950/40 dark:hover:text-sky-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 dark:disabled:hover:bg-[#161b22] dark:disabled:hover:text-gray-300 transition"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
