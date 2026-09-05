import { useState, useMemo, useEffect, useRef } from "react";
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
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  X,
  Loader2,
  Play,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { usePetugasTasksStore, type MediaFileInfo, type MediaWorkPayload } from "../../lib/petugas-store";
import { WORKFLOWS } from "../../lib/constants";
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
  const { tasks: userTasks, submitWork: storeSubmitWork, updateStatus: storeUpdateStatus } = usePetugasTasksStore(user?.id);
  const userBidang = userTasks[0]?.bidang || "PRAHUM";

  const searchParams = new URLSearchParams(location.search);
  const paramTaskId = searchParams.get("taskId") || searchParams.get("id");
  const stateTaskId = (location.state as { taskId?: string } | null)?.taskId;
  const initialTaskId = stateTaskId || paramTaskId || null;
  const [selectedId, setSelectedId] = useState<string | null>(initialTaskId);

  // Sync selected task when navigated from notifications or external links
  useEffect(() => {
    const sId = (location.state as { taskId?: string } | null)?.taskId;
    const pId = new URLSearchParams(location.search).get("taskId") || new URLSearchParams(location.search).get("id");
    const target = sId || pId;
    if (target) {
      setSelectedId(target);
    }
  }, [location.state, location.search]);

  const [uploadLink, setUploadLink] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Media upload state
  const [activeMediaTab, setActiveMediaTab] = useState<"foto" | "video">("foto");
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedDesignMain, setSelectedDesignMain] = useState<File | null>(null);
  const [selectedDesignMaster, setSelectedDesignMaster] = useState<File | null>(null);

  const [caption, setCaption] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("Feed Instagram (1:1)");
  const [editorNotes, setEditorNotes] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const designMainInputRef = useRef<HTMLInputElement>(null);
  const designMasterInputRef = useRef<HTMLInputElement>(null);

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
      if (selectedTask.mediaData) {
        setCaption(selectedTask.mediaData.caption || "");
        setTargetPlatform(selectedTask.mediaData.targetPlatform || "Feed Instagram (1:1)");
        setEditorNotes(selectedTask.mediaData.editorNotes || "");
        if (selectedTask.mediaData.subType === "video") {
          setActiveMediaTab("video");
        } else {
          setActiveMediaTab("foto");
        }
      } else {
        setCaption(selectedTask.caption || "");
        setTargetPlatform(selectedTask.targetPlatform || "Feed Instagram (1:1)");
        setEditorNotes(selectedTask.editorNotes || "");
      }
      setSelectedPhotoFiles([]);
      setSelectedVideoFile(null);
      setSelectedDesignMain(null);
      setSelectedDesignMaster(null);
      setUploadPercent(null);
      setUploadProgressText("");
    }
  }, [selectedTask]);

  const uploadFilesWithProgress = (files: File[]): Promise<MediaFileInfo[]> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadPercent(pct);
          const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (e.total / (1024 * 1024)).toFixed(1);
          setUploadProgressText(`${pct}% (${loadedMB} MB / ${totalMB} MB)`);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.files || []);
          } catch (err) {
            reject(new Error("Format respon server tidak valid"));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || "Gagal mengunggah berkas"));
          } catch {
            reject(new Error(`Gagal mengunggah berkas (HTTP ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Terjadi kesalahan koneksi jaringan saat mengunggah"));
      xhr.open("POST", "/api/v1/storage/upload");
      xhr.send(formData);
    });
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
          (t.lokasi || "").toLowerCase().includes(q)
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
          const rawStatus = selectedTask.status.toUpperCase();
          const isRevision = rawStatus === "REVISI";
          const isResubmitted = (rawStatus === "MENULIS" || rawStatus === "DESAIN" || rawStatus === "LIPUTAN" || rawStatus === "IN_PROGRESS" || rawStatus === "KURASI") && selectedTask.revisionNotes;
          const isPrahum = selectedTask.bidang === "PRAHUM";
          const isEditor = selectedTask.bidang === "DESAINER_EDITOR";
          const isFotoVideo = selectedTask.bidang === "FOTOGRAFER" || selectedTask.bidang === "VIDEOGRAFER" || selectedTask.bidang === "FOTO_VIDEO";
          const isCompleted = rawStatus === "SELESAI" || selectedTask.status === "COMPLETED";

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
                        : isResubmitted
                        ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-400 dark:border-orange-500 shadow-xs animate-pulse font-extrabold"
                        : isRevision
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse"
                        : rawStatus === "BELUM"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                        : "bg-blue-50 dark:bg-blue-950/40 text-[#0a1647] dark:text-sky-300 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{language === "en" ? "Task Completed" : "Tugas Selesai"}</span>
                      </>
                    ) : isResubmitted ? (
                      <>
                        <Clock size={14} className="text-orange-600 dark:text-orange-400" />
                        <span>{language === "en" ? "Waiting for Re-Review" : "Menunggu Review Ulang"}</span>
                      </>
                    ) : isRevision ? (
                      <>
                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                        <span>{language === "en" ? "Needs Revision" : "Perlu Direvisi"}</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-[#0a1647] dark:text-sky-400" />
                        <span>{rawStatus.replace("_", " ")}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {isRevision && selectedTask.revisionNotes && (
                <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{language === "en" ? "Correction Notes from Ahli Pertama" : "Catatan Perbaikan dari Ahli Pertama"}</span>
                    </div>
                    {selectedTask.revisionDate && (
                      <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                        {new Date(selectedTask.revisionDate).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + (language === "en" ? "" : " WIB")}
                      </span>
                    )}
                  </div>
                  <div className="bg-white/80 dark:bg-amber-950/50 rounded-xl p-3.5 border border-amber-200/60 dark:border-amber-800/40">
                    <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      "{selectedTask.revisionNotes}"
                    </p>
                  </div>
                  {selectedTask.revisionAuthor && (
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {language === "en" ? "Evaluated by:" : "Penilai:"} <span className="font-semibold">{selectedTask.revisionAuthor}</span>
                    </p>
                  )}

                  {selectedTask.revisionHistory && selectedTask.revisionHistory.length > 1 && (
                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 space-y-2">
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <History size={13} />
                        {language === "en" ? "Previous Revision History" : "Riwayat Catatan Sebelumnya"}
                      </span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedTask.revisionHistory.slice(0, -1).reverse().map((rev) => (
                          <div key={rev.id} className="text-[11px] bg-white/50 dark:bg-gray-900/40 rounded-lg p-2 border border-amber-100 dark:border-amber-900/30">
                            <span className="text-gray-500 dark:text-gray-400">{rev.date}: </span>
                            <p className="text-gray-800 dark:text-gray-200 font-medium">"{rev.notes}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="lg:col-span-4 bg-slate-50/80 dark:bg-gray-900/60 rounded-2xl border border-slate-200 dark:border-gray-800 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[#0a1647] dark:text-sky-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200/80 dark:border-gray-800 pb-2">
                    <FileText size={16} />
                    <span>{language === "en" ? "Task Instructions" : "Lembar Instruksi Penugasan"}</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedTask.instruksi || (language === "en"
                      ? "Execute coverage documentation comprehensively matching Batu City Government standards. Ensure photos/videos or news articles are stored in high resolution."
                      : "Laksanakan liputan dokumentasi kegiatan secara komprehensif sesuai standar Diskominfo Kota Batu. Pastikan materi tersimpan dalam resolusi tinggi.")}
                  </p>
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
                      {language === "en" ? "Diskominfo Internal Server Storage" : "Penyimpanan Internal VPS Kominfo"}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === "en"
                        ? "Photo, video, and design files are saved directly and securely to Batu City internal servers."
                        : "Berkas foto, video, dan desain langsung disimpan aman di harddisk server internal Pemkot Batu (bebas Google Drive)."}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-8 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 shadow-xs">
                  {rawStatus === "BELUM" ? (
                    <div className="text-center py-16 space-y-5">
                      <div className="bg-blue-50 dark:bg-sky-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Play size={36} className="text-blue-600 dark:text-sky-400 ml-1" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {language === "en" ? "Time to Start Assignment" : "Waktunya Memulai Tugas"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                        {language === "en"
                          ? "Please click the button below to start your assignment and unlock the upload form."
                          : "Silakan klik tombol di bawah ini untuk mulai bekerja dan membuka form pengunggahan berkas."}
                      </p>
                      
                      {selectedTask.waktuPelaksanaan && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium mt-2">
                          <Clock size={16} />
                          <span>
                            {new Date(selectedTask.waktuPelaksanaan).toLocaleString(language === "en" ? "en-US" : "id-ID")}
                          </span>
                        </div>
                      )}

                      <div>
                        <button
                          onClick={async () => {
                            try {
                              await storeUpdateStatus(selectedTask.id, isPrahum ? "LIPUTAN" : isEditor ? "DESAIN" : "LIPUTAN");
                              addToast(language === "en" ? "Task started successfully!" : "Tugas berhasil dimulai!", "success");
                            } catch (err: any) {
                              addToast(err?.message || (language === "en" ? "Failed to start task" : "Gagal memulai tugas"), "error");
                            }
                          }}
                          className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
                        >
                          {language === "en" ? "Start Assignment" : "Mulai Meliput"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {isPrahum ? (
                        <>
                          <FileText size={16} className="text-blue-600" />
                          <span>
                            {isRevision
                              ? (language === "en" ? "Revised PR Script Text" : "Teks Naskah Hasil Perbaikan")
                              : (language === "en" ? "Online News Script Content" : "Isi Naskah Berita Online")}
                          </span>
                        </>
                      ) : isEditor ? (
                        <>
                          <Layers size={16} className="text-purple-600" />
                          <span>
                            {isRevision
                              ? (language === "en" ? "Upload Revised Design & Files" : "Unggah Desain & Berkas Revisi")
                              : (language === "en" ? "Upload Graphic Design & Master Files" : "Unggah Hasil Desain Grafis & Master File")}
                          </span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={16} className="text-sky-600" />
                          <span>
                            {isRevision
                              ? (language === "en" ? "Upload Revised Photos/Videos" : "Unggah Berkas Foto/Video Revisi")
                              : (language === "en" ? "Upload Coverage Media (Photos & Videos)" : "Unggah Berkas Liputan (Foto & Video)")}
                          </span>
                        </>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isPrahum
                        ? (language === "en" ? "Type official news press release below for review by First Expert Officer." : "Ketik naskah rilis pers resmi Kota Batu di bawah ini untuk ditelaah oleh Pranata Humas Ahli Pertama.")
                        : isEditor
                        ? (language === "en" ? "Select publication-ready infographics/banners along with master project files (.psd/.ai/.zip) if available." : "Pilih berkas infografis/banner siap tayang beserta file master project (.psd/.ai/.zip) jika ada.")
                        : (language === "en" ? "Select coverage photos (multiple allowed) or high-resolution video footage (up to 4 GB)." : "Pilih foto dokumentasi (bisa >10 foto) atau video liputan berkualitas tinggi (hingga 4 GB).")}
                    </p>
                  </div>

                  {isPrahum && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{language === "en" ? "Type news script content:" : "Ketik isi naskah berita:"}</span>
                        <span className="font-semibold text-blue-600 dark:text-sky-400">
                          {uploadLink.trim() ? uploadLink.trim().split(/\s+/).length : 0} {language === "en" ? "Words" : "Kata"}
                        </span>
                      </div>
                      <textarea
                        rows={11}
                        value={uploadLink}
                        onChange={(e) => setUploadLink(e.target.value)}
                        placeholder={language === "en" ? "BATU CITY – The Batu City Government officially held..." : "KOTA BATU – Pemerintah Kota Batu secara resmi menyelenggarakan kegiatan..."}
                        className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0a1647] dark:focus:ring-sky-500 leading-relaxed font-sans"
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={async () => {
                          if (!uploadLink.trim()) {
                            addToast(language === "en" ? "Please write the news script content first" : "Harap tulis isi naskah berita terlebih dahulu", "warning");
                            return;
                          }
                          await storeSubmitWork(selectedTask.id, uploadLink.trim());
                          addToast(
                            isRevision
                              ? (language === "en" ? "Revised script re-submitted successfully to First Expert Officer!" : "Naskah hasil perbaikan berhasil dikirim ulang ke Ahli Pertama!")
                              : (language === "en" ? "News script submitted successfully to First Expert Officer curation desk!" : "Naskah berita berhasil disetor ke Meja Kurasi Ahli Pertama!"),
                            "success"
                          );
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                          isRevision
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-[#0a1647] dark:bg-blue-600 hover:bg-[#122368] dark:hover:bg-blue-700"
                        }`}
                      >
                        {isRevision ? <Send size={14} /> : <Upload size={14} />}
                        <span>
                          {isRevision
                            ? (language === "en" ? "Re-submit Revised Script to First Expert" : "Kirim Ulang Naskah Perbaikan ke Ahli Pertama")
                            : (language === "en" ? "Save & Submit Script to First Expert Desk" : "Simpan & Setor Naskah ke Meja Kurasi Ahli Pertama")}
                        </span>
                      </button>
                    </div>
                  )}

                  {isFotoVideo && (
                    <div className="space-y-4">
                      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl max-w-sm">
                        <button
                          type="button"
                          onClick={() => setActiveMediaTab("foto")}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                            activeMediaTab === "foto"
                              ? "bg-white dark:bg-[#161b22] text-[#0a1647] dark:text-sky-400 shadow-xs"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                          }`}
                        >
                          <ImageIcon size={14} />
                          <span>{language === "en" ? "Photo Archives" : "Foto Dokumentasi"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMediaTab("video")}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                            activeMediaTab === "video"
                              ? "bg-white dark:bg-[#161b22] text-[#0a1647] dark:text-sky-400 shadow-xs"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                          }`}
                        >
                          <VideoIcon size={14} />
                          <span>{language === "en" ? "Video Coverage" : "Video Liputan"}</span>
                        </button>
                      </div>

                      {activeMediaTab === "foto" && (
                        <div className="space-y-3">
                          <input
                            type="file"
                            ref={photoInputRef}
                            accept="image/*,.zip,.heic,.heif,.raw"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                setSelectedPhotoFiles((prev) => [...prev, ...files]);
                              }
                            }}
                          />
                          <div
                            onClick={() => photoInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition bg-gray-50/50 dark:bg-gray-900/40 group"
                          >
                            <ImageIcon className="w-10 h-10 mx-auto text-gray-400 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition mb-2" />
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              {language === "en" ? "Click to Select Photos (Multiple allowed)" : "Klik untuk Pilih Foto Dokumentasi (Bisa >10 Foto Sekaligus)"}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                              {language === "en" ? "Format: JPG, PNG, WEBP, HEIC, or raw ZIP." : "Format: JPG, PNG, WEBP, HEIC (iPhone), atau ZIP mentahan."}
                            </p>
                          </div>

                          {selectedPhotoFiles.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                                <span>{selectedPhotoFiles.length} {language === "en" ? "Photos Ready to Upload:" : "Foto Siap Diunggah:"}</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhotoFiles([])}
                                  className="text-red-500 hover:underline text-[11px] cursor-pointer"
                                >
                                  {language === "en" ? "Remove All" : "Hapus Semua"}
                                </button>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                                {selectedPhotoFiles.map((file, idx) => {
                                  const previewUrl = URL.createObjectURL(file);
                                  return (
                                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white aspect-square flex items-center justify-center">
                                      <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white transition cursor-pointer"
                                      >
                                        <X size={10} />
                                      </button>
                                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white truncate px-1 py-0.5 text-center">
                                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeMediaTab === "video" && (
                        <div className="space-y-3">
                          <input
                            type="file"
                            ref={videoInputRef}
                            accept="video/*,.zip,.mov,.mp4,.mkv,.avi"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setSelectedVideoFile(file);
                            }}
                          />
                          <div
                            onClick={() => videoInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition bg-gray-50/50 dark:bg-gray-900/40 group"
                          >
                            <VideoIcon className="w-10 h-10 mx-auto text-gray-400 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition mb-2" />
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              {language === "en" ? "Click to Select Video File (Max 4 GB)" : "Klik untuk Pilih Berkas Video Liputan (Maksimal 4 GB)"}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                              {language === "en" ? "Format: MP4, MOV, MKV, AVI, or ZIP. Direct streaming supported." : "Format: MP4, MOV (Kamera Sony/iPhone), MKV, AVI, atau ZIP. Didukung streaming langsung."}
                            </p>
                          </div>

                          {selectedVideoFile && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <VideoIcon size={16} className="text-blue-600 shrink-0" />
                                <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{selectedVideoFile.name}</span>
                                <span className="text-gray-500">({(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedVideoFile(null)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {language === "en" ? "Documentation Caption / Description:" : "Keterangan / Caption Dokumentasi:"}
                        </label>
                        <textarea
                          rows={3}
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder={language === "en" ? "e.g. Opening session documentation and Mayor interview..." : "Contoh: Dokumentasi sesi pembukaan dan wawancara Kadis Pariwisata di Graha Among Tani..."}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {isUploading && (
                        <div className="space-y-2 p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                            <span className="flex items-center gap-1.5">
                              <Loader2 size={14} className="animate-spin text-blue-600" />
                              {language === "en" ? "Uploading to Server..." : "Mengunggah ke Server Kominfo..."}
                            </span>
                            <span>{uploadProgressText || `${uploadPercent || 0}%`}</span>
                          </div>
                          <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-sky-500 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadPercent || 5}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={async () => {
                          try {
                            setIsUploading(true);
                            let filesToUpload: File[] = [...selectedPhotoFiles];
                            if (selectedVideoFile) {
                              filesToUpload.push(selectedVideoFile);
                            }

                            let uploadedFiles: MediaFileInfo[] = [];
                            if (filesToUpload.length > 0) {
                              uploadedFiles = await uploadFilesWithProgress(filesToUpload);
                            } else if (selectedTask.mediaData?.files && selectedTask.mediaData.files.length > 0) {
                              uploadedFiles = selectedTask.mediaData.files;
                            } else {
                              addToast(
                                language === "en" ? "Please select at least 1 photo or video" : "Harap pilih minimal 1 foto dokumentasi atau video liputan",
                                "warning"
                              );
                              setIsUploading(false);
                              return;
                            }

                            const payload: MediaWorkPayload = {
                              type: "MEDIA_SUBMISSION",
                              subType: (selectedPhotoFiles.length > 0 && selectedVideoFile) ? undefined : activeMediaTab,
                              files: uploadedFiles,
                              caption: caption.trim() || undefined,
                            };

                            await storeSubmitWork(selectedTask.id, payload);
                            setSelectedPhotoFiles([]);
                            setSelectedVideoFile(null);
                            setUploadPercent(null);
                            addToast(
                              isRevision
                                ? (language === "en" ? "Revised media re-submitted successfully to First Expert Officer!" : "Hasil perbaikan media berhasil dikirim ulang ke Ahli Pertama!")
                                : (language === "en" ? "Coverage media submitted successfully to First Expert Officer curation desk!" : "Berkas liputan berhasil dikirim ke Meja Kurasi Ahli Pertama!"),
                              "success"
                            );
                          } catch (err: any) {
                            addToast(err?.message || (language === "en" ? "Failed to upload files" : "Gagal mengunggah berkas"), "error");
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                          isRevision
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-[#0a1647] dark:bg-blue-600 hover:bg-[#122368] dark:hover:bg-blue-700"
                        } ${isUploading ? "opacity-75 cursor-not-allowed" : ""}`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>{language === "en" ? "Uploading Files..." : "Sedang Mengunggah Berkas..."}</span>
                          </>
                        ) : isRevision ? (
                          <>
                            <Send size={14} />
                            <span>{language === "en" ? "Re-submit Revised Files to First Expert" : "Kirim Ulang Berkas Revisi ke Ahli Pertama"}</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>{language === "en" ? "Upload & Submit to First Expert Desk" : "Unggah & Setor ke Meja Kurasi Ahli Pertama"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {isEditor && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {language === "en" ? "1. Publication-Ready Design (Required - PNG / JPG / PDF):" : "1. Berkas Desain Siap Publikasi (Wajib - PNG / JPG / PDF):"}
                        </label>
                        <input
                          type="file"
                          ref={designMainInputRef}
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => setSelectedDesignMain(e.target.files?.[0] || null)}
                        />
                        <div
                          onClick={() => designMainInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 rounded-xl p-4 text-center cursor-pointer transition bg-gray-50/50 dark:bg-gray-900/40"
                        >
                          <Layers className="w-8 h-8 mx-auto text-purple-500 mb-1.5" />
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {selectedDesignMain ? selectedDesignMain.name : (language === "en" ? "Click to Select Main Design" : "Klik untuk Pilih Desain Utama")}
                          </p>
                          <p className="text-[11px] text-gray-500">{language === "en" ? "Format: High-resolution PNG, JPG, PDF." : "Format: PNG, JPG, PDF resolusi tinggi."}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {language === "en" ? "2. Raw Master Project Files (Optional - PSD / AI / ZIP):" : "2. Berkas Mentahan / Master Project (Opsional - PSD / AI / ZIP):"}
                        </label>
                        <input
                          type="file"
                          ref={designMasterInputRef}
                          accept=".zip,.psd,.ai,.eps,.rar"
                          className="hidden"
                          onChange={(e) => setSelectedDesignMaster(e.target.files?.[0] || null)}
                        />
                        <div
                          onClick={() => designMasterInputRef.current?.click()}
                          className="border border-gray-300 dark:border-gray-700 hover:border-purple-500 rounded-xl p-3 flex items-center justify-between cursor-pointer bg-white dark:bg-gray-900"
                        >
                          <div className="flex items-center gap-2 truncate text-xs">
                            <Layers size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate text-gray-700 dark:text-gray-300">
                              {selectedDesignMaster ? selectedDesignMaster.name : (language === "en" ? "Select Master Project (.zip, .psd, .ai)" : "Pilih Master Project (.zip, .psd, .ai)")}
                            </span>
                          </div>
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-semibold">
                            {language === "en" ? "Browse" : "Pilih File"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {language === "en" ? "Dimensions & Target Media Platform:" : "Dimensi & Target Media Publikasi:"}
                        </label>
                        <select
                          value={targetPlatform}
                          onChange={(e) => setTargetPlatform(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Feed Instagram (1:1)">Feed Instagram (1:1 - 1080x1080)</option>
                          <option value="Story / Reels / TikTok (9:16)">Story / Reels / TikTok (9:16 - 1080x1920)</option>
                          <option value="Banner Website / Youtube (16:9)">Banner Website / Youtube (16:9 - 1920x1080)</option>
                          <option value="Poster / Baliho Cetak">{language === "en" ? "Printed Physical Poster / Billboard" : "Poster / Baliho Cetak Fisik"}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {language === "en" ? "Design & Revision Notes:" : "Catatan Desain & Revisi:"}
                        </label>
                        <textarea
                          rows={3}
                          value={editorNotes}
                          onChange={(e) => setEditorNotes(e.target.value)}
                          placeholder={language === "en" ? "e.g. Adjusted City Gov logo placement and event date font..." : "Contoh: Sudah menyesuaikan letak logo Pemkot dan font tanggal acara..."}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {isUploading && (
                        <div className="space-y-2 p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:purple-200">
                            <span className="flex items-center gap-1.5">
                              <Loader2 size={14} className="animate-spin text-purple-600" />
                              {language === "en" ? "Uploading Design to Server..." : "Mengunggah Desain ke Server..."}
                            </span>
                            <span>{uploadProgressText || `${uploadPercent || 0}%`}</span>
                          </div>
                          <div className="w-full bg-purple-200 dark:bg-purple-900/60 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadPercent || 5}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={async () => {
                          try {
                            setIsUploading(true);
                            const filesToUpload: File[] = [];
                            if (selectedDesignMain) filesToUpload.push(selectedDesignMain);
                            if (selectedDesignMaster) filesToUpload.push(selectedDesignMaster);

                            let uploadedFiles: MediaFileInfo[] = [];
                            if (filesToUpload.length > 0) {
                              uploadedFiles = await uploadFilesWithProgress(filesToUpload);
                            } else if (selectedTask.mediaData?.files && selectedTask.mediaData.files.length > 0) {
                              uploadedFiles = selectedTask.mediaData.files;
                            } else {
                              addToast(language === "en" ? "Please select the main design file" : "Harap pilih berkas desain utama", "warning");
                              setIsUploading(false);
                              return;
                            }

                            const payload: MediaWorkPayload = {
                              type: "MEDIA_SUBMISSION",
                              subType: "desain",
                              files: uploadedFiles,
                              targetPlatform,
                              editorNotes: editorNotes.trim() || undefined,
                            };

                            await storeSubmitWork(selectedTask.id, payload);
                            setSelectedDesignMain(null);
                            setSelectedDesignMaster(null);
                            setUploadPercent(null);
                            addToast(
                              isRevision
                                ? (language === "en" ? "Revised design re-submitted successfully to First Expert Officer!" : "Hasil revisi desain berhasil dikirim ulang ke Ahli Pertama!")
                                : (language === "en" ? "Design file submitted successfully to First Expert Officer curation desk!" : "Berkas desain berhasil dikirim ke Meja Kurasi Ahli Pertama!"),
                              "success"
                            );
                          } catch (err: any) {
                            addToast(err?.message || (language === "en" ? "Failed to upload design files" : "Gagal mengunggah berkas desain"), "error");
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                          isRevision
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-[#0a1647] dark:bg-blue-600 hover:bg-[#122368] dark:hover:bg-blue-700"
                        } ${isUploading ? "opacity-75 cursor-not-allowed" : ""}`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>{language === "en" ? "Uploading Files..." : "Sedang Mengunggah Berkas..."}</span>
                          </>
                        ) : isRevision ? (
                          <>
                            <Send size={14} />
                            <span>{language === "en" ? "Re-submit Revised Design to First Expert" : "Kirim Ulang Desain Revisi ke Ahli Pertama"}</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>{language === "en" ? "Upload & Submit to First Expert Desk" : "Unggah & Setor ke Meja Kurasi Ahli Pertama"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {selectedTask.mediaData && selectedTask.mediaData.files && selectedTask.mediaData.files.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-xs">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          {selectedTask.mediaData.files.length} {language === "en" ? "Files Stored on Internal Server" : "Berkas Tersimpan di Server Internal"}
                        </span>
                        {selectedTask.mediaData.targetPlatform && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                            {selectedTask.mediaData.targetPlatform}
                          </span>
                        )}
                      </div>

                      {selectedTask.mediaData.caption && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800 italic">
                          "{selectedTask.mediaData.caption}"
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {selectedTask.mediaData.files.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition group flex flex-col justify-between"
                          >
                            <div className="flex items-center gap-1.5 truncate text-[11px] font-medium text-gray-800 dark:text-gray-200">
                              {file.mimeType.startsWith("image") ? (
                                <ImageIcon size={12} className="text-sky-500 shrink-0" />
                              ) : file.mimeType.startsWith("video") ? (
                                <VideoIcon size={12} className="text-blue-500 shrink-0" />
                              ) : (
                                <Layers size={12} className="text-purple-500 shrink-0" />
                              )}
                              <span className="truncate">{file.originalName}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                              <span>{(file.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                              <ExternalLink size={10} className="group-hover:text-blue-600" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                    </>
                  )}
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
                const rawStatus = tItem.status === "COMPLETED" ? "SELESAI" : tItem.status === "ASSIGNED" ? "BELUM" : tItem.status === "IN_PROGRESS" ? (tItem.bidang === "PRAHUM" ? "MENULIS" : tItem.bidang === "DESAINER_EDITOR" ? "DESAIN" : "LIPUTAN") : tItem.status;
                const foundIndex = taskWorkflow.indexOf(rawStatus);
                const stepIndex = foundIndex >= 0 ? foundIndex : rawStatus === "SELESAI" ? taskWorkflow.length - 1 : 0;
                const totalSteps = taskWorkflow.length;
                const isCompleted = rawStatus === "SELESAI" || tItem.status === "COMPLETED";
                const isResubmitted = (rawStatus === "MENULIS" || rawStatus === "DESAIN" || rawStatus === "LIPUTAN" || rawStatus === "IN_PROGRESS" || rawStatus === "KURASI") && tItem.revisionNotes;

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
                                : isResubmitted
                                ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-400 dark:border-orange-500 shadow-xs animate-pulse font-extrabold"
                                : tItem.status === "REVISI"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                : tItem.status === "BELUM" || tItem.status === "ASSIGNED"
                                ? "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                : "bg-blue-50 dark:bg-blue-900/40 text-[#0a1647] dark:text-sky-400 border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                <span>{language === "en" ? "Done" : "Selesai"}</span>
                              </>
                            ) : isResubmitted ? (
                              <>
                                <Clock size={14} className="text-orange-600 dark:text-orange-400" />
                                <span>{language === "en" ? "Wait Re-Review" : "Menunggu Review Ulang"}</span>
                              </>
                            ) : tItem.status === "REVISI" ? (
                              <>
                                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                                <span>{language === "en" ? "Needs Revision" : "Perlu Direvisi"}</span>
                              </>
                            ) : (
                              <>
                                <Clock size={14} className="text-[#0a1647] dark:text-sky-400" />
                                <span>{rawStatus.replace("_", " ")}</span>
                              </>
                            )}
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
                                  {new Date(tItem.revisionDate).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + (language === "en" ? "" : " WIB")}
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
