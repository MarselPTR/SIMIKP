import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";

const NAVY = "#0f1f5c";

const DocIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

interface DashboardStats {
  totalKegiatan: number;
  aktifKegiatan: number;
  totalPenugasan: number;
  produksiRunning: number;
  reviewPending: number;
  publikasiPublished: number;
  opdProduction: Array<{ name: string; singkatan: string; count: number }>;
  pegawaiProduction: Array<{ id: string; name: string; staffType: string; count: number }>;
}

const DashboardPage = () => {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboardStatsReal"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: DashboardStats }>("/dashboard/stats");
      return res.data;
    },
  });

  const statCards = [
    { label: "Total Kegiatan", value: stats?.totalKegiatan ?? 0 },
    { label: "Kegiatan Aktif", value: stats?.aktifKegiatan ?? 0 },
    { label: "Total Penugasan", value: stats?.totalPenugasan ?? 0 },
    { label: "Produksi Running", value: stats?.produksiRunning ?? 0 },
    { label: "Review Pending", value: stats?.reviewPending ?? 0 },
    { label: "Publikasi Terbit", value: stats?.publikasiPublished ?? 0 },
  ];

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  // Calculate max values for progress bars
  const maxOpdCount = Math.max(...(stats?.opdProduction.map(o => o.count) ?? [1]), 1);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          Dashboard Utama
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Ringkasan aktivitas dan performa sistem secara Real-Time</p>
      </div>

      {/* Stat cards — 3 per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 px-6 py-5 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-3xl font-extrabold" style={{ color: NAVY }}>
                {card.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${NAVY}12`, color: NAVY }}
            >
              <DocIcon />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produksi per OPD */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">Volume Kegiatan per OPD</h3>
          </div>
          <div className="divide-y divide-gray-100 p-4 space-y-4">
            {stats?.opdProduction.length === 0 ? (
               <p className="text-sm text-gray-400 text-center py-4">Belum ada kegiatan.</p>
            ) : (
               stats?.opdProduction.map((opd, idx) => {
                 const pct = (opd.count / maxOpdCount) * 100;
                 const colors = ["bg-blue-600", "bg-blue-500", "bg-blue-400", "bg-blue-300"];
                 return (
                   <div key={opd.name}>
                     <div className="flex justify-between text-sm mb-1 mt-2">
                       <span className="font-medium text-gray-700">{opd.singkatan || opd.name}</span>
                       <span className="font-bold text-gray-900">{opd.count}</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2">
                       <div className={`${colors[idx % colors.length]} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
                     </div>
                   </div>
                 );
               })
            )}
          </div>
        </div>

        {/* Produksi per Pegawai (PIC) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">Leaderboard Petugas (Konten Selesai)</h3>
          </div>
          <div className="divide-y divide-gray-100">
             {stats?.pegawaiProduction.length === 0 ? (
               <p className="text-sm text-gray-400 text-center py-6">Belum ada tugas yang diselesaikan.</p>
            ) : (
               stats?.pegawaiProduction.map((pegawai, idx) => {
                 const initials = pegawai.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                 const colors = [
                   "bg-indigo-100 text-indigo-700",
                   "bg-emerald-100 text-emerald-700",
                   "bg-rose-100 text-rose-700",
                   "bg-amber-100 text-amber-700"
                 ];
                 return (
                   <div key={pegawai.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
                     <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${colors[idx % colors.length]}`}>
                         {initials}
                       </div>
                       <div>
                         <p className="text-sm font-medium text-gray-800">{pegawai.name}</p>
                         <p className="text-xs text-gray-500">{pegawai.staffType?.replace("_", " ")}</p>
                       </div>
                     </div>
                     <span className="font-bold text-gray-900">{pegawai.count} Konten</span>
                   </div>
                 );
               })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
