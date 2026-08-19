import React, { useState } from 'react';
import { Activity, ActivityPriority, ActivityStatus } from '../types';

interface ActivityTableProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onCreateAssignment: (activity: Activity) => void;
  isLoading?: boolean;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  activities,
  onEdit,
  onDelete,
  onCreateAssignment,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(search.toLowerCase()) ||
      act.activityCode.toLowerCase().includes(search.toLowerCase()) ||
      (act.locationName && act.locationName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || act.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || act.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (priority: ActivityPriority) => {
    const styles: Record<ActivityPriority, string> = {
      LOW: 'bg-slate-100 text-slate-700 border-slate-300',
      MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
      HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
      URGENT: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
    };
    return (
      <span
        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles[priority]}`}
      >
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const labels: Record<ActivityStatus, { label: string; style: string }> = {
      DRAFT: { label: 'Draft', style: 'bg-gray-100 text-gray-700' },
      SCHEDULED: { label: 'Terjadwal', style: 'bg-indigo-100 text-indigo-700' },
      IN_PROGRESS: { label: 'Berlangsung', style: 'bg-amber-100 text-amber-800' },
      COMPLETED: { label: 'Selesai', style: 'bg-emerald-100 text-emerald-800' },
      CANCELLED: { label: 'Dibatalkan', style: 'bg-rose-100 text-rose-700' },
    };
    const item = labels[status] || { label: status, style: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${item.style}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Filter Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari kode / judul / lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="IN_PROGRESS">Berlangsung</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Kode & Judul</th>
              <th className="p-3.5">Waktu & Lokasi</th>
              <th className="p-3.5">Prioritas</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Strakom</th>
              <th className="p-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Memuat data kegiatan...
                </td>
              </tr>
            ) : filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  Tidak ada data kegiatan yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredActivities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-mono text-xs text-blue-600 font-bold">{act.activityCode}</div>
                    <div className="font-medium text-slate-900 line-clamp-1">{act.title}</div>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{act.activityDate}</div>
                    <div className="text-xs text-slate-500">
                      {act.activityTime || '-'} • {act.locationName || 'Lokasi Belum Diatur'}
                    </div>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">{getPriorityBadge(act.priority)}</td>
                  <td className="p-3.5 whitespace-nowrap">{getStatusBadge(act.status)}</td>
                  <td className="p-3.5 whitespace-nowrap">
                    {act.strakomNumber ? (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-md">
                        {act.strakomNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Reguler</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                    <button
                      onClick={() => onCreateAssignment(act)}
                      title="Buat Penugasan"
                      className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded-md transition"
                    >
                      + Tugas
                    </button>
                    <button
                      onClick={() => onEdit(act)}
                      className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-md transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(act.id)}
                      className="px-2.5 py-1 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 font-medium rounded-md transition"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
