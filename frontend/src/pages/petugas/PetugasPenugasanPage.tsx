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
import { usePetugasTasksStore } from "../../lib/petugas-store";
import { WORKFLOWS } from "../../lib/mock-data";
import { useToast } from "../../contexts/ToastContext";

const DARK_BLUE = "#0a1647"; // Biru Gelap (Midnight Navy)

interface TaskItem {
  id: string;
  kegiatan: string;
  lokasi: string;
  jenisPekerjaan: string;
  deadline: string;
  bidang: string;
  status: string;
  instruksi: string;
  kategori: "upacara" | "rapat" | "peresmian" | "sidang";
  hasConflict?: boolean;
  conflictMessage?: string;
  workLink?: string;
}

const defaultTasks: TaskItem[] = [
  {
    id: "t1",
    kegiatan: "Liputan Peresmian Taman Kota Kec. Selatan",
    lokasi: "Taman Kota Kec. Selatan",
    jenisPekerjaan: "Penulisan Rilis & Berita",
    deadline: "24 Agustus 2026 15:00",
    bidang: "PRAHUM",
    status: "LIPUTAN",
    kategori: "peresmian",
    instruksi: "Fokus pada wawancara Walikota dan dampaknya bagi UMKM lokal sekitar taman.",
    hasConflict: true,
    conflictMessage: "Budi sudah memiliki jadwal kegiatan lain pada pukul 09.00–11.00 WIB.",
  },
  {
    id: "t2",
    kegiatan: "Rapat Koordinasi Publikasi OPD & Media Massa",
    lokasi: "Studio Media SIMIKP",
    jenisPekerjaan: "Press Release & Live Tweeting",
    deadline: "25 Agustus 2026 16:00",
    bidang: "PRAHUM",
    status: "MENULIS",
    kategori: "rapat",
    instruksi: "Rangkum 5 poin kesepakatan media relations untuk tayang di portal resmi.",
  },
  {
    id: "t3",
    kegiatan: "Dokumentasi Upacara Peringatan Hari Kemerdekaan",
    lokasi: "Balaikota Among Tani",
    jenisPekerjaan: "Foto & Video Liputan",
    deadline: "26 Agustus 2026 12:00",
    bidang: "FOTO_VIDEO",
    status: "SIAP_TAYANG",
    kategori: "upacara",
    instruksi: "Ambil minimal 30 foto resolusi tinggi dan highlight video 60 detik.",
    workLink: "https://drive.google.com/drive/folders/1upacara-foto-batu",
  },
  {
    id: "t4",
    kegiatan: "Desain Banner Media Sosial HUT Kota Batu Ke-25",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Desain Grafis / Feeds Instagram",
    deadline: "27 Agustus 2026 14:00",
    bidang: "DESAINER_EDITOR",
    status: "DESAIN",
    kategori: "peresmian",
    instruksi: "Gunakan palet warna resmi Pemkot dan sertakan logo OPD terbaru.",
  },
  {
    id: "t5",
    kegiatan: "Sidang Paripurna Pandangan Fraksi DPRD",
    lokasi: "Gedung DPRD Kota Batu",
    jenisPekerjaan: "Notulensi & Transkrip Pidato",
    deadline: "28 Agustus 2026 17:00",
    bidang: "PRAHUM",
    status: "BELUM",
    kategori: "sidang",
    instruksi: "Dokumentasikan poin pandangan seluruh 6 fraksi secara lengkap.",
  },
  {
    id: "t6",
    kegiatan: "Produksi Video Profil Desa Wisata Bumiaji",
    lokasi: "Kecamatan Bumiaji",
    jenisPekerjaan: "Video Dokumenter 4K",
    deadline: "29 Agustus 2026 16:00",
    bidang: "FOTO_VIDEO",
    status: "LIPUTAN",
    kategori: "peresmian",
    instruksi: "Pengambilan video lanskap perkebunan apel dan wawancara pengelola wisata.",
  },
  {
    id: "t7",
    kegiatan: "Infografis Realisasi Anggaran APBD Triwulan II",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Desain Infografis Publik",
    deadline: "30 Agustus 2026 12:00",
    bidang: "DESAINER_EDITOR",
    status: "REVISI",
    kategori: "rapat",
    instruksi: "Perbaiki kontras warna pada diagram sektor pendidikan dan kesehatan.",
  },
];

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

  const handleSaveWorkLink = async () => {
    if (!selectedTask) return;
    if (!uploadLink.trim()) {
      addToast("Tautan luaran tidak boleh kosong.", "warning");
      return;
    }
    await storeSubmitWork(selectedTask.id, uploadLink.trim());
    addToast("Tautan hasil kerja berhasil disimpan ke database!", "success");
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

  const activeWorkflow = userBidang ? WORKFLOWS[userBidang] ?? [] : WORKFLOWS["PRAHUM"];

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
      {/* 1. Header Title (Biru Gelap & Putih) */}
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

      {/* 2. Main Content Area */}
      {selectedTask ? (
        /* DETAIL WORKSPACE VIEW (Clean Static White) */
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <button
              onClick={() => setSelectedId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a1647] hover:underline cursor-pointer"
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Tugas
            </button>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                Status: {selectedTask.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Conflict Alert Banner if detected */}
          {selectedTask.hasConflict && (
            <div className="bg-white border border-[#0a1647]/30 rounded-xl p-4 flex items-start gap-3 shadow-xs">
              <AlertTriangle size={18} className="text-[#0a1647] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#0a1647] uppercase tracking-wide">
                  Peringatan Bentrok Jadwal Terdeteksi
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {selectedTask.conflictMessage || "Jadwal penugasan ini berbenturan dengan agenda liputan lain pada rentang waktu yang berdekatan."}
                </p>
              </div>
            </div>
          )}

          {/* Task Info Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-white border border-[#0a1647]/30 text-[#0a1647]">
                {categoryLabels[selectedTask.kategori] || selectedTask.kategori}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-white border border-[#0a1647]/30 text-[#0a1647]">
                {selectedTask.jenisPekerjaan}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{selectedTask.kegiatan}</h2>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1.5 text-gray-600">
                <MapPin size={14} className="text-[#0a1647]" /> {selectedTask.lokasi}
              </span>
              <span className="flex items-center gap-1.5 text-[#0a1647] font-semibold bg-white border border-[#0a1647]/30 px-2 py-0.5 rounded-md">
                <Clock size={14} className="text-[#0a1647]" /> Batas Pengumpulan: {selectedTask.deadline}
              </span>
            </div>
          </div>

          {/* Instruksi Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 space-y-1.5">
            <p className="text-xs font-bold text-[#0a1647] uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} /> Instruksi Liputan / Tugas
            </p>
            <p className="text-xs text-gray-700 leading-relaxed pl-5">
              {selectedTask.instruksi}
            </p>
          </div>

          {/* Alur Kerja Section */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-[#0a1647] uppercase tracking-wider">
              Perbarui Alur Status Pekerjaan ({userBidang || "PRAHUM"})
            </p>
            <div className="flex flex-wrap gap-2">
              {activeWorkflow.map((st, idx) => {
                const isActive = selectedTask.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => updateStatus(selectedTask.id, st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#0a1647] text-white shadow-xs border border-[#0a1647]"
                        : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5 hover:border-[#0a1647] active:bg-[#0a1647] active:text-white"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white text-[#0a1647] text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{st.replace("_", " ")}</span>
                    {isActive && <CheckCircle2 size={13} className="text-white ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Luaran Form */}
          <div className="border-t border-gray-100 pt-6 space-y-3">
            <div>
              <p className="text-xs font-bold text-[#0a1647] uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={14} /> Tautan Hasil Luaran Kerja (Google Drive / Cloud)
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Masukkan tautan file folder dokumentasi, naskah berita, atau berkas final untuk diarsip ke Bank Konten.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                type="url"
                value={uploadLink}
                onChange={(e) => setUploadLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a1647]/30 focus:border-[#0a1647] transition"
              />
              <button
                onClick={handleSaveWorkLink}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 bg-[#0a1647] hover:bg-[#081238]"
              >
                <Upload size={13} />
                <span>Simpan Tautan</span>
              </button>
            </div>

            {selectedTask.workLink && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-600">Tautan Tersimpan:</span>
                <a
                  href={selectedTask.workLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[#0a1647] hover:underline flex items-center gap-1 truncate max-w-md"
                >
                  <span className="truncate">{selectedTask.workLink}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TASK LIST VIEW */
        <div className="space-y-4">
          {/* Top Search Bar & Status Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
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

            {/* Status Segmented Tabs */}
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

          {/* Category Filter Pills (Biru Gelap) */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-semibold text-gray-500 mr-1">Kategori:</span>
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === "ALL"
                  ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
                  : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5 hover:border-[#0a1647] active:bg-[#0a1647] active:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setCategoryFilter("upacara")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === "upacara"
                  ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
                  : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5 hover:border-[#0a1647] active:bg-[#0a1647] active:text-white"
              }`}
            >
              Upacara
            </button>
            <button
              onClick={() => setCategoryFilter("rapat")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === "rapat"
                  ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
                  : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5 hover:border-[#0a1647] active:bg-[#0a1647] active:text-white"
              }`}
            >
              Rapat
            </button>
            <button
              onClick={() => setCategoryFilter("peresmian")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === "peresmian"
                  ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
                  : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5 hover:border-[#0a1647] active:bg-[#0a1647] active:text-white"
              }`}
            >
              Peresmian
            </button>
            <button
              onClick={() => setCategoryFilter("sidang")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === "sidang"
                  ? "bg-[#0a1647] text-white border border-[#0a1647] shadow-xs"
                  : "bg-white text-[#0a1647] border border-[#0a1647]/30 hover:bg-[#0a1647]/5 hover:border-[#0a1647] active:bg-[#0a1647] active:text-white"
              }`}
            >
              Sidang
            </button>
          </div>

          {/* Task Cards List with Spotlight Cursor Effect */}
          <div className="space-y-3 pt-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-14 text-gray-400 bg-white rounded-2xl border border-dashed border-[#0a1647]/30 text-xs shadow-xs">
                Tidak ada tugas penugasan yang sesuai filter.
              </div>
            ) : (
              filteredTasks.map((t) => {
                return (
                  <div
                    key={t.id}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-gray-200 hover:border-slate-400 hover:shadow-sm transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    style={{
                      background: `radial-gradient(450px circle at var(--x, -1000px) var(--y, -1000px), rgba(10, 22, 71, 0.12) 0%, rgba(148, 163, 184, 0.16) 35%, rgba(226, 232, 240, 0.30) 65%, transparent 80%) #ffffff`,
                    }}
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      {/* Uniform Pure White & Dark Blue Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Category Badge */}
                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                          {categoryLabels[t.kategori] || t.kategori}
                        </span>

                        {/* 2. Status Badge */}
                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                          {t.status.replace("_", " ")}
                        </span>

                        {/* 3. Job Type Badge */}
                        <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647]">
                          {t.jenisPekerjaan}
                        </span>

                        {/* 4. Bentrok Badge */}
                        {t.hasConflict && (
                          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647] flex items-center gap-1.5">
                            <AlertTriangle size={13} className="text-[#0a1647]" />
                            Bentrok
                          </span>
                        )}

                        {t.workLink && (
                          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-white border border-[#0a1647]/30 text-[#0a1647] flex items-center gap-1.5">
                            <Upload size={12} className="text-[#0a1647]" />
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
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white px-5 py-2.5 rounded-lg cursor-pointer self-start md:self-auto shadow-xs bg-[#0a1647]"
                    >
                      Kelola Tugas <ChevronRight size={15} />
                    </button>
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
