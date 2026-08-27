import { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  MessageSquare,
  Clock,
  Send,
  Eye,
} from "lucide-react";
import { usePetugasTasksStore } from "../../lib/petugas-store";
import type { PetugasTaskItem } from "../../lib/petugas-store";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";

const ReviewPage = () => {
  const { allTasks, requestRevision, approveContent } = usePetugasTasksStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEED_REVIEW" | "REVISI" | "APPROVED">("ALL");

  // Modal State for Minta Revisi
  const [selectedTaskForRevision, setSelectedTaskForRevision] = useState<PetugasTaskItem | null>(null);
  const [revisionNotesInput, setRevisionNotesInput] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Filter tasks that have work submitted or in review/revision/siap_tayang
  const reviewableTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Show tasks that have a workLink or have status DESAIN, REVISI, SIAP_TAYANG, SELESAI
      const hasWorkOrReviewStatus =
        !!t.workLink ||
        ["DESAIN", "REVISI", "SIAP_TAYANG", "SELESAI", "MENULIS"].includes(t.status);

      if (!hasWorkOrReviewStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.kegiatan.toLowerCase().includes(q);
        const matchBidang = t.bidang.toLowerCase().includes(q);
        const matchJob = t.jenisPekerjaan.toLowerCase().includes(q);
        if (!matchTitle && !matchBidang && !matchJob) return false;
      }

      if (statusFilter === "NEED_REVIEW") {
        return t.status === "DESAIN" || t.status === "MENULIS";
      }
      if (statusFilter === "REVISI") {
        return t.status === "REVISI";
      }
      if (statusFilter === "APPROVED") {
        return t.status === "SIAP_TAYANG" || t.status === "SELESAI";
      }

      return true;
    });
  }, [allTasks, searchQuery, statusFilter]);

  const handleApprove = async (task: PetugasTaskItem) => {
    try {
      await approveContent(task.id);
      showToast({
        title: "Konten Disetujui",
        description: `Tugas "${task.kegiatan}" telah disetujui dan dialihkan ke Siap Tayang.`,
        type: "success",
      });
    } catch {
      showToast({
        title: "Gagal Menyetujui",
        description: "Terjadi kesalahan saat menyetujui konten.",
        type: "error",
      });
    }
  };

  const handleOpenRevisionModal = (task: PetugasTaskItem) => {
    setSelectedTaskForRevision(task);
    setRevisionNotesInput(task.revisionNotes || "");
  };

  const handleSubmitRevision = async () => {
    if (!selectedTaskForRevision) return;
    if (!revisionNotesInput.trim()) {
      showToast({
        title: "Catatan Kosong",
        description: "Harap masukkan catatan revisi untuk petugas.",
        type: "warning",
      });
      return;
    }

    setIsSubmittingRevision(true);
    try {
      await requestRevision(selectedTaskForRevision.id, revisionNotesInput.trim(), "Admin Diskominfo");
      showToast({
        title: "Revisi Dikirim",
        description: `Catatan revisi berhasil dikirim ke Petugas Lapangan (${selectedTaskForRevision.bidang}).`,
        type: "success",
      });
      setSelectedTaskForRevision(null);
      setRevisionNotesInput("");
    } catch {
      showToast({
        title: "Gagal Mengirim",
        description: "Terjadi kesalahan saat mengirim catatan revisi.",
        type: "error",
      });
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Review &amp; Kontrol Kualitas Konten
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Evaluasi draf hasil liputan, naskah berita, dan desain grafis sebelum diterbitkan ke publik
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul kegiatan, jenis konten, atau bidang..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a1647]/20 focus:border-[#0a1647] transition placeholder:text-gray-400"
          />
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter("NEED_REVIEW")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "NEED_REVIEW"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Menunggu Review
          </button>
          <button
            onClick={() => setStatusFilter("REVISI")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "REVISI"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Perlu Revisi
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Disetujui
          </button>
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="space-y-4">
        {reviewableTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-xs text-gray-400">
            Tidak ada pengajuan konten yang memerlukan review pada filter ini.
          </div>
        ) : (
          reviewableTasks.map((task) => {
            const isRevision = task.status === "REVISI";
            const isApproved = task.status === "SIAP_TAYANG" || task.status === "SELESAI";

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-150 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Metadata & Title */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                        {task.bidang}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                        {task.jenisPekerjaan}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : isRevision
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-blue-50 text-[#0a1647] border-[#0a1647]/30"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Disetujui (Siap Tayang)</span>
                          </>
                        ) : isRevision ? (
                          <>
                            <AlertTriangle size={13} className="text-amber-600" />
                            <span>Status: Perlu Revisi</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} className="text-[#0a1647]" />
                            <span>Menunggu Review Admin</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                      {task.kegiatan}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-0.5">
                      <span>Lokasi: <strong className="text-gray-700">{task.lokasi}</strong></span>
                      <span>Deadline: <strong className="text-gray-700">{task.deadline}</strong></span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                    {task.workLink && (
                      <a
                        href={task.workLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-[#0a1647] bg-blue-50/80 hover:bg-blue-100 border border-[#0a1647]/20 transition cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Pratinjau Draf</span>
                        <ExternalLink size={12} className="opacity-70" />
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenRevisionModal(task)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isRevision
                          ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <MessageSquare size={14} />
                      <span>{isRevision ? "Ubah Catatan Revisi" : "Minta Revisi"}</span>
                    </button>

                    <button
                      onClick={() => handleApprove(task)}
                      disabled={isApproved}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default opacity-80"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isApproved ? "Sudah Disetujui" : "Setujui Konten"}</span>
                    </button>
                  </div>
                </div>

                {/* Revision Notes Callout (if active) */}
                {task.revisionNotes && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 sm:p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 text-amber-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600" />
                        Catatan Revisi Terakhir ({task.revisionAuthor || "Admin"})
                      </span>
                      {task.revisionDate && (
                        <span className="text-[11px] font-normal text-amber-700">
                          {task.revisionDate}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-900 leading-relaxed pl-5 font-medium">
                      "{task.revisionNotes}"
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Revision Modal Dialog */}
      <Dialog
        open={!!selectedTaskForRevision}
        onClose={() => setSelectedTaskForRevision(null)}
        title="Ajukan Catatan Koreksi & Revisi"
        size="md"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTaskForRevision(null)}
              disabled={isSubmittingRevision}
            >
              Batal
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmitRevision}
              disabled={isSubmittingRevision || !revisionNotesInput.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Send size={13} className="mr-1.5" />
              {isSubmittingRevision ? "Mengirim..." : "Kirim Catatan Revisi"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <p className="font-semibold text-gray-900">
              Kegiatan: <span className="font-normal text-gray-700">{selectedTaskForRevision?.kegiatan}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Bidang: <strong>{selectedTaskForRevision?.bidang}</strong> • {selectedTaskForRevision?.jenisPekerjaan}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-gray-800 text-xs uppercase tracking-wider">
              Catatan Koreksi / Detail Bagian yang Perlu Direvisi:
            </label>
            <textarea
              rows={4}
              value={revisionNotesInput}
              onChange={(e) => setRevisionNotesInput(e.target.value)}
              placeholder="Contoh: Tolong sesuaikan palet warna diagram dengan branding resmi Pemkot dan perbaiki kontras font pada bagian footer."
              className="w-full p-3 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition placeholder:text-gray-400"
            />
            <p className="text-[11px] text-gray-500">
              * Catatan ini akan langsung tampil di banner ruang kerja Petugas Lapangan terkait.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ReviewPage;
