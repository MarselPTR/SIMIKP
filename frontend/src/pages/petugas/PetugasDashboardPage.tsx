import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  FolderOpen,
  MapPin,
  ChevronRight,
  ArrowUpRight,
  AlertTriangle,
  CalendarDays,
  Upload,
  FileText,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { apiFetch } from "../../lib/api-client";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import EventCalendar, { dateKeyOf } from "../../components/shared/EventCalendar";
import type { CalendarEvent } from "../../components/shared/EventCalendar";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { WORKFLOWS } from "../../lib/mock-data";

const NAVY = "#0f1f5c";

interface PetugasTask {
  id: string;
  kegiatan: string;
  lokasi: string;
  deadline: string;
  status: string;
  jenisPekerjaan: string;
  instruksi: string;
  bidang?: string;
  workLink?: string;
  hasConflict?: boolean;
}

const fallbackTasks: PetugasTask[] = [
  {
    id: "t1",
    kegiatan: "Liputan Peresmian Taman Kota Kec. Selatan",
    lokasi: "Taman Kota Kec. Selatan",
    jenisPekerjaan: "Penulisan Rilis & Berita",
    deadline: "24 Agustus 2026 15:00",
    bidang: "PRAHUM",
    status: "LIPUTAN",
    instruksi: "Fokus pada wawancara Walikota dan dampaknya bagi UMKM lokal sekitar taman.",
    hasConflict: true,
  },
  {
    id: "t2",
    kegiatan: "Rapat Koordinasi Publikasi OPD & Media Massa",
    lokasi: "Studio Media SIMIKP",
    jenisPekerjaan: "Press Release & Live Tweeting",
    deadline: "25 Agustus 2026 16:00",
    bidang: "PRAHUM",
    status: "MENULIS",
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
    instruksi: "Dokumentasikan poin pandangan seluruh 6 fraksi secara lengkap.",
  },
];

/* ---------------------------------------------------------------------- */
/* Spotlight Stat Card Component (Mirip Admin Dashboard)                  */
/* ---------------------------------------------------------------------- */
interface SpotlightCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: typeof ClipboardList;
  onClick: () => void;
  accentColor?: "navy" | "rose" | "amber" | "emerald";
  customBorder?: string;
  customBadge?: {
    text: string;
    className: string;
  };
}

const SpotlightCard = ({
  label,
  value,
  subtitle,
  icon: Icon,
  onClick,
  accentColor = "navy",
  customBorder,
  customBadge,
}: SpotlightCardProps) => {
  const [mousePos, setMousePos] = useState({ x: 100, y: 75, distFromCenter: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width || 1;
    const distFromCenter = Math.min(1, Math.max(0, Math.abs(x - width / 2) / (width / 2)));
    setMousePos({ x, y, distFromCenter });
  };

  const getThemeStyles = () => {
    if (accentColor === "rose") {
      return {
        text: "text-rose-600",
        iconBg: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
        glow: "rgba(225, 29, 72, 0.15)",
        border: "border-rose-200/90",
      };
    }
    if (accentColor === "amber") {
      return {
        text: "text-amber-600",
        iconBg: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
        glow: "rgba(217, 119, 6, 0.15)",
        border: "border-amber-200/90",
      };
    }
    if (accentColor === "emerald") {
      return {
        text: "text-emerald-600",
        iconBg: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
        glow: "rgba(16, 185, 129, 0.15)",
        border: "border-emerald-200/90",
      };
    }
    return {
      text: "text-[#0f1f5c]",
      iconBg: "bg-[#0f1f5c]/5 text-[#0f1f5c] group-hover:bg-[#0f1f5c] group-hover:text-white",
      glow: "rgba(15, 31, 92, 0.12)",
      border: "border-slate-200/80",
    };
  };

  const theme = getThemeStyles();

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`relative text-left w-full rounded-2xl p-5 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1f5c] border ${
        customBorder || theme.border
      } group bg-white`}
      style={{
        boxShadow: isHovered
          ? "0 20px 25px -5px rgba(15, 31, 92, 0.10), 0 8px 10px -6px rgba(15, 31, 92, 0.06)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(190px circle at ${mousePos.x}px ${mousePos.y}px, ${theme.glow} 0%, rgba(56, 189, 248, 0.06) 45%, rgba(255, 255, 255, 0.7) 78%, transparent 100%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${theme.iconBg} shadow-2xs`}>
            <Icon className="w-5 h-5 transition-colors duration-300" strokeWidth={2} />
          </div>
          {customBadge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${customBadge.className}`}>
              {customBadge.text}
            </span>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-500 tracking-tight group-hover:text-slate-700 transition-colors">
          {label}
        </p>

        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-3xl font-black ${theme.text} tracking-tight group-hover:scale-102 transition-transform duration-200`}>
            {value}
          </span>
          <span className="text-[11px] font-medium text-gray-500 truncate">{subtitle}</span>
        </div>
      </div>
    </button>
  );
};

const PetugasDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userBidang = user?.staffType || (user as any)?.bidang || "PRAHUM";

  // Query Petugas Tasks
  const { data: dbTasks, isLoading, error } = useQuery({
    queryKey: ["my-tasks-dashboard", user?.id],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: PetugasTask[] }>("/productions/my-tasks");
        if (res.data && res.data.length > 0) return res.data;
        return fallbackTasks;
      } catch {
        return fallbackTasks;
      }
    },
  });

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [viewDateKey, setViewDateKey] = useState<string | null>(null);

  const tasks = useMemo(() => {
    const list = dbTasks || fallbackTasks;
    return list.filter((t) => !t.bidang || t.bidang === userBidang);
  }, [dbTasks, userBidang]);

  const totalTasks = tasks.length;
  const selesaiCount = tasks.filter((t) => t.status === "COMPLETED" || t.status === "SELESAI").length;
  const prosesCount = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "SELESAI" && t.status !== "BELUM"
  ).length;
  const belumCount = tasks.filter((t) => t.status === "BELUM" || t.status === "ASSIGNED").length;
  const berkasCount = tasks.filter((t) => Boolean(t.workLink)).length;

  /* ---------------------------------------------------------------------- */
  /* Logic Warna Tugas Selesai (Sesuai Permintaan):                          */
  /* - Tugas selesai 0: MERAH (red)                                         */
  /* - Beberapa tugas selesai: OREN (orange/amber)                          */
  /* - Semua tugas selesai: HIJAU (green/emerald)                           */
  /* ---------------------------------------------------------------------- */
  const selesaiColorInfo = useMemo(() => {
    if (totalTasks === 0 || selesaiCount === 0) {
      return {
        accent: "rose" as const,
        border: "border-rose-300 shadow-rose-50/50",
        badgeText: "0% Selesai",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        subtitle: "Perlu ditindaklanjuti",
      };
    }
    if (selesaiCount === totalTasks) {
      return {
        accent: "emerald" as const,
        border: "border-emerald-300 shadow-emerald-50/50",
        badgeText: "100% Tuntas",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        subtitle: "Semua selesai!",
      };
    }
    const percent = Math.round((selesaiCount / totalTasks) * 100);
    return {
      accent: "amber" as const,
      border: "border-amber-300 shadow-amber-50/50",
      badgeText: `${percent}% Selesai`,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      subtitle: `${selesaiCount} dari ${totalTasks} tugas`,
    };
  }, [totalTasks, selesaiCount]);

  // Calendar Events
  const calendarEvents = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const baseDate = dateKeyOf(calYear, calMonth, 24);
    map[baseDate] = [{ color: "#0f1f5c", label: "Peresmian Taman" }];
    const date2 = dateKeyOf(calYear, calMonth, 25);
    map[date2] = [{ color: "#d97706", label: "Rakor Publikasi" }];
    const date3 = dateKeyOf(calYear, calMonth, 26);
    map[date3] = [{ color: "#10b981", label: "Dokumentasi Upacara" }];
    const date4 = dateKeyOf(calYear, calMonth, 28);
    map[date4] = [{ color: "#6366f1", label: "Sidang Paripurna" }];
    return map;
  }, [calYear, calMonth]);

  const calendarLegend = [
    { label: "Belum Dimulai", color: "#6b7280" },
    { label: "Sedang Dikerjakan", color: "#d97706" },
    { label: "Siap Tayang / Selesai", color: "#10b981" },
  ];

  const activeWorkflowList = WORKFLOWS[userBidang] || WORKFLOWS["PRAHUM"];

  const upcomingTasks = tasks.slice(0, 4);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Header Banner Petugas ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#0f1f5c] tracking-tight">
              Selamat datang kembali, {user?.name || "Petugas Lapangan"}!
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-[#0f1f5c] border border-blue-200/60 shadow-2xs">
              Sektor {userBidang}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Berikut ringkasan jadwal kegiatan &amp; progres penugasan peliputan Anda untuk Pemerintah Kota Batu.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="default"
            size="sm"
            className="bg-[#0f1f5c] hover:bg-[#162a7a] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            onClick={() => navigate("/petugas/penugasan")}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Kelola Penugasan Saya</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Stat Cards Grid dengan Efek Spotlight & Dynamic Color Selesai ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tugas */}
        <SpotlightCard
          label="Total Tugas Saya"
          value={totalTasks}
          subtitle="Tugas Terjadwal"
          icon={ClipboardList}
          accentColor="navy"
          onClick={() => navigate("/petugas/penugasan")}
        />

        {/* Card 2: Tugas Sedang Proses */}
        <SpotlightCard
          label="Tugas Sedang Proses"
          value={prosesCount}
          subtitle="Dalam Pengerjaan"
          icon={Clock}
          accentColor="amber"
          customBadge={{
            text: `${prosesCount} Aktif`,
            className: "bg-amber-50 text-amber-800 border-amber-200",
          }}
          onClick={() => navigate("/petugas/penugasan")}
        />

        {/* Card 3: Tugas Selesai (Dynamic Color: Merah / Oren / Hijau) */}
        <SpotlightCard
          label="Tugas Selesai"
          value={selesaiCount}
          subtitle={selesaiColorInfo.subtitle}
          icon={CheckCircle2}
          accentColor={selesaiColorInfo.accent}
          customBorder={selesaiColorInfo.border}
          customBadge={{
            text: selesaiColorInfo.badgeText,
            className: selesaiColorInfo.badgeClass,
          }}
          onClick={() => navigate("/petugas/penugasan")}
        />

        {/* Card 4: Luaran Terkumpul */}
        <SpotlightCard
          label="Luaran Bank Konten"
          value={berkasCount}
          subtitle="Berkas Terarsip"
          icon={FolderOpen}
          accentColor="navy"
          customBadge={{
            text: "Arsip Digital",
            className: "bg-indigo-50 text-indigo-800 border-indigo-200",
          }}
          onClick={() => navigate("/bank-konten")}
        />
      </div>

      {/* ── 3. Main Dashboard 2-Column Grid (Mirip Admin Dashboard) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2 Cols): Kalender & Penugasan Terdekat ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Event Calendar */}
          <EventCalendar
            year={calYear}
            month={calMonth}
            events={calendarEvents}
            legend={calendarLegend}
            title="Agenda & Jadwal Tugas Petugas"
            subtitle="Klik tanggal untuk melihat rincian agenda tugas liputan Anda"
            selectedDateKey={viewDateKey}
            onNavigate={(y, m) => {
              setCalYear(y);
              setCalMonth(m);
            }}
            onDayClick={(dateKey) => setViewDateKey((prev) => (prev === dateKey ? null : dateKey))}
          />

          {/* Upcoming Tasks Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Daftar Penugasan Terbaru</h2>
                <p className="text-xs text-gray-500 mt-0.5">Tugas prioritas yang dialokasikan untuk Anda</p>
              </div>
              <button
                onClick={() => navigate("/petugas/penugasan")}
                className="text-xs font-semibold text-[#0f1f5c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua ({totalTasks})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold text-gray-600">Belum ada tugas yang ditugaskan</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Tugas baru dari admin akan otomatis tampil di sini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((t) => {
                  const isDone = t.status === "COMPLETED" || t.status === "SELESAI";
                  const isProcess = !isDone && t.status !== "BELUM";

                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate("/petugas/penugasan", { state: { taskId: t.id } })}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isDone
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : isProcess
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                            {t.jenisPekerjaan}
                          </span>
                          {t.hasConflict && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Bentrok
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0f1f5c] transition-colors line-clamp-1">
                          {t.kegiatan}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {t.lokasi}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400" /> {t.deadline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f5c] hover:bg-[#162a7a] transition flex items-center gap-1 shadow-xs"
                        >
                          <span>Kelola</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column (1 Col): Alur Status Sektor & Ringkasan Cepat ── */}
        <div className="space-y-6">
          {/* Workflow Indicator Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#0f1f5c]">
                Alur Kerja Sektor {userBidang}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Tahapan standar alur produksi konten liputan</p>
            </div>

            <div className="space-y-2.5">
              {activeWorkflowList.map((step, idx) => {
                const countInStep = tasks.filter((t) => t.status === step).length;
                const isStepFinished = step === "SELESAI" || step === "COMPLETED";

                return (
                  <div
                    key={step}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50/40 transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 font-medium text-gray-800">
                      <span className="w-5 h-5 rounded-full bg-[#0f1f5c] text-white text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{step.replace("_", " ")}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        isStepFinished
                          ? "bg-emerald-100 text-emerald-800"
                          : countInStep > 0
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {countInStep} Tugas
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info & Tips */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Pedoman Pelaporan Luaran</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Setelah menyelesaikan liputan, segera unggah tautan folder Google Drive pada menu <strong>Penugasan Saya</strong>. Berkas akan otomatis masuk ke <strong>Bank Konten</strong> untuk ditinjau oleh pimpinan.
            </p>
            <button
              onClick={() => navigate("/petugas/penugasan")}
              className="w-full py-2 bg-[#0f1f5c] hover:bg-[#162a7a] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Buka Form Unggah Luaran</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialog Kalender Detail Tanggal ── */}
      <Dialog
        open={viewDateKey !== null}
        onClose={() => setViewDateKey(null)}
        title={viewDateKey ? `Jadwal Kegiatan: ${viewDateKey}` : "Detail Tanggal"}
      >
        <div className="space-y-3 mt-2">
          <p className="text-xs text-gray-500">
            Berikut jadwal kegiatan dan penugasan yang tercatat pada tanggal ini.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setViewDateKey(null);
                  navigate("/petugas/penugasan", { state: { taskId: t.id } });
                }}
                className="p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition cursor-pointer text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-gray-900">{t.kegiatan}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" /> {t.lokasi}
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {t.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setViewDateKey(null)}>
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PetugasDashboardPage;
