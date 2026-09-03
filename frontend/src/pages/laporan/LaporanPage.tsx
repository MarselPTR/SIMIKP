import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { useLanguage } from "../../lib/LanguageContext";

const MONTHS_ID = [
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

const MONTHS_EN = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const QUARTERS_ID = [
  { value: 1, label: "Triwulan I (Jan - Mar)" },
  { value: 2, label: "Triwulan II (Apr - Jun)" },
  { value: 3, label: "Triwulan III (Jul - Sep)" },
  { value: 4, label: "Triwulan IV (Okt - Des)" },
];

const QUARTERS_EN = [
  { value: 1, label: "Quarter I (Jan - Mar)" },
  { value: 2, label: "Quarter II (Apr - Jun)" },
  { value: 3, label: "Quarter III (Jul - Sep)" },
  { value: 4, label: "Quarter IV (Oct - Dec)" },
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
  const { t, language } = useLanguage();

  
  const months = language === "en" ? MONTHS_EN : MONTHS_ID;
  const quarters = language === "en" ? QUARTERS_EN : QUARTERS_ID;

  // Display View Mode: "cards" (default) or "table"
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Selected Activity for Detail Modal
  const [selectedActivity, setSelectedActivity] = useState<ReportRowData | null>(null);

  useEffect(() => {
    if (!selectedActivity) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedActivity]);


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
      addToast(language === "en" ? "Excel report (.xlsx) downloaded successfully." : "File laporan Excel (.xlsx) berhasil diunduh.", "success");
    } catch (error: any) {
      addToast(error.message || (language === "en" ? "Failed to download Excel" : "Terjadi kesalahan saat mengunduh Excel"), "error");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportReportPdf(activeParams);
      addToast(language === "en" ? "PDF report (.pdf) opened in a new tab." : "File laporan PDF (.pdf) dibuka di jendela baru.", "success");
    } catch (error: any) {
      addToast(error.message || (language === "en" ? "Failed to generate PDF" : "Terjadi kesalahan saat membuat PDF"), "error");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full min-w-0 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400 tracking-tight">{t("laporan_title")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("laporan_subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Switcher Toggle */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center border border-gray-200 dark:border-gray-700 text-xs">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white dark:bg-[#161b22] text-[#0f1f5c] dark:text-sky-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Activity Cards" : "Card Kegiatan"}</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#161b22] text-[#0f1f5c] dark:text-sky-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Table Preview" : "Pratinjau Tabel"}</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-emerald-600 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold"
            onClick={handleExportExcel}
            disabled={isExportingExcel || isLoading}
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            )}
            {t("laporan_export_excel")} (.xlsx)
          </Button>

          <Button
            variant="default"
            size="sm"
            className="bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#0a1540] dark:hover:bg-blue-700 text-white font-bold"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isLoading}
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 mr-1.5" />
            )}
            {t("laporan_export_pdf")}
          </Button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <Card className="p-4 shadow-xs border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <span>{language === "en" ? "Report Period Filter" : "Filter Periode Laporan"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
              {language === "en" ? "Period Type" : "Tipe Periode"}
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
            >
              <option value="month">{language === "en" ? "Monthly" : "Per Bulan"}</option>
              <option value="quarter">{language === "en" ? "Quarterly" : "Per Triwulan (Quarter)"}</option>
              <option value="range">{language === "en" ? "Custom Date Range" : "Rentang Tanggal Custom"}</option>
            </select>
          </div>

          {filterMode !== "range" && (
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{t("year")}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {language === "en" ? "Year" : "Tahun"} {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === "month" && (
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{t("month")}</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === "quarter" && (
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                {language === "en" ? "Quarter" : "Triwulan"}
              </label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
              >
                {quarters.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === "range" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  {language === "en" ? "Start Date" : "Tanggal Mulai"}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  {language === "en" ? "End Date" : "Tanggal Selesai"}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <Button
              variant="outline"
              size="sm"
              className="py-2 px-3 flex items-center gap-1.5 text-gray-600 dark:text-gray-300 text-xs w-full"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Headline Stats */}
      {reportData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-indigo-50/80 dark:from-blue-950/40 to-white dark:to-[#161b22] border border-indigo-100 dark:border-blue-900/60">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[11px] font-bold text-indigo-600 dark:text-sky-400 uppercase tracking-wider truncate">Total Kegiatan</p>
                <p className="text-lg sm:text-2xl font-black text-indigo-950 dark:text-gray-100 mt-0.5">{reportData.rows.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{reportData.periodeTitle}</p>
              </div>
              <div className="p-2 sm:p-3 bg-indigo-100/60 dark:bg-blue-900/60 text-indigo-600 dark:text-sky-300 rounded-xl shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50/80 dark:from-emerald-950/40 to-white dark:to-[#161b22] border border-emerald-100 dark:border-emerald-900/60">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">Total Produksi Konten</p>
                <p className="text-lg sm:text-2xl font-black text-emerald-950 dark:text-gray-100 mt-0.5">{reportData.totalProduksiKeseluruhan}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">Item media diproduksi</p>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-100/60 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-xl shrink-0">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 dark:from-slate-900/40 to-white dark:to-[#161b22] border border-slate-200 dark:border-gray-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[11px] font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider truncate">Isu Strategis Aktif</p>
                <p className="text-lg sm:text-2xl font-black text-slate-800 dark:text-gray-100 mt-0.5">{reportData.issues.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{reportData.issues.join(", ")}</p>
              </div>
              <div className="p-2 sm:p-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-xl shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading ? (
        <Card className="py-12 text-center text-gray-500 flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#0f1f5c] dark:text-sky-400 mb-2" />
          <p className="text-xs">Memuat data laporan kegiatan...</p>
        </Card>
      ) : isError || !reportData ? (
        <Card className="py-10 text-center text-rose-500">
          <p className="text-xs font-bold">Gagal memuat data laporan.</p>
          <Button variant="outline" size="sm" className="mt-2 text-xs py-1" onClick={() => refetch()}>
            Coba Lagi
          </Button>
        </Card>
      ) : reportData.rows.length === 0 ? (
        <Card className="py-14 text-center text-gray-400 dark:text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Tidak ada kegiatan/produksi pada periode ini.</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Coba ubah filter bulan atau tahun di atas.</p>
        </Card>
      ) : viewMode === "cards" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {reportData.rows.map((row) => (
            <div
              key={row.id}
              onClick={() => setSelectedActivity(row)}
              className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-sky-500 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-w-0"
            >
              <div className="min-w-0">
                {/* Header Badge */}
                <div className="flex items-center flex-wrap justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0">
                      <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                      {row.tanggal}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800/80 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 truncate max-w-[5.5rem] sm:max-w-[9rem]">
                      {row.noStrakom}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    {row.jumlahProduksi} Produksi
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 mb-2">
                  {row.judul}
                </h3>

                {/* Isu Strategis Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {row.issues.map((issue) => (
                    <span
                      key={issue}
                      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-sky-300 border border-indigo-100 dark:border-indigo-900/60"
                    >
                      <Tag className="w-2.5 h-2.5 mr-1" />
                      {issue}
                    </span>
                  ))}
                </div>

                {/* Assigned Personnel Summary */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5 mt-2 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    Tim &amp; Penugasan ({row.assignmentsList.length}):
                  </p>

                  <div className="space-y-1">
                    {row.assignmentsList.slice(0, 3).map((asgn) => (
                      <div key={asgn.id} className="flex items-center justify-between gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/60 px-2 py-1 rounded-lg">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold truncate min-w-0">{asgn.userName}</span>
                          {asgn.staffType && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-sky-300 font-bold shrink-0">
                              {asgn.staffType}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium shrink-0 truncate max-w-[35%]">
                          {asgn.contentTypeName}
                        </span>
                      </div>
                    ))}

                    {row.assignmentsList.length > 3 && (
                      <p className="text-[10px] text-indigo-600 dark:text-sky-400 font-bold pt-0.5">
                        +{row.assignmentsList.length - 3} penugasan lainnya...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-4 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-indigo-600 dark:text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform">
                <span>Lihat Detail Penugasan</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE MATRIX PREVIEW VIEW */
        <Card className="p-0 shadow-xs border border-gray-200 dark:border-gray-800 overflow-hidden min-w-0">
          <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                Matriks Laporan Produksi Konten ({reportData?.periodeTitle || "..."})
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Pratinjau struktur tabel sesuai format ekspor resmi Excel &amp; PDF.
              </p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-gray-200 font-bold border-b border-slate-300 dark:border-gray-700">
                  <th rowSpan={3} className="px-2 py-1.5 text-center border-r border-slate-300 dark:border-gray-700 w-8">NO</th>
                  <th rowSpan={3} className="px-2 py-1.5 text-center border-r border-slate-300 dark:border-gray-700 w-20">Tanggal</th>
                  <th rowSpan={3} className="px-2 py-1.5 text-center border-r border-slate-300 dark:border-gray-700 w-24">No Strakom</th>
                  <th rowSpan={3} className="px-2 py-1.5 text-left border-r border-slate-300 dark:border-gray-700 min-w-[150px]">Judul Kegiatan</th>
                  <th rowSpan={3} className="px-2 py-1.5 text-left border-r border-slate-300 dark:border-gray-700 min-w-[150px]">Petugas Pelaksana</th>
                  
                  <th
                    colSpan={reportData.issues.length * reportData.contentTypes.length}
                    className="px-2 py-1 text-center border-r border-slate-300 dark:border-gray-700 bg-slate-200/90 dark:bg-slate-800 uppercase tracking-wider text-[11px]"
                  >
                    Isu Strategis
                  </th>
                  
                  <th rowSpan={3} className="px-2 py-1.5 text-center bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-gray-100 border-l border-slate-300 dark:border-gray-700 w-20 font-extrabold leading-tight">
                    Jumlah<br />Produksi
                  </th>
                </tr>

                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-gray-200 font-bold border-b border-slate-300 dark:border-gray-700">
                  {reportData.issues.map((issue) => (
                    <th
                      key={issue}
                      colSpan={reportData.contentTypes.length}
                      className="px-1.5 py-1 text-center border-r border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-slate-900 text-indigo-900 dark:text-sky-300 uppercase text-[10px]"
                    >
                      {issue}
                    </th>
                  ))}
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-gray-400 font-medium border-b border-slate-300 dark:border-gray-700">
                  {reportData.issues.map((issue) =>
                    reportData.contentTypes.map((ct) => (
                      <th
                        key={`${issue}-${ct}`}
                        className="px-1 py-1 text-center border-r border-slate-200 dark:border-gray-800 text-[10px] whitespace-nowrap min-w-[32px]"
                        title={ct}
                      >
                        {getShortCtLabel(ct)}
                      </th>
                    ))
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#161b22] text-gray-800 dark:text-gray-200">
                {reportData.rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedActivity(row)}
                    className={`cursor-pointer ${idx % 2 === 0 ? "bg-white dark:bg-[#161b22] hover:bg-indigo-50/50 dark:hover:bg-gray-800/60" : "bg-slate-50/30 dark:bg-gray-900/30 hover:bg-indigo-50/50 dark:hover:bg-gray-800/60"}`}
                  >
                    <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-800 font-medium text-gray-500 dark:text-gray-400">{row.no}</td>
                    <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 whitespace-nowrap">{row.tanggal}</td>
                    <td className="px-2 py-1.5 text-center border-r border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[10px]">{row.noStrakom}</td>
                    <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-800 font-medium text-gray-900 dark:text-gray-100 max-w-[220px] truncate" title={row.judul}>
                      {row.judul}
                    </td>

                    {reportData.issues.map((issue) =>
                      reportData.contentTypes.map((ct) => {
                        const count = row.matrix[issue]?.[ct] || 0;
                        return (
                          <td
                            key={`${row.id}-${issue}-${ct}`}
                            className={`px-1 py-1.5 text-center border-r border-gray-200 dark:border-gray-800 ${
                              count > 0 ? "font-bold text-indigo-700 dark:text-sky-300 bg-indigo-50/60 dark:bg-blue-950/40" : "text-gray-300 dark:text-gray-700"
                            }`}
                          >
                            {count > 0 ? count : "-"}
                          </td>
                        );
                      })
                    )}

                    <td className="px-2 py-1.5 text-center font-bold text-gray-900 dark:text-gray-100 bg-slate-100/60 dark:bg-gray-800/60 border-l border-gray-300 dark:border-gray-700">
                      {row.jumlahProduksi}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-slate-200 dark:bg-slate-900 font-bold text-slate-900 dark:text-gray-100 border-t-2 border-slate-400 dark:border-gray-700">
                  <td colSpan={4} className="px-3 py-2 text-center border-r border-slate-300 dark:border-gray-700 uppercase tracking-wider text-[10px]">
                    Total Produksi
                  </td>

                  {reportData.issues.map((issue) =>
                    reportData.contentTypes.map((ct) => {
                      const colSum = reportData.columnTotals[issue]?.[ct] || 0;
                      return (
                        <td key={`sum-${issue}-${ct}`} className="px-1 py-2 text-center border-r border-slate-300 dark:border-gray-700 text-indigo-900 dark:text-sky-300 text-[11px]">
                          {colSum > 0 ? colSum : 0}
                        </td>
                      );
                    })
                  )}

                  <td className="px-2 py-2 text-center bg-slate-300 dark:bg-slate-800 text-indigo-950 dark:text-sky-200 font-black text-xs">
                    {reportData.totalProduksiKeseluruhan}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* ACTIVITY DETAIL & ASSIGNMENTS MODAL */}
      {selectedActivity && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="my-auto bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 dark:bg-blue-950 text-indigo-800 dark:text-sky-300">
                    {selectedActivity.activityCode}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    Strakom: {selectedActivity.noStrakom}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                  {selectedActivity.judul}
                </h3>
              </div>

              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {/* Activity Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-indigo-50/40 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-indigo-100/60 dark:border-blue-900/40 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-sky-400 uppercase">Tanggal Kegiatan</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-sky-400" />
                    {selectedActivity.tanggal}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-sky-400 uppercase">Isu Strategis</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {selectedActivity.issues.map((issue) => (
                      <span key={issue} className="font-bold text-indigo-900 dark:text-sky-300">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-sky-400 uppercase">Total Konten</p>
                  <p className="font-black text-indigo-950 dark:text-sky-200 mt-0.5">
                    {selectedActivity.jumlahProduksi} Items Diproduksi
                  </p>
                </div>
              </div>

              {/* Detailed Assignments & Team Section */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Briefcase className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                  Daftar Penugasan Khusus per Bidang ({selectedActivity.assignmentsList.length})
                </h4>

                {selectedActivity.assignmentsList.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic py-4 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                    Belum ada tugas/personel yang didaftarkan untuk kegiatan ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedActivity.assignmentsList.map((asgn) => (
                      <div
                        key={asgn.id}
                        className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/60 transition-colors shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-blue-950 text-indigo-700 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {asgn.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{asgn.userName}</span>
                                {asgn.staffType && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-blue-950 text-indigo-800 dark:text-sky-300">
                                    Bidang: {asgn.staffType}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                Jenis Konten: <span className="font-semibold text-gray-700 dark:text-gray-300">{asgn.contentTypeName}</span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              asgn.status === "COMPLETED"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : asgn.status === "IN_PROGRESS"
                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {asgn.status}
                          </span>
                        </div>

                        {asgn.instruction && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 p-2 rounded-xl mt-2 text-[11px] border border-gray-100 dark:border-gray-800">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Instruksi:</span> {asgn.instruction}
                          </div>
                        )}

                        {asgn.deadline && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
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
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-4 cursor-pointer"
                onClick={() => setSelectedActivity(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LaporanPage;
