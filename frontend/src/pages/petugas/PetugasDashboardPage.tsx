import { AlertTriangle, MapPin, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";

const NAVY = "#0f1f5c";

const statusBadgeClass = (status: string) =>
  status === "SELESAI" ? "bg-green-100 text-green-700" : "bg-sky-100 text-sky-700";

const PetugasDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: userTasks = [] } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: any[] }>("/productions/my-tasks");
      return res.data;
    },
  });

  const sedangDikerjakan = userTasks.filter((t) => t.status !== "SELESAI" && t.status !== "BELUM").length;
  const selesai = userTasks.filter((t) => t.status === "SELESAI").length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 shadow-sm">
        <h1 className="text-xl font-bold" style={{ color: NAVY }}>
          Selamat datang kembali, {user?.name}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Berikut adalah daftar tugas dan aktivitas kamu di bidang <strong>{user?.staffType}</strong> hari ini.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 px-6 py-5 shadow-sm" style={{ borderLeftColor: "#64748b" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Tugas</p>
          <p className="text-2xl font-bold mt-1" style={{ color: NAVY }}>
            {userTasks.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 px-6 py-5 shadow-sm" style={{ borderLeftColor: NAVY }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: NAVY }}>
            Sedang Dikerjakan
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: NAVY }}>
            {sedangDikerjakan}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-green-600 px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Selesai</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{selesai}</p>
        </div>
      </div>

      {userTasks.some((t) => t.hasConflict) && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Perhatian: Ada Jadwal Bentrok</p>
            {userTasks
              .filter((t) => t.hasConflict)
              .map((t) => (
                <p key={t.id} className="text-sm text-amber-700 mt-0.5">
                  • {t.conflictMessage}
                </p>
              ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Daftar Tugas Kamu</h3>
          <span className="text-xs text-gray-500">Menampilkan bidang: {user?.staffType}</span>
        </div>

        <div className="space-y-3">
          {userTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              Belum ada tugas baru untuk kamu di bidang ini.
            </div>
          ) : (
            userTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadgeClass(t.status)}`}>
                      {t.status.replace("_", " ")}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">{t.kegiatan}</h4>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {t.lokasi}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> Deadline: {t.deadline}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/petugas/penugasan", { state: { taskId: t.id } })}
                  className="flex items-center gap-1 text-sm font-semibold text-white rounded-lg px-3 py-2"
                  style={{ backgroundColor: NAVY }}
                >
                  Buka Detail <ChevronRight size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PetugasDashboardPage;
