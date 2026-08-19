const Table = ({ columns, data, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className={`px-4 py-3 text-left ${col.className || ''}`}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">📭</span>
                <p>Tidak ada data</p>
              </div>
            </td>
          </tr>
        ) : (
          data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`px-4 py-3 text-gray-700 ${col.className || ''}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default Table;
