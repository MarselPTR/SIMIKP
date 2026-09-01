import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductionReport, exportReportExcel, exportReportPdf } from "../../lib/reports-api";
import type { ReportFilterParams, ReportRowData } from "../../lib/reports-api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  FileSpreadsheet, FileText, Calendar, Filter, Loader2, RefreshCw,
  LayoutGrid, Table, User, Clock, Tag, ChevronRight, X, Briefcase
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const QUARTERS = [
  { value: 1, label: "Triwulan I (Jan - Mar)" },
  { value: 2, label: "Triwulan II (Apr - Jun)" },
  { value: 3, label: "Triwulan III (Jul - Sep)" },
  { value: 4, label: "Triwulan IV (Okt - Des)" },
];

// Short label helper for compact table view
const getShortCtLabel = (ct: string) => {
  const u = ct.toUpperCase();
  if (u.includes("INFOGRAFIS") || u.includes("FLYER")) return "Info";
  if (u.includes("AUDIO")) return "Audio";
  if (u.includes("VIDEO")) return "Video";
  if (u.includes("FOTO")) return "Foto";
  if (u.includes("BUMPER")) return "Bumper";
  if (u.includes("NASKAH")) return "Naskah";
  return ct;
};

const LaporanPage = () => {
  const { addToast } = useToast();
  
  // Display View Mode: "cards" (default) or "table"
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Selected Activity for Detail Modal
  const [selectedActivity, setSelectedActivity] = useState<ReportRowData | null>(null);

  // Filter states
  const [filterMode, setFilterMode] = useState<"month" | "quarter" | "range">("month");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-indexed
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Construct active filter object
  const activeParams: ReportFilterParams = {
    year: selectedYear,
    month: filterMode === "month" ? selectedMonth : undefined,
    quarter: filterMode === "quarter" ? selectedQuarter : undefined,
    startDate: filterMode === "range" ? startDate : undefined,
    endDate: filterMode === "range" ? endDate : undefined,
  };

  // Fetch report matrix data
  const { data: reportData, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-production", activeParams],
    queryFn: () => getProductionReport(activeParams),
  });

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportReportExcel(activeParams);
      addToast("File laporan Excel (.xlsx) berhasil diunduh.", "success");
    } catch (error: any) {
      addToast(error.message || "Terjadi kesalahan saat mengunduh Excel", "error");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportReportPdf(activeParams);
      addToast("File laporan PDF (.pdf) dibuka di jendela baru.", "success");
    } catch (error: any) {
      addToast(error.message || "Terjadi kesalahan saat membuat PDF", "error");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-5 max-w-full min-w-0 pb-12">
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Produksi Konten</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Rekapitulasi kegiatan & penugasan tim per isu strategis dan jenis konten.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Switcher Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200 text-xs">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "cards"
                  ? "bg-white text-indigo-700 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Kegiatan</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white text-indigo-700 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Pratinjau Tabel</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium"
            onClick={handleExportExcel}
            disabled={isExportingExcel || isLoading}
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            )}
            Ekspor Excel (.xlsx)
          </Button>

          <Button
            variant="default"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isLoading}
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 mr-1.5" />
            )}
            Cetak / Ekspor PDF
          </Button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <Card className="p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <span>Filter Periode Laporan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Filter Mode Selector */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Tipe Periode</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="month">Per Bulan</option>
              <option value="quarter">Per Triwulan (Quarter)</option>
              <option value="range">Rentang Tanggal Custom</option>
            </select>
          </div>

          {/* Year Selector */}
          {filterMode !== "range" && (
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Selector */}
          {filterMode === "month" && (
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quarter Selector */}
          {filterMode === "quarter" && (
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Triwulan</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {QUARTERS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Date Range */}
          {filterMode === "range" && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="py-1.5 px-3 flex items-center gap-1 text-gray-600 text-xs"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Headline Stats */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-3.5 bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Total Kegiatan</p>
                <p className="text-2xl font-extrabold text-indigo-950 mt-0.5">{reportData.rows.length}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{reportData.periodeTitle}</p>
              </div>
              <div className="p-2.5 bg-indigo-100/60 text-indigo-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-3.5 bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Total Produksi Konten</p>
                <p className="text-2xl font-extrabold text-emerald-950 mt-0.5">{reportData.totalProduksiKeseluruhan}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Item media diproduksi</p>
              </div>
              <div className="p-2.5 bg-emerald-100/60 text-emerald-600 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-3.5 bg-gradient-to-br from-slate-50 to-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Isu Strategis Aktif</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{reportData.issues.length}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[160px]">{reportData.issues.join(", ")}</p>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading ? (
        <Card className="py-12 text-center text-gray-500 flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">Memuat data laporan kegiatan...</p>
        </Card>
      ) : isError || !reportData ? (
        <Card className="py-10 text-center text-red-500">
          <p className="text-xs font-medium">Gagal memuat data laporan.</p>
          <Button variant="outline" size="sm" className="mt-2 text-xs py-1" onClick={() => refetch()}>
            Coba Lagi
          </Button>
        </Card>
      ) : reportData.rows.length === 0 ? (
        <Card className="py-14 text-center text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-xs font-medium text-gray-600">Tidak ada kegiatan/produksi pada periode ini.</p>
          <p className="text-[11px] text-gray-400 mt-1">Coba ubah filter bulan atau tahun di atas.</p>
        </Card>
      ) : viewMode === "cards" ? (
        /* GRID CARDS VIEW (PRIMARY VIEW MODE) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reportData.rows.map((row) => (
            <div
              key={row.id}
              onClick={() => setSelectedActivity(row)}
              className="bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700">
                      <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                      {row.tanggal}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 bg-slate-50 px-2 py-0.5 rounded border border-gray-200">
                      {row.noStrakom}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {row.jumlahProduksi} Produksi
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                  {row.judul}
                </h3>

                {/* Isu Strategis Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {row.issues.map((issue) => (
                    <span
                      key={issue}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      <Tag className="w-2.5 h-2.5 mr-1" />
                      {issue}
                    </span>
                  ))}
                </div>

                {/* Assigned Personnel Summary */}
                <div className="border-t border-gray-100 pt-2.5 mt-2 space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    Tim & Penugasan ({row.assignmentsList.length}):
                  </p>

                  <div className="space-y-1">
                    {row.assignmentsList.slice(0, 3).map((asgn) => (
                      <div key={asgn.id} className="flex items-center justify-between text-xs text-gray-700 bg-gray-50/80 px-2 py-1 rounded">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-medium truncate">{asgn.userName}</span>
                          {asgn.staffType && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-semibold">
                              {asgn.staffType}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium shrink-0 ml-2">
                          {asgn.contentTypeName}
                        </span>
                      </div>
                    ))}

                    {row.assignmentsList.length > 3 && (
                      <p className="text-[10px] text-indigo-600 font-medium pt-0.5">
                        +{row.assignmentsList.length - 3} penugasan lainnya...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Lihat Detail Penugasan</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE MATRIX PREVIEW VIEW (OPTIONAL) */
        <Card className="p-0 shadow-sm border border-gray-200 overflow-hidden min-w-0">
          <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">
                Matriks Laporan Produksi Konten ({reportData?.periodeTitle || "..."})
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Pratinjau struktur tabel sesuai format ekspor resmi Excel & PDF.
              </p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th rowSpan={3} className="px-2 py-1.5 text-center border-r border-slate-300 w-8">NO</th>
                  <th rowSpan={3} className="px-2 py-1.5 text-center border-r border-slate-300 w-20">Tanggal</th>
                  <th rowSpan={3} className="px-2 py-1.5 text-center border-r border-slate-300 w-24">No Strakom</th>
                  <th rowSpan={3} className="px-2 py-1.5 text-left border-r border-slate-300 min-w-[160px]">Judul Kegiatan</th>
                  
                  <th
                    colSpan={reportData.issues.length * reportData.contentTypes.length}
                    className="px-2 py-1 text-center border-r border-slate-300 bg-slate-200/90 uppercase tracking-wider text-[11px]"
                  >
                    Isu Strategis
                  </th>
                  
                  <th rowSpan={3} className="px-2 py-1.5 text-center bg-slate-200 text-slate-900 border-l border-slate-300 w-20 font-extrabold leading-tight">
                    Jumlah<br />Produksi
                  </th>
                </tr>

                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  {reportData.issues.map((issue) => (
                    <th
                      key={issue}
                      colSpan={reportData.contentTypes.length}
                      className="px-1.5 py-1 text-center border-r border-slate-300 bg-slate-100 text-indigo-900 uppercase text-[10px]"
                    >
                      {issue}
                    </th>
                  ))}
                </tr>

                <tr className="bg-slate-50 text-slate-600 font-medium border-b border-slate-300">
                  {reportData.issues.map((issue) =>
                    reportData.contentTypes.map((ct) => (
                      <th
                        key={`${issue}-${ct}`}
                        className="px-1 py-1 text-center border-r border-slate-200 text-[10px] whitespace-nowrap min-w-[32px]"
                        title={ct}
                      >
                        {getShortCtLabel(ct)}
                      </th>
                    ))
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {reportData.rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedActivity(row)}
                    className={`cursor-pointer ${idx % 2 === 0 ? "bg-white hover:bg-indigo-50/50" : "bg-slate-50/30 hover:bg-indigo-50/50"}`}
                  >
                    <td className="px-2 py-1.5 text-center border-r border-gray-200 font-medium text-gray-500">{row.no}</td>
                    <td className="px-2 py-1.5 text-center border-r border-gray-200 text-gray-600 whitespace-nowrap">{row.tanggal}</td>
                    <td className="px-2 py-1.5 text-center border-r border-gray-200 text-gray-700 font-mono text-[10px]">{row.noStrakom}</td>
                    <td className="px-2 py-1.5 border-r border-gray-200 font-medium text-gray-900 max-w-[220px] truncate" title={row.judul}>
                      {row.judul}
                    </td>

                    {reportData.issues.map((issue) =>
                      reportData.contentTypes.map((ct) => {
                        const count = row.matrix[issue]?.[ct] || 0;
                        return (
                          <td
                            key={`${row.id}-${issue}-${ct}`}
                            className={`px-1 py-1.5 text-center border-r border-gray-200 ${
                              count > 0 ? "font-bold text-indigo-700 bg-indigo-50/60" : "text-gray-300"
                            }`}
                          >
                            {count > 0 ? count : "-"}
                          </td>
                        );
                      })
                    )}

                    <td className="px-2 py-1.5 text-center font-bold text-gray-900 bg-slate-100/60 border-l border-gray-300">
                      {row.jumlahProduksi}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td colSpan={4} className="px-3 py-2 text-center border-r border-slate-300 uppercase tracking-wider text-[10px]">
                    Total Produksi
                  </td>

                  {reportData.issues.map((issue) =>
                    reportData.contentTypes.map((ct) => {
                      const colSum = reportData.columnTotals[issue]?.[ct] || 0;
                      return (
                        <td key={`sum-${issue}-${ct}`} className="px-1 py-2 text-center border-r border-slate-300 text-indigo-900 text-[11px]">
                          {colSum > 0 ? colSum : 0}
                        </td>
                      );
                    })
                  )}

                  <td className="px-2 py-2 text-center bg-slate-300 text-indigo-950 font-extrabold text-xs">
                    {reportData.totalProduksiKeseluruhan}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* ACTIVITY DETAIL & ASSIGNMENTS MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 text-indigo-800">
                    {selectedActivity.activityCode}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    Strakom: {selectedActivity.noStrakom}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {selectedActivity.judul}
                </h3>
              </div>

              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Activity Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/60 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase">Tanggal Kegiatan</p>
                  <p className="font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {selectedActivity.tanggal}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase">Isu Strategis</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {selectedActivity.issues.map((issue) => (
                      <span key={issue} className="font-bold text-indigo-900">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase">Total Konten</p>
                  <p className="font-extrabold text-indigo-950 mt-0.5">
                    {selectedActivity.jumlahProduksi} Items Diproduksi
                  </p>
                </div>
              </div>

              {/* Detailed Assignments & Team Section */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Daftar Penugasan Tim per Bidang ({selectedActivity.assignmentsList.length})
                </h4>

                {selectedActivity.assignmentsList.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                    Belum ada tugas/personel yang didaftarkan untuk kegiatan ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedActivity.assignmentsList.map((asgn) => (
                      <div
                        key={asgn.id}
                        className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 transition-colors shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {asgn.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-gray-900">{asgn.userName}</span>
                                {asgn.staffType && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                                    Bidang: {asgn.staffType}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500">
                                Jenis Konten: <span className="font-semibold text-gray-700">{asgn.contentTypeName}</span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              asgn.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : asgn.status === "IN_PROGRESS"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {asgn.status}
                          </span>
                        </div>

                        {asgn.instruction && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg mt-2 text-[11px] border border-gray-100">
                            <span className="font-semibold text-gray-700">Instruksi:</span> {asgn.instruction}
                          </div>
                        )}

                        {asgn.deadline && (
                          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            Deadline: {asgn.deadline}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-4"
                onClick={() => setSelectedActivity(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanPage;
