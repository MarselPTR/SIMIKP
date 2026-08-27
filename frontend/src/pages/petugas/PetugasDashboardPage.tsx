import { MapPin, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";

const NAVY = "#0f1f5c";

const statusBadgeClass = (status: string) =>
  status === "SELESAI" || status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-sky-100 text-sky-700";

interface PetugasTask {
  id: string;
  kegiatan: string;
  lokasi: string;
  deadline: string;
  status: string;
  jenisPekerjaan: string;
  instruksi: string;
}

const PetugasDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["my-tasks-dashboard"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: PetugasTask[] }>("/productions/my-tasks");
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} />;

  const userTasks = tasks || [];
  const sedangDikerjakan = userTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "SELESAI").length;
  const selesai = userTasks.filter((t) => t.status === "COMPLETED" || t.status === "SELESAI").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 shadow-sm">
        <h1 className="text-xl font-bold" style={{ color: NAVY }}>
          Selamat datang kembali, {user?.name}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Berikut adalah ringkasan tugas kamu sebagai <strong>{user?.staffType?.replace("_", " ")}</strong> hari ini.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 p-5 shadow-sm" style={{ borderLeftColor: NAVY }}>
          <p className="text-sm font-medium text-gray-500 mb-2">Tugas Berjalan (Perlu Diselesaikan)</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-gray-900">{sedangDikerjakan}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-green-600 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-2">Tugas Selesai</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-extrabold text-green-600">{selesai}</span>
            <span className="text-sm font-medium text-green-600 mb-1">Kerja bagus!</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Penugasan Terdekat</h2>
          <button
            onClick={() => navigate("/petugas/penugasan")}
            className="text-sm font-semibold hover:underline flex items-center"
            style={{ color: NAVY }}
          >
            Lihat Semua <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {userTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
              Tidak ada tugas untuk saat ini.
            </div>
          ) : (
            userTasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass(t.status)}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/petugas/penugasan", { state: { taskId: t.id } })}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Detail
                  </button>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">{t.kegiatan}</h3>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {t.lokasi}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Deadline: {t.deadline}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PetugasDashboardPage;
