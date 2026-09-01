import type { ReactNode } from "react";

export interface TableColumn<T> {
  key: keyof T & string;
  label: string;
  className?: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
}

function Table<T extends { id: string | number }>({ columns, data, className = "" }: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] ${className}`}>
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-[#0f1f5c] dark:bg-slate-900 text-xs font-bold uppercase text-white border-b border-gray-200 dark:border-gray-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3.5 text-left text-white ${col.className ?? ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-xs font-semibold">Tidak ada data</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${col.className ?? ""}`}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
