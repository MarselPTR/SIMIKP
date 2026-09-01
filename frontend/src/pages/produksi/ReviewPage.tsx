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
  MapPin,
  Upload,
} from "lucide-react";
import { usePetugasTasksStore } from "../../lib/petugas-store";
import type { PetugasTaskItem } from "../../lib/petugas-store";
import { WORKFLOWS } from "../../lib/mock-data";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";

const categoryLabels: Record<string, string> = {
  upacara: "Upacara",
  rapat: "Rapat",
  peresmian: "Peresmian",
  sidang: "Sidang",
};

const ReviewPage = () => {
  const { allTasks, requestRevision, approveContent } = usePetugasTasksStore();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEED_REVIEW" | "REVISI" | "APPROVED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modal State for Minta Revisi
  const [selectedTaskForRevision, setSelectedTaskForRevision] = useState<PetugasTaskItem | null>(null);
  const [revisionNotesInput, setRevisionNotesInput] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Spotlight mouse effect handlers (Identical to PetugasPenugasanPage)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--x", `-1000px`);
    e.currentTarget.style.setProperty("--y", `-1000px`);
  };

  // Filter tasks that have work submitted or in review/revision/siap_tayang
  const reviewableTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (categoryFilter !== "ALL" && t.kategori !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.kegiatan.toLowerCase().includes(q);
        const matchBidang = t.bidang.toLowerCase().includes(q);
        const matchJob = t.jenisPekerjaan.toLowerCase().includes(q);
        const matchLocation = t.lokasi.toLowerCase().includes(q);
        if (!matchTitle && !matchBidang && !matchJob && !matchLocation) return false;
      }

      if (statusFilter === "NEED_REVIEW") {
        return t.status === "DESAIN" || t.status === "MENULIS" || t.status === "LIPUTAN";
      }
      if (statusFilter === "REVISI") {
        return t.status === "REVISI";
      }
      if (statusFilter === "APPROVED") {
        return t.status === "SIAP_TAYANG" || t.status === "SELESAI";
      }

      return true;
    });
  }, [allTasks, searchQuery, statusFilter, categoryFilter]);

  const handleApprove = async (task: PetugasTaskItem) => {
    try {
      await approveContent(task.id);
      addToast(`Tugas "${task.kegiatan}" berhasil disetujui untuk penayangan!`, "success");
    } catch {
      addToast("Terjadi kesalahan saat menyetujui konten.", "error");
    }
  };

  const handleOpenRevisionModal = (task: PetugasTaskItem) => {
    setSelectedTaskForRevision(task);
    setRevisionNotesInput(task.revisionNotes || "");
  };

  const handleSubmitRevision = async () => {
    if (!selectedTaskForRevision) return;
    if (!revisionNotesInput.trim()) {
      addToast("Harap masukkan catatan revisi untuk petugas.", "warning");
      return;
    }

    setIsSubmittingRevision(true);
    try {
      await requestRevision(selectedTaskForRevision.id, revisionNotesInput.trim(), "Admin Diskominfo");
      addToast(`Catatan revisi berhasil dikirim ke Petugas (${selectedTaskForRevision.bidang}).`, "success");
      setSelectedTaskForRevision(null);
      setRevisionNotesInput("");
    } catch {
      addToast("Terjadi kesalahan saat mengirim catatan revisi.", "error");
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Review &amp; Kontrol Kualitas Konten
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Evaluasi draf hasil liputan, naskah berita, dan desain grafis sebelum diterbitkan ke publik
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-[#0a1647] border border-[#0a1647]/30 shadow-xs">
            Portal Admin SIMIKP
          </span>
        </div>
      </div>

      {/* 2. Top Search Bar & Status Segmented Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input with standard padding pl-10 */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kegiatan, jenis konten, lokasi, atau bidang..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a1647]/20 focus:border-[#0a1647] transition placeholder:text-gray-400"
          />
        </div>

        {/* Status Segmented Tabs (Midnight Navy Styled) */}
        <div className="inline-flex rounded-lg border border-[#0a1647]/30 bg-white p-0.5 shadow-2xs self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-[#0a1647] hover:bg-[#0a1647]/5"
            }`}
          >
            Semua ({allTasks.length})
          </button>
          <button
            onClick={() => setStatusFilter("NEED_REVIEW")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "NEED_REVIEW"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-[#0a1647] hover:bg-[#0a1647]/5"
            }`}
          >
            Menunggu Review
          </button>
          <button
            onClick={() => setStatusFilter("REVISI")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "REVISI"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-[#0a1647] hover:bg-[#0a1647]/5"
            }`}
          >
            Perlu Revisi
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-[#0a1647] text-white shadow-xs"
                : "text-[#0a1647] hover:bg-[#0a1647]/5"
            }`}
          >
            Disetujui
          </button>
        </div>
      </div>

      {/* Category Filter Pills (Biru Gelap) */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-xs font-semibold text-gray-500 mr-1">Kategori Agenda:</span>
        <button
          onClick={() => setCategoryFilter("ALL")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            categoryFilter === "ALL"
              ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
              : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setCategoryFilter("upacara")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            categoryFilter === "upacara"
              ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
              : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5"
          }`}
        >
          Upacara
        </button>
        <button
          onClick={() => setCategoryFilter("rapat")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            categoryFilter === "rapat"
              ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
              : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5"
          }`}
        >
          Rapat
        </button>
        <button
          onClick={() => setCategoryFilter("peresmian")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            categoryFilter === "peresmian"
              ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
              : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5"
          }`}
        >
          Peresmian
        </button>
        <button
          onClick={() => setCategoryFilter("sidang")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            categoryFilter === "sidang"
              ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
              : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5"
          }`}
        >
          Sidang
        </button>
      </div>

      {/* 3. Review Cards List (Styled Exactly Like PetugasPenugasanPage with Stepper Timeline) */}
      <div className="space-y-4 pt-1">
        {reviewableTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#0a1647]/30 text-xs text-gray-400 shadow-xs">
            Tidak ada pengajuan konten yang sesuai filter review saat ini.
          </div>
        ) : (
          reviewableTasks.map((t) => {
            const taskWorkflow = WORKFLOWS[t.bidang || "PRAHUM"] || WORKFLOWS["PRAHUM"];
            const rawStatus = t.status === "COMPLETED" ? "SELESAI" : t.status === "ASSIGNED" ? "BELUM" : t.status;
            const foundIndex = taskWorkflow.indexOf(rawStatus);
            const stepIndex = foundIndex >= 0 ? foundIndex : rawStatus === "SELESAI" ? taskWorkflow.length - 1 : 0;
            const totalSteps = taskWorkflow.length;
            const isCompleted = rawStatus === "SELESAI" || t.status === "COMPLETED";
            const isApproved = t.status === "SIAP_TAYANG" || isCompleted;
            const isRevision = t.status === "REVISI";

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
                {/* Header Information and Action Buttons Row */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Uniform Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. Category Badge */}
                      <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                        {categoryLabels[t.kategori] || t.kategori}
                      </span>

                      {/* 2. Sektor / Bidang Badge */}
                      <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                        {t.bidang}
                      </span>

                      {/* 3. Status Badge with Dynamic Color */}
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                          isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : isRevision
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : rawStatus === "BELUM"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-blue-50 text-[#0a1647] border-[#0a1647]/30"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>{isCompleted ? "SELESAI (100%)" : "Disetujui (Siap Tayang)"}</span>
                          </>
                        ) : isRevision ? (
                          <>
                            <AlertTriangle size={13} className="text-amber-600" />
                            <span>Status: Perlu Revisi</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} className="text-[#0a1647]" />
                            <span>{rawStatus.replace("_", " ")}</span>
                          </>
                        )}
                      </span>

                      {/* 4. Job Type Badge */}
                      <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                        {t.jenisPekerjaan}
                      </span>

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

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                      {t.kegiatan}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-0.5">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <MapPin size={13} className="text-[#0a1647]" /> {t.lokasi}
                      </span>
                      <span className="flex items-center gap-1.5 text-[#0a1647] font-semibold bg-white border border-[#0a1647]/30 px-2.5 py-0.5 rounded-md">
                        <Clock size={12} className="text-[#0a1647]" /> Deadline: {t.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Review Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                    {t.workLink && (
                      <a
                        href={t.workLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-[#0a1647] bg-white hover:bg-blue-50/80 border border-[#0a1647]/30 shadow-2xs transition cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Pratinjau Draf</span>
                        <ExternalLink size={12} className="opacity-70" />
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenRevisionModal(t)}
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
                      onClick={() => handleApprove(t)}
                      disabled={isApproved}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default opacity-80"
                          : "bg-[#0a1647] hover:bg-[#122368] text-white"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isApproved ? "Sudah Disetujui" : "Setujui Konten"}</span>
                    </button>
                  </div>
                </div>

                {/* Revision Notes Callout (if active) */}
                {t.revisionNotes && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 sm:p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 text-amber-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600" />
                        Catatan Koreksi &amp; Revisi dari Admin ({t.revisionAuthor || "Admin Diskominfo"})
                      </span>
                      {t.revisionDate && (
                        <span className="text-[11px] font-normal text-amber-700">
                          {t.revisionDate}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-900 leading-relaxed pl-5 font-medium">
                      "{t.revisionNotes}"
                    </p>
                  </div>
                )}

                {/* ── Option A: Stepper Dot Connected Timeline Ramping & Formal ── */}
                <div className="pt-3 border-t border-gray-100/90 mt-1">
                  <div className="relative flex items-center justify-between px-2 sm:px-4">
                    {/* Connecting background track */}
                    <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200 z-0" />
                    {/* Active colored progress track */}
                    <div
                      className={`absolute left-4 top-3 h-0.5 transition-all duration-500 z-0 ${
                        isCompleted ? "bg-emerald-500" : isRevision ? "bg-amber-500" : "bg-[#0a1647]"
                      }`}
                      style={{
                        width: `calc(${totalSteps > 1 ? (Math.max(0, stepIndex) / (totalSteps - 1)) * 100 : 100}% - 2rem)`,
                      }}
                    />

                    {/* Step Nodes */}
                    {taskWorkflow.map((step, idx) => {
                      const isDone = isCompleted || idx < stepIndex;
                      const isCurrent = !isCompleted && idx === stepIndex;
                      const isRevisionNode = step === "REVISI";

                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                          {/* Node Circle */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                              isDone
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : isCurrent
                                ? isRevisionNode
                                  ? "bg-amber-600 text-white ring-4 ring-amber-500/25 shadow-xs scale-110"
                                  : "bg-[#0a1647] text-white ring-4 ring-[#0a1647]/20 shadow-xs scale-110"
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
                                ? isRevisionNode
                                  ? "text-amber-700 font-extrabold"
                                  : "text-[#0a1647] font-extrabold"
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
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
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
