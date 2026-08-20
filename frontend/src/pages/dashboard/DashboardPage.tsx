import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
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

const DashboardPage = () => {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: mockApi.dashboard.getStats,
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          Dashboard Utama
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Ringkasan aktivitas dan performa sistem</p>
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
            <h3 className="text-base font-semibold text-gray-900">Produksi per OPD</h3>
            <span className="text-xs text-gray-500">Bulan Ini</span>
          </div>
          <div className="divide-y divide-gray-100 p-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Diskominfo</span>
                <span className="font-bold text-gray-900">25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 mt-2">
                <span className="font-medium text-gray-700">Dinas Pendidikan</span>
                <span className="font-bold text-gray-900">18</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 mt-2">
                <span className="font-medium text-gray-700">Dinas Kesehatan</span>
                <span className="font-bold text-gray-900">12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Produksi per Pegawai (PIC) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">Produksi per Pegawai</h3>
            <span className="text-xs text-gray-500">Bulan Ini</span>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">AP</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Andi Prahum</p>
                  <p className="text-xs text-gray-500">PRAHUM</p>
                </div>
              </div>
              <span className="font-bold text-gray-900">15 Konten</span>
            </div>
            <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">BF</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Budi Fotografer</p>
                  <p className="text-xs text-gray-500">FOTO_VIDEO</p>
                </div>
              </div>
              <span className="font-bold text-gray-900">12 Konten</span>
            </div>
            <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">CD</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Citra Desainer</p>
                  <p className="text-xs text-gray-500">DESAINER_EDITOR</p>
                </div>
              </div>
              <span className="font-bold text-gray-900">8 Konten</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
