import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { mockKegiatan, mockReview } from '../lib/mockData';
import Badge from '../components/ui/Badge';
import { LoadingSpinner, ErrorState } from '../components/shared/StateComponents';

const NAVY = '#0f1f5c';

// Icon components (inline SVG, matching the reference screenshot style)
const DocIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DashboardPage = () => {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.dashboard.getStats,
  });

  const statCards = [
    { label: 'Total Kegiatan',    value: stats?.totalKegiatan      ?? 0 },
    { label: 'Kegiatan Aktif',    value: stats?.aktifKegiatan      ?? 0 },
    { label: 'Total Penugasan',   value: stats?.totalPenugasan     ?? 0 },
    { label: 'Produksi Running',  value: stats?.produksiRunning    ?? 0 },
    { label: 'Review Pending',    value: stats?.reviewPending      ?? 0 },
    { label: 'Publikasi Terbit',  value: stats?.publikasiPublished ?? 0 },
  ];

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Dashboard Utama</h1>
        <p className="text-sm text-gray-400 mt-0.5">Ringkasan aktivitas dan performa sistem</p>
      </div>

      {/* Stat cards — 3 per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 px-6 py-5 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-3xl font-extrabold" style={{ color: NAVY }}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
            {/* Icon box */}
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

        {/* Kegiatan Terbaru */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Kegiatan Terbaru</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {mockKegiatan.slice(0, 4).map((k) => (
              <div key={k.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-medium text-gray-800">{k.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Deadline: {k.deadline}</p>
                </div>
                <Badge
                  variant={
                    k.status === 'active' ? 'success' :
                    k.status === 'review' ? 'warning' :
                    k.status === 'done'   ? 'default' : 'info'
                  }
                >
                  {k.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Aktivitas Terkini */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Aktivitas Terkini</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {mockReview.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50 transition">
                {/* Document icon as activity icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${NAVY}10`, color: NAVY }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{r.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Reviewer: {r.reviewer}</p>
                </div>
                <Badge
                  variant={r.status === 'approved' ? 'success' : r.status === 'revision' ? 'warning' : 'default'}
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
