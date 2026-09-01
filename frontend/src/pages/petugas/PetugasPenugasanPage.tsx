import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FileText,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Upload,
  ExternalLink,
  Search,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { usePetugasTasksStore, getStoredPetugasTasks, saveStoredPetugasTasks } from "../../lib/petugas-store";
import { WORKFLOWS } from "../../lib/mock-data";
import { useToast } from "../../contexts/ToastContext";

const categoryLabels: Record<string, string> = {
  upacara: "Upacara",
  rapat: "Rapat",
  peresmian: "Peresmian",
  sidang: "Sidang",
};

const PetugasPenugasanPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { addToast } = useToast();

  const userBidang = user?.staffType || (user as any)?.bidang || "PRAHUM";

  const { tasks: userTasks, updateStatus: storeUpdateStatus, submitWork: storeSubmitWork } = usePetugasTasksStore(userBidang);

  const initialTaskId = (location.state as { taskId?: string } | null)?.taskId ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initialTaskId);
  const [uploadLink, setUploadLink] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const selectedTask = userTasks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedTask) {
      setUploadLink(selectedTask.workLink || "");
    }
  }, [selectedTask]);

  const updateStatus = async (id: string, status: string) => {
    await storeUpdateStatus(id, status);
    addToast(`Status tugas diperbarui ke: ${status.replace("_", " ")}`, "success");
  };

  const filteredTasks = useMemo(() => {
    return userTasks.filter((t) => {
      if (categoryFilter !== "ALL" && t.kategori !== categoryFilter) return false;
      if (statusFilter === "BELUM" && t.status !== "BELUM") return false;
      if (statusFilter === "PROSES" && (t.status === "SELESAI" || t.status === "BELUM")) return false;
      if (statusFilter === "SELESAI" && t.status !== "SELESAI") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.kegiatan.toLowerCase().includes(q) ||
          t.lokasi.toLowerCase().includes(q) ||
          t.jenisPekerjaan.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [userTasks, categoryFilter, statusFilter, searchQuery]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--x", "-1000px");
    e.currentTarget.style.setProperty("--y", "-1000px");
  };

  return (
    <div className="space-y-6 pb-10 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a1647]">
            Penugasan Saya
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Daftar seluruh tugas operasional yang dialokasikan untuk kamu {user?.name ? `• ${user.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-[#0a1647] border border-[#0a1647]/30 shadow-xs">
            Sektor: {userBidang || "PRAHUM"}
          </span>
        </div>
      </div>

      {selectedTask ? (
        (() => {
          const taskWorkflow = WORKFLOWS[selectedTask.bidang || userBidang || "PRAHUM"] || WORKFLOWS["PRAHUM"];
          const rawStatus = selectedTask.status === "COMPLETED" ? "SELESAI" : selectedTask.status === "ASSIGNED" ? "BELUM" : selectedTask.status;
          const foundIndex = taskWorkflow.indexOf(rawStatus);
          const stepIndex = foundIndex >= 0 ? foundIndex : rawStatus === "SELESAI" ? taskWorkflow.length - 1 : 0;
          const totalSteps = taskWorkflow.length;
          const isCompleted = rawStatus === "SELESAI" || selectedTask.status === "COMPLETED";
          const progressPercent = isCompleted ? 100 : Math.round(((stepIndex + 1) / totalSteps) * 100);

          return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <button
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#0a1647] hover:underline cursor-pointer group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Kembali ke Daftar Penugasan</span>
                </button>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3.5 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : rawStatus === "BELUM"
                        ? "bg-slate-100 text-slate-700 border-slate-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {isCompleted && <CheckCircle2 size={13} className="text-emerald-600" />}
                    <span>Status: {rawStatus.replace("_", " ")} ({progressPercent}%)</span>
                  </span>
                </div>
              </div>

              {selectedTask.hasConflict && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                      Peringatan Bentrok Jadwal Terdeteksi
                    </p>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      {selectedTask.conflictMessage || "Jadwal penugasan ini berbenturan dengan agenda liputan lain pada rentang waktu yang berdekatan."}
                    </p>
                  </div>
                </div>
              )}

              {(selectedTask.status === "REVISI" || selectedTask.revisionNotes) && (
                <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle size={16} className="text-amber-600" />
                      <span>Catatan Koreksi &amp; Revisi dari Admin Diskominfo</span>
                    </div>
                    {selectedTask.revisionDate && (
                      <span className="text-[11px] font-medium text-amber-700">
                        {selectedTask.revisionDate}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium bg-white/80 rounded-xl p-3.5 border border-amber-200">
                    "{selectedTask.revisionNotes || "Tolong lakukan perbaikan konten sesuai arahan pimpinan dan upload kembali tautan file hasil revisi."}"
                  </p>
                  <p className="text-[11px] text-amber-700">
                    💡 <em>Silakan perbaiki file di Google Drive / Cloud, lalu perbarui tautan di bawah dan klik <strong>"Kirim Ulang Hasil Revisi"</strong>.</em>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                    {categoryLabels[selectedTask.kategori] || selectedTask.kategori}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                    {selectedTask.jenisPekerjaan}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 leading-snug">{selectedTask.kegiatan}</h2>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-0.5">
                  <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <MapPin size={14} className="text-[#0a1647]" /> {selectedTask.lokasi}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#0a1647] font-semibold bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md">
                    <Clock size={14} className="text-[#0a1647]" /> Batas Pengumpulan: {selectedTask.deadline}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-gray-200/90 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#0a1647] uppercase tracking-wider">
                      Alur Tahapan Pekerjaan (Sektor {userBidang || "PRAHUM"})
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Klik tahapan pada timeline di bawah untuk memperbarui status progres kerja Anda
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0a1647] bg-white border border-[#0a1647]/20 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    Tahap {isCompleted ? totalSteps : stepIndex + 1} dari {totalSteps}
                  </span>
                </div>

                <div className="relative flex items-center justify-between px-3 sm:px-6 pt-2 pb-1">
                  <div className="absolute left-6 right-6 top-5 h-0.5 bg-gray-200 z-0" />
                  <div
                    className={`absolute left-6 top-5 h-0.5 transition-all duration-500 z-0 ${
                      isCompleted ? "bg-emerald-500" : "bg-[#0a1647]"
                    }`}
                    style={{
                      width: `calc(${totalSteps > 1 ? (Math.max(0, stepIndex) / (totalSteps - 1)) * 100 : 100}% - 3rem)`,
                    }}
                  />

                  {taskWorkflow.map((step, idx) => {
                    const isDone = isCompleted || idx < stepIndex;
                    const isCurrent = !isCompleted && idx === stepIndex;
                    const isRevisionStep = step === "REVISI";

                    const handleNodeClick = () => {
                      const isUploadRequired = rawStatus === "DESAIN" || rawStatus === "REVISI";
                      if (idx > stepIndex && isUploadRequired && !uploadLink.trim() && !selectedTask.workLink) {
                        addToast(
                          `Anda wajib memasukkan tautan draf desain pada tahap "${rawStatus}" terlebih dahulu sebelum melangkah ke tahap berikutnya!`,
                          "warning"
                        );
                        return;
                      }
                      updateStatus(selectedTask.id, step);
                    };

                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={handleNodeClick}
                        className="relative z-10 flex flex-col items-center cursor-pointer group focus:outline-none"
                        title={`Klik untuk ubah status ke ${step.replace("_", " ")}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            isDone
                              ? "bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-700"
                              : isCurrent
                              ? isRevisionStep
                                ? "bg-amber-600 text-white ring-4 ring-amber-500/25 shadow-xs scale-110"
                                : "bg-[#0a1647] text-white ring-4 ring-[#0a1647]/20 shadow-xs scale-110"
                              : "bg-white border-2 border-gray-300 text-gray-400 group-hover:border-[#0a1647] group-hover:text-[#0a1647]"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 size={15} className="text-white stroke-[2.5]" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <span
                          className={`mt-2 text-[11px] font-semibold tracking-tight transition-colors select-none text-center whitespace-nowrap ${
                            isDone
                              ? "text-emerald-700 font-bold"
                              : isCurrent
                              ? isRevisionStep
                                ? "text-amber-700 font-extrabold"
                                : "text-[#0a1647] font-extrabold"
                              : "text-gray-400 group-hover:text-gray-700"
                          }`}
                        >
                          {step.replace("_", " ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const nextStepName = stepIndex < totalSteps - 1 ? taskWorkflow[stepIndex + 1] : null;
                const isDesain = rawStatus === "DESAIN";
                const isRevisi = rawStatus === "REVISI";
                const isSiapTayang = rawStatus === "SIAP_TAYANG";
                const isBelum = rawStatus === "BELUM";

                let formTitle = `Tahap ${stepIndex + 1}: Pengumpulan Luaran Kerja`;
                let formBadge = "Proses Kerja";
                let formBadgeStyle = "bg-blue-50 text-[#0a1647] border-[#0a1647]/30";
                let formDesc = "Masukkan tautan Google Drive / Cloud storage berkas hasil kerja Anda.";
                let formButtonText = nextStepName ? `Lanjut ke Tahap ${nextStepName.replace("_", " ")} ➔` : "Simpan Progres";
                let formButtonColor = "bg-[#0a1647] hover:bg-[#122368]";
                let isUploadMandatory = false;
                let placeholderText = "https://drive.google.com/drive/folders/...";

                if (isBelum) {
                  formTitle = "Tahap 1: Mulai Pengerjaan Agenda";
                  formBadge = "Tahap Awal";
                  formBadgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
                  formDesc = "Pelajari lembar instruksi penugasan di sebelah kiri. Bila siap, klik tombol di bawah untuk memulai tahapan aktif.";
                  formButtonText = userBidang === "DESAINER_EDITOR" ? "▶️ Mulai Proses Desain Grafis" : "▶️ Mulai Liputan Lapangan";
                  formButtonColor = "bg-[#0a1647] hover:bg-[#122368]";
                } else if (isDesain) {
                  formTitle = "Tahap 2: Pengunggahan Draf Desain Pertama (Wajib)";
                  formBadge = "Wajib Unggah Draf";
                  formBadgeStyle = "bg-amber-50 text-amber-800 border-amber-300 font-bold";
                  formDesc = "Masukkan tautan Google Drive, Canva, atau Figma draf awal desain Anda. Tautan draf wajib disertakan sebelum Anda dapat mengajukan review ke Admin.";
                  formButtonText = "📤 Ajukan Draf Desain untuk Review Admin ➔";
                  formButtonColor = "bg-[#0a1647] hover:bg-[#122368]";
                  isUploadMandatory = true;
                  placeholderText = "https://drive.google.com/... atau https://www.canva.com/design/...";
                } else if (isRevisi) {
                  formTitle = "Tahap 3: Pengumpulan Hasil Revisi Desain";
                  formBadge = "Perlu Revisi Admin";
                  formBadgeStyle = "bg-amber-50 text-amber-800 border-amber-300 font-bold";
                  formDesc = "Perbaiki materi desain sesuai arahan pada Catatan Revisi Admin di atas, lalu masukkan tautan file perbaikan untuk dikirim ulang.";
                  formButtonText = "📤 Kirim Ulang Hasil Revisi (Lanjut ke Siap Tayang) ➔";
                  formButtonColor = "bg-amber-600 hover:bg-amber-700";
                  isUploadMandatory = true;
                  placeholderText = "https://drive.google.com/... (Tautan Hasil Revisi Terbaru)";
                } else if (isSiapTayang) {
                  formTitle = `Tahap ${stepIndex + 1}: Materi Final Siap Tayang / Publikasi`;
                  formBadge = "Siap Publikasi";
                  formBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
                  formDesc = "Materi telah selesai dan disetujui. Klik tombol di bawah untuk mengonfirmasi selesai dan mengarsipkan luaran ke Bank Konten SIMIKP.";
                  formButtonText = "✅ Selesaikan & Arsipkan ke Bank Konten ➔";
                  formButtonColor = "bg-emerald-600 hover:bg-emerald-700";
                  isUploadMandatory = true;
                } else if (isCompleted) {
                  formTitle = "Tahap 5: Tugas Selesai & Terarsip Penuh";
                  formBadge = "100% Selesai";
                  formBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
                  formDesc = "Tugas ini telah rampung seluruhnya. Seluruh berkas dokumentasi dan luaran tersimpan aman di Bank Konten.";
                  formButtonText = "Tugas Telah Selesai Penuh";
                  formButtonColor = "bg-gray-400 cursor-default opacity-80";
                }

                const handleDynamicActionSubmit = async () => {
                  if (isCompleted) return;

                  if (isUploadMandatory && !uploadLink.trim() && !selectedTask.workLink) {
                    addToast("Harap masukkan tautan Google Drive / Cloud draf desain Anda sebelum melanjutkan!", "warning");
                    return;
                  }

                  const targetLink = uploadLink.trim() || selectedTask.workLink || "";

                  if (isSiapTayang || nextStepName === "SELESAI") {
                    await storeSubmitWork(selectedTask.id, targetLink);
                    addToast("Tugas telah selesai dan berkas berhasil diarsipkan ke Bank Konten!", "success");
                  } else if (nextStepName) {
                    if (targetLink) {
                      const current = getStoredPetugasTasks();
                      const updated = current.map((t) =>
                        t.id === selectedTask.id ? { ...t, workLink: targetLink, status: nextStepName } : t
                      );
                      saveStoredPetugasTasks(updated);
                    } else {
                      await storeUpdateStatus(selectedTask.id, nextStepName);
                    }

                    addToast(`Status tugas berhasil diperbarui ke: ${nextStepName.replace("_", " ")}`, "success");
                  }
                };

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#0a1647] font-bold text-xs uppercase tracking-wider border-b border-slate-200/80 pb-3">
                          <FileText size={16} />
                          <span>Lembar Instruksi Penugasan</span>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-2">
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {selectedTask.instruksi || "Lakukan liputan dan dokumentasi secara menyeluruh sesuai standar operasional penugasan Kominfo."}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
                        <span>Penanggung Jawab: <strong>Admin Diskominfo</strong></span>
                        <span>Prioritas: <strong>Tinggi</strong></span>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
                          <div className="flex items-center gap-2 text-[#0a1647] font-bold text-xs uppercase tracking-wider truncate">
                            <Upload size={16} />
                            <span className="truncate">{formTitle}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${formBadgeStyle}`}>
                            {formBadge}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {formDesc}
                        </p>
                        {!isCompleted && !isBelum && (
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                              Tautan Berkas (Google Drive / Canva / Cloud) {isUploadMandatory && <span className="text-rose-500">*Wajib</span>}:
                            </label>
                            <input
                              type="url"
                              value={uploadLink}
                              onChange={(e) => setUploadLink(e.target.value)}
                              placeholder={placeholderText}
                              className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a1647]/20 focus:border-[#0a1647] transition placeholder:text-gray-400 font-mono"
                            />
                          </div>
                        )}
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={handleDynamicActionSubmit}
                            className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${formButtonColor}`}
                          >
                            <Upload size={14} />
                            <span>{formButtonText}</span>
                          </button>
                        )}
                      </div>
                      {selectedTask.workLink && (
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            Tautan Aktif Tersimpan
                          </span>
                          <a
                            href={selectedTask.workLink}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[#0a1647] hover:underline flex items-center gap-1 truncate max-w-[200px]"
                          >
                            <span className="truncate">Buka di Tab Baru</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kegiatan, lokasi, atau jenis tugas..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a1647]/20 focus:border-[#0a1647] transition placeholder:text-gray-400"
              />
            </div>
            <div className="inline-flex rounded-lg border border-[#0a1647]/30 bg-white p-0.5 shadow-2xs self-start md:self-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-[#0a1647] text-white shadow-xs"
                    : "text-[#0a1647] hover:bg-[#0a1647]/5 active:bg-[#0a1647] active:text-white"
                }`}
              >
                Semua ({userTasks.length})
              </button>
              <button
                onClick={() => setStatusFilter("PROSES")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "PROSES"
                    ? "bg-[#0a1647] text-white shadow-xs"
                    : "text-[#0a1647] hover:bg-[#0a1647]/5 active:bg-[#0a1647] active:text-white"
                }`}
              >
                Sedang Proses
              </button>
              <button
                onClick={() => setStatusFilter("SELESAI")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "SELESAI"
                    ? "bg-[#0a1647] text-white shadow-xs"
                    : "text-[#0a1647] hover:bg-[#0a1647]/5 active:bg-[#0a1647] active:text-white"
                }`}
              >
                Selesai
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-semibold text-gray-500 mr-1">Kategori:</span>
            {["ALL", "upacara", "rapat", "peresmian", "sidang"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
                    : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5 hover:border-[#0a1647] active:bg-[#0a1647] active:text-white"
                }`}
              >
                {cat === "ALL" ? "Semua" : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-14 text-gray-400 bg-white rounded-2xl border border-dashed border-[#0a1647]/30 text-xs shadow-xs">
                Tidak ada tugas penugasan yang sesuai filter.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const taskWorkflow = WORKFLOWS[t.bidang || userBidang || "PRAHUM"] || WORKFLOWS["PRAHUM"];
                const rawStatus = t.status === "COMPLETED" ? "SELESAI" : t.status === "ASSIGNED" ? "BELUM" : t.status;
                const foundIndex = taskWorkflow.indexOf(rawStatus);
                const stepIndex = foundIndex >= 0 ? foundIndex : rawStatus === "SELESAI" ? taskWorkflow.length - 1 : 0;
                const totalSteps = taskWorkflow.length;
                const isCompleted = rawStatus === "SELESAI" || t.status === "COMPLETED";

                return (
                  <div
                    key={t.id}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-gray-200 hover:border-slate-400 hover:shadow-sm transition-all duration-150 flex flex-col justify-between gap-4 bg-white"
                    style={{
                      background: `radial-gradient(450px circle at var(--x, -1000px) var(--y, -1000px), rgba(10, 22, 71, 0.08) 0%, rgba(148, 163, 184, 0.12) 35%, rgba(226, 232, 240, 0.20) 65%, transparent 80%) #ffffff`,
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        {/* Uniform Pure White & Dark Blue Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. Category Badge */}
                          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                            {categoryLabels[t.kategori] || t.kategori}
                          </span>

                          {/* 2. Status Badge with Dynamic Color */}
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : rawStatus === "BELUM"
                                ? "bg-slate-100 text-slate-700 border-slate-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            {isCompleted && <CheckCircle2 size={13} className="text-emerald-600" />}
                            {rawStatus.replace("_", " ")}
                          </span>

                          {/* 3. Job Type Badge */}
                          <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                            {t.jenisPekerjaan}
                          </span>

                          {/* 4. Bentrok Badge */}
                          {t.hasConflict && (
                            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5">
                              <AlertTriangle size={13} className="text-rose-600" />
                              Bentrok
                            </span>
                          )}

                          {t.workLink && (
                            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                              <Upload size={12} className="text-emerald-600" />
                              Luaran Tersimpan
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-gray-900">{t.kegiatan}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-0.5">
                          <span className="flex items-center gap-1.5 text-gray-600">
                            <MapPin size={13} className="text-[#0a1647]" /> {t.lokasi}
                          </span>
                          <span className="flex items-center gap-1.5 text-[#0a1647] font-semibold bg-white border border-[#0a1647]/30 px-2.5 py-0.5 rounded-md">
                            <Clock size={12} className="text-[#0a1647]" /> Deadline: {t.deadline}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedId(t.id)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white px-5 py-2.5 rounded-lg cursor-pointer self-start md:self-auto shadow-xs bg-[#0a1647] hover:bg-[#081238] transition"
                      >
                        Kelola Tugas <ChevronRight size={15} />
                      </button>
                    </div>

                    {/* ── OPSI A: Stepper Dot Connected Timeline Ramping & Formal ── */}
                    <div className="pt-4 border-t border-gray-100/90 mt-1">
                      <div className="relative flex items-center justify-between px-2 sm:px-4">
                        {/* Connecting background track */}
                        <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200 z-0" />
                        {/* Active colored progress track */}
                        <div
                          className={`absolute left-4 top-3 h-0.5 transition-all duration-500 z-0 ${
                            isCompleted ? "bg-emerald-500" : "bg-[#0a1647]"
                          }`}
                          style={{
                            width: `calc(${totalSteps > 1 ? (Math.max(0, stepIndex) / (totalSteps - 1)) * 100 : 100}% - 2rem)`,
                          }}
                        />

                        {/* Step Nodes */}
                        {taskWorkflow.map((step, idx) => {
                          const isDone = isCompleted || idx < stepIndex;
                          const isCurrent = !isCompleted && idx === stepIndex;

                          return (
                            <div key={step} className="relative z-10 flex flex-col items-center">
                              {/* Node Circle */}
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                                  isDone
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : isCurrent
                                    ? "bg-[#0a1647] text-white ring-4 ring-[#0a1647]/20 shadow-xs scale-110"
                                    : "bg-white border-2 border-gray-300 text-gray-400"
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 size={13} className="text-white stroke-[2.5]" />
                                ) : (
                                  idx + 1
                                )}
                              </div>

                              {/* Node Label */}
                              <span
                                className={`mt-1.5 text-[10px] font-semibold tracking-tight transition-colors select-none text-center whitespace-nowrap ${
                                  isDone
                                    ? "text-emerald-700 font-bold"
                                    : isCurrent
                                    ? "text-[#0a1647] font-extrabold"
                                    : "text-gray-400"
                                }`}
                              >
                                {step.replace("_", " ")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetugasPenugasanPage;
