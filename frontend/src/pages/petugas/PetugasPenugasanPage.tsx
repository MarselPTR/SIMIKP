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
  Send,
  History,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { usePetugasTasksStore } from "../../lib/petugas-store";
import { WORKFLOWS } from "../../lib/mock-data";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";

const CATEGORY_MAP: Record<string, { id: string; en: string }> = {
  upacara: { id: "Upacara", en: "Ceremony" },
  rapat: { id: "Rapat", en: "Meeting" },
  peresmian: { id: "Peresmian", en: "Inauguration" },
  sidang: { id: "Sidang", en: "Hearing / Session" },
};

const PetugasPenugasanPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { addToast } = useToast();
  const { t, language } = useLanguage();

  // Identitas (userId), bukan kategori tetap — role sekarang melekat per-tugas.
  const { tasks: userTasks, submitWork: storeSubmitWork } = usePetugasTasksStore(user?.id);
  const userBidang = userTasks[0]?.bidang || "PRAHUM";

  const initialTaskId = (location.state as { taskId?: string } | null)?.taskId ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initialTaskId);
  const [uploadLink, setUploadLink] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const selectedTask = userTasks.find((t) => t.id === selectedId) ?? null;

  const getCategoryLabel = (cat: string) => {
    if (cat === "ALL") return t("all");
    const found = CATEGORY_MAP[cat];
    if (found) return language === "en" ? found.en : found.id;
    return cat;
  };

  useEffect(() => {
    if (selectedTask) {
      setUploadLink(selectedTask.workLink || "");
    }
  }, [selectedTask]);

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
    <div className="space-y-6 pb-10 min-h-screen animate-fade-in text-gray-900 dark:text-gray-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0a1647] dark:text-sky-400">
            {language === "en" ? "My Assignments" : "Penugasan Saya"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {language === "en"
              ? "Track your field assignments, document activities, and submit deliverables."
              : "Pantau penugasan liputan, dokumentasi kegiatan, dan unggah berkas luaran."}
          </p>
        </div>
        {userTasks.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#161b22] text-[#0a1647] dark:text-sky-400 border border-gray-200 dark:border-gray-800 shadow-xs">
              {language === "en" ? "Sector" : "Sektor"}: {userBidang}
            </span>
          </div>
        )}
      </div>

      {selectedId && selectedTask ? (
        (() => {
          // Alur kerja ikut role tugas ini sendiri (bidang per-tugas), bukan sektor halaman.
          const taskWorkflow = WORKFLOWS[selectedTask.bidang || userBidang] || WORKFLOWS.PRAHUM;
          const stepIndex = taskWorkflow.indexOf(selectedTask.status);
          const totalSteps = taskWorkflow.length;
          const rawStatus = selectedTask.status.toUpperCase();
          const isRevision = rawStatus === "REVISI";
          const isCompleted = rawStatus === "SELESAI" || selectedTask.status === "COMPLETED";
          const progressPercent = isCompleted ? 100 : Math.round(((stepIndex + 1) / totalSteps) * 100);

          return (
            <div className="bg-white dark:bg-[#161b22] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-xs space-y-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                <button
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#0a1647] dark:text-sky-400 hover:underline cursor-pointer group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>{language === "en" ? "Back to Task List" : "Kembali ke Daftar Penugasan"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3.5 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                      isCompleted
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : isRevision
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse"
                        : rawStatus === "BELUM"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                        : "bg-blue-50 dark:bg-blue-950/40 text-[#0a1647] dark:text-sky-300 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {isCompleted && <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />}
                    {isRevision && <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />}
                    <span>{t("status")}: {isRevision ? (language === "en" ? "NEEDS REVISION" : "PERLU REVISI") : rawStatus.replace("_", " ")} ({progressPercent}%)</span>
                  </span>
                </div>
              </div>

              {/* Revision Alert Callout if task is in REVISI or has notes */}
              {(isRevision || selectedTask.revisionNotes || (selectedTask.revisionHistory && selectedTask.revisionHistory.length > 0)) && (
                <div className="bg-amber-50/95 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 dark:border-amber-800/60 pb-2.5">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        {language === "en" ? "Revision Notes from Ahli Pertama" : "Catatan Perbaikan dari Ahli Pertama"} ({selectedTask.revisionAuthor || "Pranata Ahli Pertama"})
                      </span>
                    </div>
                    {selectedTask.revisionDate && (
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-md self-start sm:self-auto">
                        {selectedTask.revisionDate}
                      </span>
                    )}
                  </div>
                  {selectedTask.revisionNotes && (
                    <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-medium leading-relaxed pl-1 sm:pl-6">
                      "{selectedTask.revisionNotes}"
                    </p>
                  )}

                  {/* Historical Revision Trail Log */}
                  {selectedTask.revisionHistory && selectedTask.revisionHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-200/70 dark:border-amber-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <History size={13} className="text-amber-600" />
                          <span>{language === "en" ? "Revision History Log" : "Riwayat Catatan Revisi"} ({selectedTask.revisionHistory.length} {language === "en" ? "entries" : "catatan"})</span>
                        </p>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedTask.revisionHistory.map((rev, rIdx) => (
                          <div key={rev.id || rIdx} className="bg-white/80 dark:bg-gray-900/60 rounded-xl p-3 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-1">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                              <span className="font-bold text-amber-900 dark:text-amber-300">
                                #{rIdx + 1} • {rev.author}
                              </span>
                              <span>{rev.date}</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 font-medium">"{rev.notes}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Workspace Details */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedTask.kegiatan}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#0a1647] dark:text-sky-400" /> {selectedTask.lokasi}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-[#0a1647] dark:text-sky-400" /> {t("deadline")}: {selectedTask.deadline}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-md font-semibold">
                      {selectedTask.jenisPekerjaan}
                    </span>
                  </div>
                </div>

                {/* Upload & Progress Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="bg-slate-50/80 dark:bg-gray-900/60 rounded-2xl border border-slate-200 dark:border-gray-800 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[#0a1647] dark:text-sky-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200/80 dark:border-gray-800 pb-2">
                      <FileText size={16} />
                      <span>{language === "en" ? "Task Instructions" : "Lembar Instruksi Penugasan"}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {language === "en"
                        ? "Execute coverage documentation comprehensively matching Batu City Government standards. Ensure photos/videos or news articles are stored in high resolution."
                        : "Laksanakan liputan dokumentasi kegiatan secara komprehensif sesuai standar Diskominfo Kota Batu. Pastikan materi tersimpan dalam resolusi tinggi."}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {isRevision
                          ? (language === "en" ? "Upload Revised Deliverables Link" : "Tautan Berkas Hasil Perbaikan")
                          : (language === "en" ? "Deliverable Cloud Link (Google Drive / Canva)" : "Tautan Berkas (Google Drive / Cloud)")}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isRevision
                          ? (language === "en" ? "Update your deliverable link after completing revision notes from Ahli Pertama." : "Perbarui tautan berkas setelah melakukan perbaikan sesuai catatan Ahli Pertama.")
                          : (language === "en" ? "Enter your Google Drive or Canva link for quality review." : "Masukkan tautan Google Drive atau Canva untuk review pimpinan.")}
                      </p>
                    </div>

                    <input
                      type="url"
                      value={uploadLink}
                      onChange={(e) => setUploadLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0a1647] dark:focus:ring-sky-500"
                    />

                    <button
                      type="button"
                      onClick={async () => {
                        if (!uploadLink.trim()) {
                          addToast(language === "en" ? "Please enter file link" : "Harap masukkan tautan berkas", "warning");
                          return;
                        }
                        await storeSubmitWork(selectedTask.id, uploadLink.trim());
                        if (isRevision) {
                          addToast(
                            language === "en"
                              ? "Revised deliverables re-submitted to Ahli Pertama!"
                              : "Hasil perbaikan berhasil dikirim ulang ke Ahli Pertama untuk telaah lanjutan!",
                            "success"
                          );
                        } else {
                          addToast(language === "en" ? "Work submitted successfully!" : "Luaran berhasil disimpan!", "success");
                        }
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                        isRevision
                          ? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 shadow-md"
                          : "bg-[#0a1647] dark:bg-blue-600 hover:bg-[#122368] dark:hover:bg-blue-700"
                      }`}
                    >
                      {isRevision ? (
                        <>
                          <Send size={14} />
                          <span>{language === "en" ? "Re-submit Revised Deliverables to Ahli Pertama" : "Kirim Ulang Hasil Revisi ke Ahli Pertama"}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>{language === "en" ? "Save & Submit Deliverables" : "Simpan & Kirim Luaran"}</span>
                        </>
                      )}
                    </button>

                    {selectedTask.workLink && (
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          {language === "en" ? "Link Saved" : "Tautan Aktif Tersimpan"}
                        </span>
                        <a
                          href={selectedTask.workLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#0a1647] dark:text-sky-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <span className="truncate">{language === "en" ? "Open in New Tab" : "Buka di Tab Baru"}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                placeholder={language === "en" ? "Search tasks, location, or content type..." : "Cari nama kegiatan, lokasi, atau jenis tugas..."}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1647] dark:focus:ring-sky-500 transition placeholder:text-gray-400"
              />
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161b22] p-1 shadow-2xs self-start md:self-auto overflow-x-auto">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-[#0a1647] dark:bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {t("all")} ({userTasks.length})
              </button>
              <button
                onClick={() => setStatusFilter("PROSES")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "PROSES"
                    ? "bg-[#0a1647] dark:bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {t("in_progress")}
              </button>
              <button
                onClick={() => setStatusFilter("SELESAI")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "SELESAI"
                    ? "bg-[#0a1647] dark:bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {t("done")}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
              {language === "en" ? "Category:" : "Kategori:"}
            </span>
            {["ALL", "upacara", "rapat", "peresmian", "sidang"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-[#0a1647] dark:bg-blue-600 text-white border border-[#0a1647] dark:border-blue-600 shadow-xs"
                    : "bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-14 text-gray-400 bg-white dark:bg-[#161b22] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 text-xs shadow-xs">
                {language === "en" ? "No tasks matching filter." : "Tidak ada tugas penugasan yang sesuai filter."}
              </div>
            ) : (
              filteredTasks.map((tItem) => {
                const taskWorkflow = WORKFLOWS[tItem.bidang || userBidang || "PRAHUM"] || WORKFLOWS["PRAHUM"];
                const rawStatus = tItem.status === "COMPLETED" ? "SELESAI" : tItem.status === "ASSIGNED" ? "BELUM" : tItem.status;
                const foundIndex = taskWorkflow.indexOf(rawStatus);
                const stepIndex = foundIndex >= 0 ? foundIndex : rawStatus === "SELESAI" ? taskWorkflow.length - 1 : 0;
                const totalSteps = taskWorkflow.length;
                const isCompleted = rawStatus === "SELESAI" || tItem.status === "COMPLETED";

                return (
                  <div
                    key={tItem.id}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 hover:border-slate-400 dark:hover:border-gray-700 hover:shadow-md transition-all duration-150 flex flex-col justify-between gap-4 bg-white dark:bg-[#161b22]"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#0a1647] dark:text-sky-300">
                            {getCategoryLabel(tItem.kategori)}
                          </span>

                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                              isCompleted
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : tItem.status === "REVISI"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                : rawStatus === "BELUM"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                : "bg-blue-50 dark:bg-blue-950/40 text-[#0a1647] dark:text-sky-300 border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {isCompleted && <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />}
                            {tItem.status === "REVISI" && <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />}
                            {tItem.status === "REVISI" ? (language === "en" ? "NEEDS REVISION" : "PERLU REVISI") : rawStatus.replace("_", " ")}
                          </span>

                          <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                            {tItem.jenisPekerjaan}
                          </span>

                          {tItem.hasConflict && (
                            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                              <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
                              {t("conflict")}
                            </span>
                          )}

                          {tItem.workLink && (
                            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                              <Upload size={12} className="text-emerald-600 dark:text-emerald-400" />
                              {language === "en" ? "Deliverables Attached" : "Luaran Tersimpan"}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{tItem.kegiatan}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <MapPin size={13} className="text-[#0a1647] dark:text-sky-400" /> {tItem.lokasi}
                          </span>
                          <span className="flex items-center gap-1.5 text-[#0a1647] dark:text-sky-300 font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 rounded-md">
                            <Clock size={12} className="text-[#0a1647] dark:text-sky-400" /> {t("deadline")}: {tItem.deadline}
                          </span>
                        </div>

                        {tItem.status === "REVISI" && (tItem.revisionNotes || (tItem.revisionHistory && tItem.revisionHistory.length > 0)) && (
                          <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 rounded-xl p-3 text-xs space-y-1 mt-1">
                            <div className="flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200 font-bold">
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                                {language === "en" ? "Revision Required by Ahli Pertama" : "Perlu Perbaikan dari Ahli Pertama"}
                                {tItem.revisionAuthor && <span className="font-normal text-amber-800 dark:text-amber-400">({tItem.revisionAuthor})</span>}
                              </span>
                              {tItem.revisionDate && (
                                <span className="text-[10px] font-normal text-amber-700 dark:text-amber-400">
                                  {tItem.revisionDate}
                                </span>
                              )}
                            </div>
                            {tItem.revisionNotes && (
                              <p className="text-amber-900 dark:text-amber-300 pl-4 font-medium">
                                "{tItem.revisionNotes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedId(tItem.id)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white px-5 py-2.5 rounded-xl cursor-pointer self-start md:self-auto shadow-xs bg-[#0a1647] dark:bg-blue-600 hover:bg-[#081238] dark:hover:bg-blue-700 transition"
                      >
                        {language === "en" ? "Manage Task" : "Kelola Tugas"} <ChevronRight size={15} />
                      </button>
                    </div>

                    {/* Stepper Dot Connected Timeline */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-1">
                      <div className="relative flex items-center justify-between px-2 sm:px-4">
                        <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                        <div
                          className={`absolute left-4 top-3 h-0.5 transition-all duration-500 z-0 ${
                            isCompleted ? "bg-emerald-500" : "bg-[#0a1647] dark:bg-sky-500"
                          }`}
                          style={{
                            width: `calc(${totalSteps > 1 ? (Math.max(0, stepIndex) / (totalSteps - 1)) * 100 : 100}% - 2rem)`,
                          }}
                        />

                        {taskWorkflow.map((step, idx) => {
                          const isDone = isCompleted || idx < stepIndex;
                          const isCurrent = !isCompleted && idx === stepIndex;

                          return (
                            <div key={step} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                                  isDone
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : isCurrent
                                    ? "bg-[#0a1647] dark:bg-blue-600 text-white ring-4 ring-[#0a1647]/20 dark:ring-blue-500/30 shadow-xs scale-110"
                                    : "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 size={13} className="text-white stroke-[2.5]" />
                                ) : (
                                  idx + 1
                                )}
                              </div>

                              <span
                                className={`mt-1.5 text-[10px] font-semibold tracking-tight transition-colors select-none text-center whitespace-nowrap ${
                                  isDone
                                    ? "text-emerald-700 dark:text-emerald-400 font-bold"
                                    : isCurrent
                                    ? "text-[#0a1647] dark:text-sky-400 font-extrabold"
                                    : "text-gray-400 dark:text-gray-500"
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
