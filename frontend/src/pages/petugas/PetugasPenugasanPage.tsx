import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, MapPin, FileText, Upload } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { mockTugasPetugas, WORKFLOWS, type MockTugasPetugas } from "../../lib/mock-data";

const NAVY = "#0f1f5c";

const statusBadgeClass = (status: string) =>
  status === "SELESAI" ? "bg-green-100 text-green-700" : "bg-sky-100 text-sky-700";

const PetugasPenugasanPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const initialTaskId = (location.state as { taskId?: string } | null)?.taskId ?? null;

  const [tasks, setTasks] = useState<MockTugasPetugas[]>(mockTugasPetugas);
  const [selectedId, setSelectedId] = useState<string | null>(initialTaskId);
  const [uploadLink, setUploadLink] = useState("");

  const userTasks = tasks.filter((t) => t.bidang === user?.bidang);
  const selectedTask = userTasks.find((t) => t.id === selectedId) ?? null;

  const updateStatus = (id: string, status: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  if (!selectedTask) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>
            Penugasan Saya
          </h1>
          <p className="text-sm text-gray-500 mt-1">Daftar seluruh tugas operasional yang dialokasikan untuk kamu.</p>
        </div>

        <div className="space-y-3">
          {userTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              Belum ada tugas untuk kamu di bidang ini.
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
                    <span>📍 {t.lokasi}</span>
                    <span>⏰ Deadline: {t.deadline}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(t.id)}
                  className="text-sm font-semibold text-white rounded-lg px-3 py-2"
                  style={{ backgroundColor: NAVY }}
                >
                  Kelola Tugas
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const workflow = user?.bidang ? WORKFLOWS[user.bidang] ?? [] : [];

  return (
    <div className="max-w-3xl space-y-4">
      <button
        onClick={() => setSelectedId(null)}
        className="flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: NAVY }}
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Penugasan
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusBadgeClass(selectedTask.status)}`}>
            {selectedTask.status.replace("_", " ")}
          </span>
          <h2 className="text-lg font-bold text-gray-900 mt-2">{selectedTask.kegiatan}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tipe Pekerjaan: <strong>{selectedTask.jenisPekerjaan}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-lg p-4">
          <div>
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <MapPin size={14} /> Lokasi Pelaksanaan
            </span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedTask.lokasi}</p>
          </div>
          <div>
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <Clock size={14} /> Batas Waktu (Deadline)
            </span>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedTask.deadline}</p>
          </div>
          <div className="col-span-2">
            <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <FileText size={14} /> Catatan &amp; Instruksi Khusus
            </span>
            <p className="text-sm text-gray-800 mt-1">{selectedTask.instruksi}</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900">Update Status Produksi</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-3">
            {user?.bidang === "DESAINER_EDITOR"
              ? "Klik tahapan di bawah untuk memperbarui progress. Sektor Anda memiliki akses fitur REVISI."
              : "Klik tahapan di bawah untuk memperbarui progress pekerjaan kamu secara berurutan."}
          </p>
          <div className="flex flex-wrap gap-2">
            {workflow.map((step, idx) => {
              const isActive = selectedTask.status === step;
              return (
                <button
                  key={step}
                  onClick={() => updateStatus(selectedTask.id, step)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full ${
                    isActive ? "bg-green-600 text-white" : "border border-gray-300 text-gray-600 bg-white"
                  }`}
                >
                  {isActive && <CheckCircle2 size={14} />} {idx + 1}. {step.replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900">Kirimkan Luaran / Hasil Kerja</h4>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">
            Tempelkan link tautan Google Drive / Cloud Penyimpanan hasil dokumentasi/file kamu.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={uploadLink}
              onChange={(e) => setUploadLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="flex-1 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
            />
            <button
              onClick={() => alert("Berhasil! Link luaran kerja telah tersimpan.")}
              className="flex items-center gap-1.5 text-sm font-semibold text-white rounded-lg px-4 py-2.5"
              style={{ backgroundColor: NAVY }}
            >
              <Upload size={16} /> Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetugasPenugasanPage;
