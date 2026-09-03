import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  FolderOpen,
  MapPin,
  ChevronRight,
  ArrowUpRight,
  AlertTriangle,
  Upload,
  FileText,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { usePetugasTasksStore, type PetugasTaskItem } from "../../lib/petugas-store";
import EventCalendar, { dateKeyOf } from "../../components/shared/EventCalendar";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { WORKFLOWS } from "../../lib/mock-data";
import { useLanguage } from "../../lib/LanguageContext";

/* ---------------------------------------------------------------------- */
/* Spotlight Stat Card Component (Dark Mode Ready)                        */
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
        text: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white",
        glow: "rgba(225, 29, 72, 0.15)",
        border: "border-rose-200/90 dark:border-rose-900/60",
        darkStart: "rgba(244, 63, 94, 0.24)",
        darkMid: "rgba(225, 29, 72, 0.08)",
        darkBorderHighlight: "rgba(244, 63, 94, 0.5)",
        darkGlowShadow: "rgba(244, 63, 94, 0.25)",
      };
    }
    if (accentColor === "amber") {
      return {
        text: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white",
        glow: "rgba(217, 119, 6, 0.15)",
        border: "border-amber-200/90 dark:border-amber-900/60",
        darkStart: "rgba(245, 158, 11, 0.24)",
        darkMid: "rgba(217, 119, 6, 0.08)",
        darkBorderHighlight: "rgba(245, 158, 11, 0.5)",
        darkGlowShadow: "rgba(245, 158, 11, 0.25)",
      };
    }
    if (accentColor === "emerald") {
      return {
        text: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
        glow: "rgba(16, 185, 129, 0.15)",
        border: "border-emerald-200/90 dark:border-emerald-900/60",
        darkStart: "rgba(16, 185, 129, 0.24)",
        darkMid: "rgba(5, 150, 105, 0.08)",
        darkBorderHighlight: "rgba(16, 185, 129, 0.5)",
        darkGlowShadow: "rgba(16, 185, 129, 0.25)",
      };
    }
    return {
      text: "text-[#0f1f5c] dark:text-sky-400",
      iconBg: "bg-[#0f1f5c]/5 dark:bg-blue-950/60 text-[#0f1f5c] dark:text-sky-400 group-hover:bg-[#0f1f5c] dark:group-hover:bg-blue-600 group-hover:text-white",
      glow: "rgba(15, 31, 92, 0.12)",
      border: "border-slate-200/80 dark:border-gray-800",
      darkStart: "rgba(255, 255, 255, 0.18)",
      darkMid: "rgba(56, 189, 248, 0.10)",
      darkBorderHighlight: "rgba(56, 189, 248, 0.45)",
      darkGlowShadow: "rgba(56, 189, 248, 0.22)",
    };
  };

  const theme = getThemeStyles();
  const angle = Math.round((Math.atan2(mousePos.y - 75, mousePos.x - 100) * 180) / Math.PI + 180);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`relative text-left w-full rounded-2xl p-5 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1f5c] border ${
        customBorder || theme.border
      } group bg-white dark:bg-[#161b22] cursor-pointer`}
      style={{
        boxShadow: isHovered
          ? `0 12px 28px -6px ${theme.darkGlowShadow}, 0 4px 8px -2px rgba(0, 0, 0, 0.05)`
          : "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* ── Mode Terang: Tetap menggunakan efek radial spotlight asli ── */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 dark:hidden"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(190px circle at ${mousePos.x}px ${mousePos.y}px, ${theme.glow} 0%, rgba(56, 189, 248, 0.06) 45%, rgba(255, 255, 255, 0.7) 78%, transparent 100%)`,
        }}
      />

      {/* ── Mode Gelap: Transisi Gradasi Halus Mengikuti Arah Kursor ── */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out hidden dark:block rounded-2xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(${angle}deg, ${theme.darkStart} 0%, ${theme.darkMid} 40%, transparent 85%)`,
          boxShadow: `inset 0 0 0 1px ${theme.darkBorderHighlight}`,
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

        <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 tracking-tight group-hover:text-slate-700 dark:group-hover:text-gray-200 transition-colors">
          {label}
        </p>

        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-3xl font-black ${theme.text} tracking-tight group-hover:scale-102 transition-transform duration-200`}>
            {value}
          </span>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">{subtitle}</span>
        </div>
      </div>
    </button>
  );
};

const PetugasDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Unified Reactive Task Store synced across pages & database — identitas
  // (userId), bukan kategori tetap, karena role sekarang melekat per-tugas.
  const { tasks } = usePetugasTasksStore(user?.id);

  // Role tidak lagi tetap per orang — panel "sektor" mengikuti tugas
  // terdekat/berikutnya milik petugas ini, bukan atribut tetap.
  const userBidang = tasks[0]?.bidang || "PRAHUM";

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [viewDateKey, setViewDateKey] = useState<string | null>(null);

  const totalTasks = tasks.length;
  const selesaiCount = tasks.filter((t) => t.status === "COMPLETED" || t.status === "SELESAI").length;
  const prosesCount = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "SELESAI" && t.status !== "BELUM"
  ).length;

  const berkasCount = tasks.filter((t) => Boolean(t.workLink)).length;

  const selesaiColorInfo = useMemo(() => {
    if (totalTasks === 0 || selesaiCount === 0) {
      return {
        accent: "rose" as const,
        border: "border-rose-300 dark:border-rose-900/60",
        badgeText: language === "en" ? "0% Done" : "0% Selesai",
        badgeClass: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        subtitle: language === "en" ? "Action needed" : "Perlu ditindaklanjuti",
      };
    }
    if (selesaiCount === totalTasks) {
      return {
        accent: "emerald" as const,
        border: "border-emerald-300 dark:border-emerald-900/60",
        badgeText: language === "en" ? "100% Done" : "100% Tuntas",
        badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        subtitle: language === "en" ? "All completed!" : "Semua selesai!",
      };
    }
    const percent = Math.round((selesaiCount / totalTasks) * 100);
    return {
      accent: "amber" as const,
      border: "border-amber-300 dark:border-amber-900/60",
      badgeText: `${percent}% ${language === "en" ? "Done" : "Selesai"}`,
      badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      subtitle: `${selesaiCount} ${language === "en" ? "of" : "dari"} ${totalTasks} ${language === "en" ? "tasks" : "tugas"}`,
    };
  }, [totalTasks, selesaiCount, language]);

  // Helper to parse date key from task deadline
  const getTaskDateKey = (tItem: PetugasTaskItem, defaultYear: number, defaultMonth: number): string => {
    let day = 24;
    let month = defaultMonth;
    let year = defaultYear;

    const dateMatch = tItem.deadline?.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (dateMatch) {
      day = parseInt(dateMatch[1], 10);
      year = parseInt(dateMatch[3], 10);
      const monthNames = [
        "januari", "februari", "maret", "april", "mei", "juni",
        "juli", "agustus", "september", "oktober", "november", "desember"
      ];
      const mIdx = monthNames.indexOf(dateMatch[2].toLowerCase());
      if (mIdx !== -1) month = mIdx;
    }
    return dateKeyOf(year, month, day);
  };

  const calendarEvents = useMemo(() => {
    const map: Record<string, { label: string; color: string }[]> = {};

    tasks.forEach((tItem) => {
      const dKey = getTaskDateKey(tItem, calYear, calMonth);
      const isDone = tItem.status === "SELESAI" || tItem.status === "COMPLETED" || tItem.status === "SIAP_TAYANG";
      const isBelum = tItem.status === "BELUM" || tItem.status === "ASSIGNED";
      const color = isDone ? "#10b981" : isBelum ? "#6b7280" : "#d97706";

      if (!map[dKey]) map[dKey] = [];
      map[dKey].push({
        label: tItem.kegiatan,
        color,
      });
    });

    return map;
  }, [tasks, calYear, calMonth]);

  const calendarLegend = useMemo(() => {
    return [
      { label: language === "en" ? "Not Started" : "Belum Dimulai", color: "#6b7280" },
      { label: language === "en" ? "In Progress" : "Sedang Dikerjakan", color: "#d97706" },
      { label: language === "en" ? "Ready / Completed" : "Siap Tayang / Selesai", color: "#10b981" },
    ];
  }, [language]);

  const tasksOnClickedDate = useMemo(() => {
    if (!viewDateKey) return [];
    return tasks.filter((tItem) => {
      const taskDateKey = getTaskDateKey(tItem, calYear, calMonth);
      return taskDateKey === viewDateKey;
    });
  }, [tasks, viewDateKey, calYear, calMonth]);

  const activeWorkflowList = WORKFLOWS[userBidang] || WORKFLOWS["PRAHUM"];

  const upcomingTasks = tasks.slice(0, 4);

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* ── 1. Header Banner Petugas ── */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[#0f1f5c] dark:text-sky-400 tracking-tight">
              {language === "en" ? "Welcome back" : "Selamat datang kembali"}, {user?.name || (language === "en" ? "Field Officer" : "Petugas Lapangan")}!
            </h1>
            {tasks.length > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0f1f5c] dark:text-sky-300 border border-blue-200/60 dark:border-blue-900 shadow-2xs">
                {language === "en" ? "Sector" : "Sektor"} {userBidang}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === "en"
              ? "Here is your activity schedule and task progress summary for Batu City Government."
              : "Berikut ringkasan jadwal kegiatan & progres penugasan peliputan Anda untuk Pemerintah Kota Batu."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="default"
            size="sm"
            className="bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#162a7a] dark:hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            onClick={() => navigate("/petugas/penugasan")}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{language === "en" ? "Manage My Tasks" : "Kelola Penugasan Saya"}</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Stat Cards Grid dengan Efek Spotlight ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tugas */}
        <SpotlightCard
          label={language === "en" ? "My Total Tasks" : "Total Tugas Saya"}
          value={totalTasks}
          subtitle={language === "en" ? "Scheduled Tasks" : "Tugas Terjadwal"}
          icon={ClipboardList}
          accentColor="navy"
          onClick={() => navigate("/petugas/penugasan")}
        />

        {/* Card 2: Tugas Sedang Proses */}
        <SpotlightCard
          label={language === "en" ? "Tasks In Progress" : "Tugas Sedang Proses"}
          value={prosesCount}
          subtitle={language === "en" ? "Under Way" : "Dalam Pengerjaan"}
          icon={Clock}
          accentColor="amber"
          customBadge={{
            text: `${prosesCount} ${language === "en" ? "Active" : "Aktif"}`,
            className: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          }}
          onClick={() => navigate("/petugas/penugasan")}
        />

        {/* Card 3: Tugas Selesai */}
        <SpotlightCard
          label={language === "en" ? "Completed Tasks" : "Tugas Selesai"}
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
          label={language === "en" ? "Content Bank Deliverables" : "Luaran Bank Konten"}
          value={berkasCount}
          subtitle={language === "en" ? "Files Archived" : "Berkas Terarsip"}
          icon={FolderOpen}
          accentColor="navy"
          customBadge={{
            text: language === "en" ? "Digital Archive" : "Arsip Digital",
            className: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          }}
          onClick={() => navigate("/bank-konten")}
        />
      </div>

      {/* ── 3. Main Dashboard 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2 Cols): Kalender & Penugasan Terdekat ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Event Calendar */}
          <EventCalendar
            year={calYear}
            month={calMonth}
            events={calendarEvents}
            legend={calendarLegend}
            title={language === "en" ? "Officer Agenda & Task Calendar" : "Agenda & Jadwal Tugas Petugas"}
            subtitle={language === "en" ? "Click a date to see assignment details" : "Klik tanggal untuk melihat rincian agenda tugas liputan Anda"}
            selectedDateKey={viewDateKey}
            onNavigate={(y, m) => {
              setCalYear(y);
              setCalMonth(m);
            }}
            onDayClick={(dateKey) => setViewDateKey((prev) => (prev === dateKey ? null : dateKey))}
          />

          {/* Upcoming Tasks Card */}
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {language === "en" ? "Latest Assigned Tasks" : "Daftar Penugasan Terbaru"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {language === "en" ? "Priority tasks allocated for you" : "Tugas prioritas yang dialokasikan untuk Anda"}
                </p>
              </div>
              <button
                onClick={() => navigate("/petugas/penugasan")}
                className="text-xs font-semibold text-[#0f1f5c] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === "en" ? "View All" : "Lihat Semua"} ({totalTasks})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {language === "en" ? "No tasks assigned yet" : "Belum ada tugas yang ditugaskan"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {language === "en" ? "New tasks from admin will appear here automatically." : "Tugas baru dari admin akan otomatis tampil di sini."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((tItem) => {
                  const isDone = tItem.status === "COMPLETED" || tItem.status === "SELESAI";
                  const isProcess = !isDone && tItem.status !== "BELUM";

                  return (
                    <div
                      key={tItem.id}
                      onClick={() => navigate("/petugas/penugasan", { state: { taskId: tItem.id } })}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-sky-500 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isDone
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : isProcess
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {tItem.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            {tItem.jenisPekerjaan}
                          </span>
                          {tItem.hasConflict && (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> {t("conflict")}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0f1f5c] dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                          {tItem.kegiatan}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {tItem.lokasi}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5 text-gray-400" /> {tItem.deadline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#162a7a] dark:hover:bg-blue-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>{language === "en" ? "Manage" : "Kelola"}</span>
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
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
            <div>
              <h2 className="text-base font-bold text-[#0f1f5c] dark:text-sky-400">
                {language === "en" ? "Workflow Stages" : "Alur Kerja"}{tasks.length > 0 ? ` (${userBidang})` : ""}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {language === "en" ? "Standard production workflow steps" : "Tahapan standar alur produksi konten liputan"}
              </p>
            </div>

            <div className="space-y-2.5">
              {activeWorkflowList.map((step, idx) => {
                const countInStep = tasks.filter((tItem) => tItem.status === step).length;
                const isStepFinished = step === "SELESAI" || step === "COMPLETED";

                return (
                  <div
                    key={step}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 font-medium text-gray-800 dark:text-gray-200">
                      <span className="w-5 h-5 rounded-full bg-[#0f1f5c] dark:bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{step.replace("_", " ")}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        isStepFinished
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                          : countInStep > 0
                          ? "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {countInStep} {language === "en" ? "Tasks" : "Tugas"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info & Tips */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 dark:from-slate-900 dark:via-[#161b22] dark:to-blue-950/40 rounded-2xl border border-indigo-100 dark:border-gray-800 p-5 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-sky-300 font-bold text-sm">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
              <span>{language === "en" ? "Deliverable Submission Guide" : "Pedoman Pelaporan Luaran"}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {language === "en"
                ? "After finishing coverage, please upload your Google Drive folder link in My Assignments. Files will automatically be stored in Content Bank for quality review."
                : "Setelah menyelesaikan liputan, segera unggah tautan folder Google Drive pada menu Penugasan Saya. Berkas akan otomatis masuk ke Bank Konten untuk ditinjau oleh pimpinan."}
            </p>
            <button
              onClick={() => navigate("/petugas/penugasan")}
              className="w-full py-2 bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#162a7a] dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Open Deliverable Form" : "Buka Form Unggah Luaran"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialog Kalender Detail Tanggal ── */}
      <Dialog
        open={viewDateKey !== null}
        onClose={() => setViewDateKey(null)}
        title={viewDateKey ? `${language === "en" ? "Schedule" : "Jadwal Kegiatan"}: ${viewDateKey}` : t("dash_activity_details")}
      >
        <div className="space-y-3 mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === "en" ? "Schedule and tasks recorded for this date:" : "Berikut jadwal kegiatan dan penugasan yang tercatat pada tanggal ini."}
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tasksOnClickedDate.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs bg-gray-50/60 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                {language === "en" ? "No scheduled tasks on this date." : "Tidak ada agenda tugas pada tanggal ini."}
              </div>
            ) : (
              tasksOnClickedDate.map((tItem) => (
                <div
                  key={tItem.id}
                  onClick={() => {
                    setViewDateKey(null);
                    navigate("/petugas/penugasan", { state: { taskId: tItem.id } });
                  }}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-sky-500 hover:bg-indigo-50/30 dark:hover:bg-blue-950/30 transition cursor-pointer text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{tItem.kegiatan}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" /> {tItem.lokasi}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                    {tItem.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <Button variant="outline" onClick={() => setViewDateKey(null)}>
              {t("close")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PetugasDashboardPage;
