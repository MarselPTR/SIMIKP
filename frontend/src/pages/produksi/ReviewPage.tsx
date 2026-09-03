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
  History,
} from "lucide-react";
import { usePetugasTasksStore } from "../../lib/petugas-store";
import type { PetugasTaskItem } from "../../lib/petugas-store";
import { WORKFLOWS } from "../../lib/mock-data";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";
import { useAuth } from "../../lib/AuthContext";

const CATEGORY_MAP: Record<string, { id: string; en: string }> = {
  upacara: { id: "Upacara", en: "Ceremony" },
  rapat: { id: "Rapat", en: "Meeting" },
  peresmian: { id: "Peresmian", en: "Inauguration" },
  sidang: { id: "Sidang", en: "Hearing / Session" },
};

const ReviewPage = () => {
  const { allTasks, requestRevision, approveContent } = usePetugasTasksStore();
  const { addToast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEED_REVIEW" | "REVISI" | "APPROVED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modal State for Minta Revisi
  const [selectedTaskForRevision, setSelectedTaskForRevision] = useState<PetugasTaskItem | null>(null);
  const [revisionNotesInput, setRevisionNotesInput] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Modal state untuk pratinjau naskah Prahum (bukan tautan berkas)
  const [previewNaskahTask, setPreviewNaskahTask] = useState<PetugasTaskItem | null>(null);

  const getCategoryLabel = (cat: string) => {
    if (cat === "ALL") return t("all");
    const found = CATEGORY_MAP[cat];
    if (found) return language === "en" ? found.en : found.id;
    return cat;
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

      const rawStatus = t.status.toUpperCase();
      const isApproved = rawStatus === "SIAP_TAYANG" || rawStatus === "SELESAI" || rawStatus === "COMPLETED";
      const isRevision = rawStatus.includes("REVISI");

      if (statusFilter === "NEED_REVIEW") {
        return !isApproved && !isRevision && rawStatus !== "BELUM";
      }
      if (statusFilter === "REVISI") {
        return isRevision;
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
      addToast(
        language === "en"
          ? `Task "${task.kegiatan}" approved for publication!`
          : `Tugas "${task.kegiatan}" berhasil disetujui untuk penayangan!`,
        "success",
      );
    } catch {
      addToast(t("error"), "error");
    }
  };

  const handleOpenRevisionModal = (task: PetugasTaskItem) => {
    setSelectedTaskForRevision(task);
    setRevisionNotesInput(task.revisionNotes || "");
  };

  const handleSubmitRevision = async () => {
    if (!selectedTaskForRevision) return;
    if (!revisionNotesInput.trim()) {
      addToast(
        language === "en"
          ? "Please provide revision notes for the officer."
          : "Harap masukkan catatan revisi untuk petugas.",
        "warning",
      );
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const authorName = user?.name || (language === "en" ? "First Expert Officer" : "Pranata Ahli Pertama");
      await requestRevision(selectedTaskForRevision.id, revisionNotesInput.trim(), authorName);
      addToast(
        language === "en"
          ? `Revision notes sent to officer (${selectedTaskForRevision.bidang}).`
          : `Catatan revisi berhasil dikirim ke Petugas (${selectedTaskForRevision.bidang}).`,
        "success",
      );
      setSelectedTaskForRevision(null);
      setRevisionNotesInput("");
    } catch {
      addToast(t("error"), "error");
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400">
            {t("review_title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("review_subtitle")}
          </p>
        </div>
      </div>

      {/* 2. Top Search Bar & Status Segmented Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("review_search_ph")}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]/20 dark:focus:ring-sky-500/20 transition placeholder:text-gray-400"
          />
        </div>

        {/* Status Segmented Tabs */}
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-1 shadow-xs self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_all")} ({allTasks.length})
          </button>
          <button
            onClick={() => setStatusFilter("NEED_REVIEW")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "NEED_REVIEW"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_need_review")}
          </button>
          <button
            onClick={() => setStatusFilter("REVISI")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "REVISI"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_revision")}
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_approved")}
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">{t("review_category_filter")}</span>
        {["ALL", "upacara", "rapat", "peresmian", "sidang"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === cat
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* 3. Review Cards List */}
      <div className="space-y-4 pt-1">
        {reviewableTasks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#161b22] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 shadow-xs">
            {t("review_no_tasks")}
          </div>
        ) : (
          reviewableTasks.map((tItem) => {
            const taskWorkflow = WORKFLOWS[tItem.bidang || "PRAHUM"] || WORKFLOWS["PRAHUM"];
            const rawStatus = tItem.status === "COMPLETED" ? "SELESAI" : tItem.status === "ASSIGNED" ? "BELUM" : tItem.status;
            const foundIndex = taskWorkflow.indexOf(rawStatus);
            const stepIndex = foundIndex >= 0 ? foundIndex : rawStatus === "SELESAI" ? taskWorkflow.length - 1 : 0;
            const totalSteps = taskWorkflow.length;
            const isCompleted = rawStatus === "SELESAI" || tItem.status === "COMPLETED";
            const isApproved = tItem.status === "SIAP_TAYANG" || isCompleted;
            const isRevision = tItem.status === "REVISI";

            return (
              <div
                key={tItem.id}
                className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-sky-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 bg-white dark:bg-[#161b22]"
              >
                {/* Header Information and Action Buttons Row */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {getCategoryLabel(tItem.kategori)}
                      </span>
                      <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {tItem.bidang}
                      </span>

                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                          isApproved
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : isRevision
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : rawStatus === "BELUM"
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                            : "bg-blue-50 dark:bg-blue-950/50 text-[#0f1f5c] dark:text-sky-300 border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{isCompleted ? (language === "en" ? "COMPLETED (100%)" : "SELESAI (100%)") : (language === "en" ? "Approved (Ready to Publish)" : "Disetujui (Siap Tayang)")}</span>
                          </>
                        ) : isRevision ? (
                          <>
                            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                            <span>{language === "en" ? "Status: Needs Revision" : "Status: Perlu Revisi"}</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} className="text-[#0f1f5c] dark:text-sky-400" />
                            <span>{rawStatus.replace("_", " ")}</span>
                          </>
                        )}
                      </span>

                      <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                        {tItem.jenisPekerjaan}
                      </span>

                      {tItem.hasConflict && (
                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
                          {t("conflict")}
                        </span>
                      )}

                      {tItem.workLink && (
                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <Upload size={12} className="text-emerald-600 dark:text-emerald-400" />
                          {language === "en" ? "Deliverables Attached" : "Luaran Tersimpan"}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                      {tItem.kegiatan}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#0f1f5c] dark:text-sky-400" /> {tItem.lokasi}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 rounded-md">
                        <Clock size={12} className="text-[#0f1f5c] dark:text-sky-400" /> {t("deadline")}: {tItem.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Review Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                    {tItem.workLink && (
                      tItem.bidang === "PRAHUM" ? (
                        <button
                          type="button"
                          onClick={() => setPreviewNaskahTask(tItem)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>{language === "en" ? "Read Article" : "Baca Naskah"}</span>
                        </button>
                      ) : (
                        <a
                          href={tItem.workLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>{t("review_btn_preview")}</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      )
                    )}

                    <button
                      onClick={() => handleOpenRevisionModal(tItem)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isRevision
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <MessageSquare size={14} />
                      <span>{isRevision ? t("review_btn_edit_revision") : t("review_btn_request_revision")}</span>
                    </button>

                    <button
                      onClick={() => handleApprove(tItem)}
                      disabled={isApproved}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                        isApproved
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default opacity-80"
                          : "bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#122368] dark:hover:bg-blue-700 text-white"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isApproved ? t("review_btn_approved_done") : t("review_btn_approve")}</span>
                    </button>
                  </div>
                </div>

                {/* Revision Notes Callout */}
                {(tItem.revisionNotes || (tItem.revisionHistory && tItem.revisionHistory.length > 0)) && (
                  <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200 font-bold border-b border-amber-200/80 dark:border-amber-800/60 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                        {t("review_notes_title")} ({tItem.revisionAuthor || "Pranata Ahli Pertama"})
                      </span>
                      {tItem.revisionDate && (
                        <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                          {tItem.revisionDate}
                        </span>
                      )}
                    </div>
                    {tItem.revisionNotes && (
                      <p className="text-amber-900 dark:text-amber-300 leading-relaxed pl-1 sm:pl-5 font-medium">
                        "{tItem.revisionNotes}"
                      </p>
                    )}

                    {/* Historical entries log */}
                    {tItem.revisionHistory && tItem.revisionHistory.length > 1 && (
                      <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                          <History size={12} className="text-amber-600" />
                          <span>{language === "en" ? "Revision History" : "Riwayat Catatan"} ({tItem.revisionHistory.length} {language === "en" ? "rounds" : "putaran"})</span>
                        </span>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {tItem.revisionHistory.map((h, hIdx) => (
                            <div key={h.id || hIdx} className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-2 border border-amber-200/50 dark:border-amber-800/40 text-[11px]">
                              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[10px]">
                                <span className="font-bold text-amber-900 dark:text-amber-200">#{hIdx + 1} • {h.author}</span>
                                <span>{h.date}</span>
                              </div>
                              <p className="text-gray-800 dark:text-gray-200 mt-0.5">"{h.notes}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stepper Timeline */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-1">
                  <div className="relative flex items-center justify-between px-2 sm:px-4">
                    <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                    <div
                      className={`absolute left-4 top-3 h-0.5 transition-all duration-500 z-0 ${
                        isCompleted ? "bg-emerald-500" : isRevision ? "bg-amber-500" : "bg-[#0f1f5c] dark:bg-blue-500"
                      }`}
                      style={{
                        width: `calc(${totalSteps > 1 ? (Math.max(0, stepIndex) / (totalSteps - 1)) * 100 : 100}% - 2rem)`,
                      }}
                    />

                    {taskWorkflow.map((step, idx) => {
                      const isDone = isCompleted || idx < stepIndex;
                      const isCurrent = !isCompleted && idx === stepIndex;
                      const isRevisionNode = step === "REVISI";

                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                              isDone
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : isCurrent
                                ? isRevisionNode
                                   ? "bg-amber-600 text-white ring-4 ring-amber-500/25 shadow-xs scale-110"
                                  : "bg-[#0f1f5c] dark:bg-blue-600 text-white ring-4 ring-[#0f1f5c]/20 dark:ring-blue-400/25 shadow-xs scale-110"
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
                                ? isRevisionNode
                                  ? "text-amber-700 dark:text-amber-400 font-extrabold"
                                  : "text-[#0f1f5c] dark:text-sky-400 font-extrabold"
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

      {/* Revision Modal Dialog */}
      <Dialog
        open={!!selectedTaskForRevision}
        onClose={() => setSelectedTaskForRevision(null)}
        title={t("review_modal_revision_title")}
        size="md"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTaskForRevision(null)}
              disabled={isSubmittingRevision}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmitRevision}
              disabled={isSubmittingRevision || !revisionNotesInput.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              <Send size={13} className="mr-1.5" />
              {isSubmittingRevision ? t("saving") : t("review_modal_send_btn")}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {language === "en" ? "Activity" : "Kegiatan"}: <span className="font-normal text-gray-700 dark:text-gray-300">{selectedTaskForRevision?.kegiatan}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {language === "en" ? "Division" : "Bidang"}: <strong>{selectedTaskForRevision?.bidang}</strong> • {selectedTaskForRevision?.jenisPekerjaan}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
              {language === "en" ? "Correction Notes / Parts that Need Revision:" : "Catatan Koreksi / Detail Bagian yang Perlu Direvisi:"}
            </label>
            <textarea
              rows={4}
              value={revisionNotesInput}
              onChange={(e) => setRevisionNotesInput(e.target.value)}
              placeholder={t("review_modal_revision_ph")}
              className="w-full p-3 text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition placeholder:text-gray-400"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === "en" ? "* These notes will instantly appear in the officer's workspace." : "* Catatan ini akan langsung tampil di banner ruang kerja Petugas Lapangan terkait."}
            </p>
          </div>
        </div>
      </Dialog>

      {/* Naskah Preview Dialog (Prahum) */}
      <Dialog
        open={!!previewNaskahTask}
        onClose={() => setPreviewNaskahTask(null)}
        title={language === "en" ? "Article Text" : "Isi Naskah Berita"}
        size="lg"
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <p className="font-bold text-gray-900 dark:text-gray-100">
            {language === "en" ? "Activity" : "Kegiatan"}: <span className="font-normal text-gray-700 dark:text-gray-300">{previewNaskahTask?.kegiatan}</span>
          </p>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 border border-gray-100 dark:border-gray-800 max-h-[60vh] overflow-y-auto">
            {previewNaskahTask?.workLink}
          </p>
        </div>
      </Dialog>
    </div>
  );
};

export default ReviewPage;
