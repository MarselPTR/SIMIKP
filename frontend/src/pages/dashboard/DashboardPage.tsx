import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  Pencil,
  Megaphone,
  FolderOpen,
  MoreHorizontal,
} from "lucide-react";

import { apiFetch } from "../../lib/api-client";
import { KEGIATAN_STATUS_COLORS, KEGIATAN_STATUS_LABELS, mockKegiatan, mockPenugasan } from "../../lib/mock-data";
import type { MockKegiatan } from "../../lib/mock-data";
import EventCalendar, { dateKeyOf } from "../../components/shared/EventCalendar";
import type { CalendarEvent } from "../../components/shared/EventCalendar";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import { useLanguage, type TranslationKey } from "../../lib/LanguageContext";

/* ---------------------------------------------------------------------- */
/* Stat cards                                                              */
/* ---------------------------------------------------------------------- */

interface StatCard {
  labelKey: TranslationKey;
  value: string;
  icon: typeof CalendarDays;
  path: string;
}

interface StatCardMeta {
  key: "totalBulanIni" | "tugasDalamProses" | "kontenSiapReview" | "publikasiSukses";
  labelKey: TranslationKey;
  icon: typeof CalendarDays;
  path: string;
}

const STAT_CARD_META: StatCardMeta[] = [
  { key: "totalBulanIni", labelKey: "dash_total_activities_month", icon: CalendarDays, path: "/kegiatan" },
  { key: "tugasDalamProses", labelKey: "dash_tasks_in_progress", icon: ClipboardList, path: "/produksi" },
  { key: "kontenSiapReview", labelKey: "dash_content_ready_review", icon: Pencil, path: "/review" },
  { key: "publikasiSukses", labelKey: "dash_published_success", icon: Megaphone, path: "/publikasi" },
];

const BANK_KONTEN_CARD: StatCard = {
  labelKey: "dash_total_files_bank",
  value: "1.2TB",
  icon: FolderOpen,
  path: "/bank-konten",
};

interface SpotlightStatCardProps {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  onClick: () => void;
}

const SpotlightStatCard = ({ label, value, icon: Icon, onClick }: SpotlightStatCardProps) => {
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

  const navyOpacity = 0.12 + mousePos.distFromCenter * 0.32;
  const whiteOpacity = Math.max(0.15, (1 - mousePos.distFromCenter) * 0.75);
  const angle = Math.round((Math.atan2(mousePos.y - 75, mousePos.x - 100) * 180) / Math.PI + 180);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="relative text-left w-full rounded-2xl p-5 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1f5c] border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#161b22] group cursor-pointer"
      style={{
        boxShadow: isHovered
          ? "0 12px 28px -6px rgba(56, 189, 248, 0.22), 0 4px 8px -2px rgba(0, 0, 0, 0.05)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
      }}
      aria-label={`Buka ${label}`}
    >
      {/* ── Mode Terang: Tetap menggunakan efek radial spotlight asli ── */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 dark:hidden"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(190px circle at ${mousePos.x}px ${mousePos.y}px, rgba(15, 31, 92, ${navyOpacity}) 0%, rgba(56, 189, 248, ${navyOpacity * 0.6}) 45%, rgba(255, 255, 255, ${whiteOpacity}) 78%, transparent 100%)`,
        }}
      />
      {/* ── Mode Gelap: Transisi Gradasi Halus Mengikuti Arah Kursor ── */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out hidden dark:block rounded-2xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(${angle}deg, rgba(255, 255, 255, 0.18) 0%, rgba(56, 189, 248, 0.10) 40%, transparent 85%)`,
          boxShadow: "inset 0 0 0 1px rgba(56, 189, 248, 0.45)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 dark:hidden"
        style={{
          opacity: isHovered ? 1 : 0,
          boxShadow: "inset 0 0 0 1px rgba(15, 31, 92, 0.15)",
        }}
      />
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 transition-all duration-300 bg-[#0f1f5c]/5 dark:bg-blue-950/60 group-hover:bg-[#0f1f5c] dark:group-hover:bg-blue-600 group-hover:scale-105 shadow-2xs">
          <Icon className="w-5 h-5 text-[#0f1f5c] dark:text-sky-300 group-hover:text-white transition-colors duration-300" strokeWidth={2} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 tracking-tight group-hover:text-slate-700 dark:group-hover:text-gray-200 transition-colors">
          {label}
        </p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-3xl font-black text-[#0f1f5c] dark:text-sky-400 tracking-tight group-hover:scale-102 transition-transform duration-200">
            {value}
          </span>
        </div>
      </div>
    </button>
  );
};

/* ---------------------------------------------------------------------- */
/* Kalender Kegiatan & Utilities                                          */
/* ---------------------------------------------------------------------- */

const formatDateLocale = (dateKey: string, lang: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const todayDateKey = () => {
  const d = new Date();
  return dateKeyOf(d.getFullYear(), d.getMonth(), d.getDate());
};

const petugasForOutput = (outputs?: string[]) => {
  const first = outputs?.[0];
  if (first === "Naskah Berita") return "Rizky Fadillah";
  if (first === "Foto" || first === "Video" || first === "Reels") return "Dinda Amelia";
  return "Fajar Nugroho";
};

const TugasTerbaruTable = ({ items }: { items: MockKegiatan[] }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const getStatusLabel = (status: MockKegiatan["status"]) => {
    if (language === "en") {
      if (status === "active") return "Active";
      if (status === "review") return "Review";
      if (status === "done") return "Done";
      return "Pending";
    }
    return KEGIATAN_STATUS_LABELS[status] || status;
  };

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-all duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t("dash_recent_tasks_deadline")}</h3>
        <button
          type="button"
          onClick={() => navigate("/kegiatan")}
          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md p-1 transition-colors duration-150 cursor-pointer"
          aria-label={t("dash_view_all_activities")}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[16%]" />
            <col className="w-[22%]" />
            <col className="w-[15%]" />
            <col className="w-[21%]" />
          </colgroup>
          <thead>
            <tr className="text-left text-[11px] text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <th className="px-3 py-2.5 font-bold">{t("dash_col_activity")}</th>
              <th className="px-3 py-2.5 font-bold">{t("dash_col_content_type")}</th>
              <th className="px-3 py-2.5 font-bold">{t("dash_col_officer")}</th>
              <th className="px-3 py-2.5 font-bold">{t("dash_col_deadline")}</th>
              <th className="px-3 py-2.5 font-bold">{t("dash_col_status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {items.map((row) => {
              const petugas = petugasForOutput(row.outputDibutuhkan);
              const outputLabel = row.outputDibutuhkan?.join(", ") || "—";
              return (
                <tr
                  key={row.id}
                  onClick={() => navigate("/kegiatan")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate("/kegiatan");
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Detail ${row.title}`}
                  className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/60 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-3 font-semibold text-gray-900 dark:text-gray-100 truncate" title={row.title}>
                    {row.title}
                  </td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400 truncate" title={outputLabel}>
                    {outputLabel}
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300 truncate" title={petugas}>
                    {petugas}
                  </td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                    {row.deadline}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold"
                      style={{
                        backgroundColor: `${KEGIATAN_STATUS_COLORS[row.status]}18`,
                        color: KEGIATAN_STATUS_COLORS[row.status],
                      }}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/* Produksi Panels (PRAHUM, FOTO, VIDEO, DESAINER)                        */
/* ---------------------------------------------------------------------- */

const PrahumPanel = ({ assignments }: { assignments: any[] }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const tId = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(tId);
  }, []);

  const data = assignments.filter((a) => ["Naskah Berita", "Rilis"].includes(a.contentType));
  const peliputan = data.filter((a) => a.status === "LIPUTAN").length;
  const draft = data.filter((a) => a.status === "MENULIS" || a.status === "DRAFT").length;
  const siapRilis = data.filter((a) => a.status === "SIAP_TAYANG" || a.status === "SELESAI").length;

  const total = Math.max(1, peliputan + draft + siapRilis);

  const segments = [
    { label: t("dash_status_peliputan"), count: peliputan, color: "#f59e0b" },
    { label: t("dash_status_draft"), count: draft, color: "#3b82f6" },
    { label: t("dash_status_siap_rilis"), count: siapRilis, color: "#10b981" },
  ];

  return (
    <PanelShell title={t("dash_panel_prahum_title")} onMoreClick={() => navigate("/produksi")}>
      <div className="space-y-2 mt-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {language === "en" ? "Total Press Releases" : "Total Rilis Berita"}
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {data.length} {language === "en" ? "Articles" : "Naskah"}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 flex overflow-hidden">
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                width: mounted ? `${(seg.count / total) * 100}%` : "0%",
                backgroundColor: seg.color,
                transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              title={`${seg.label}: ${seg.count}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 pt-2 text-[11px]">
          {segments.map((seg, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-1.5 p-1 rounded-md transition-colors ${
                hovered === i ? "bg-gray-50 dark:bg-gray-800" : ""
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-gray-600 dark:text-gray-400 truncate">{seg.label}: <strong className="text-gray-900 dark:text-gray-100">{seg.count}</strong></span>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
};

const FotoPanel = ({ assignments }: { assignments: any[] }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const data = assignments.filter((a) => ["Foto"].includes(a.contentType));
  const raw = data.filter((a) => a.status === "LIPUTAN" || a.status === "ASSIGNED").length;
  const editing = data.filter((a) => a.status === "SELESAI" || a.status === "SIAP_TAYANG").length;

  return (
    <PanelShell title={t("dash_panel_foto_title")} onMoreClick={() => navigate("/produksi")}>
      <div className="space-y-3 mt-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {language === "en" ? "Photo Documentation Queue" : "Antrean Dokumentasi Foto"}
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {data.length} {language === "en" ? "Sessions" : "Sesi"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider block">
              {t("dash_status_raw_photo")}
            </span>
            <span className="text-lg font-black text-amber-900 dark:text-amber-200 mt-0.5 block">{raw}</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider block">
              {t("done")}
            </span>
            <span className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-0.5 block">{editing}</span>
          </div>
        </div>
      </div>
    </PanelShell>
  );
};

const VideoPanel = ({ assignments }: { assignments: any[] }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const data = assignments.filter((a) => ["Video", "Reels"].includes(a.contentType));
  const belum = data.filter((a) => a.status === "BELUM" || a.status === "ASSIGNED").length;
  const liputan = data.filter((a) => a.status === "LIPUTAN").length;
  const siapTayang = data.filter((a) => a.status === "SIAP_TAYANG").length;
  const finis = data.filter((a) => a.status === "SELESAI" || a.status === "COMPLETED").length;

  const total = Math.max(1, belum + liputan + siapTayang + finis);

  return (
    <PanelShell title={t("dash_panel_video_title")} onMoreClick={() => navigate("/produksi")}>
      <div className="space-y-2 mt-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {language === "en" ? "Total Video Projects" : "Total Proyek Video"}
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {data.length} {language === "en" ? "Agendas" : "Agenda"}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 flex overflow-hidden">
          <div style={{ width: `${(belum / total) * 100}%` }} className="bg-gray-400" title={t("pending")} />
          <div style={{ width: `${(liputan / total) * 100}%` }} className="bg-amber-500" title={t("dash_status_peliputan")} />
          <div style={{ width: `${(siapTayang / total) * 100}%` }} className="bg-blue-500" title={t("dash_status_siap_rilis")} />
          <div style={{ width: `${(finis / total) * 100}%` }} className="bg-emerald-500" title={t("done")} />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{t("dash_status_peliputan")}: <strong className="text-gray-900 dark:text-gray-100">{liputan}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{t("dash_status_siap_rilis")}: <strong className="text-gray-900 dark:text-gray-100">{siapTayang}</strong></span>
          </div>
        </div>
      </div>
    </PanelShell>
  );
};

const DesainerPanel = ({ assignments }: { assignments: any[] }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const data = assignments.filter((a) => ["Infografis", "Desain"].includes(a.contentType));

  return (
    <PanelShell title={t("dash_panel_desain_title")} onMoreClick={() => navigate("/produksi")}>
      <div className="space-y-3 mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {language === "en" ? "Design Queue" : "Antrean Desain"}
          </span>
          <span className="font-bold text-indigo-600 dark:text-sky-400">
            {data.length} {language === "en" ? "Pieces" : "Konten"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/produksi")}
          className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-sky-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{language === "en" ? "Open Production Queue" : "Buka Antrean Produksi"}</span>
        </button>
      </div>
    </PanelShell>
  );
};

const PanelShell = ({
  title,
  children,
  onMoreClick,
}: {
  title: string;
  children: ReactNode;
  onMoreClick?: () => void;
}) => (
  <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-4 transition-all duration-200">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wide">{title}</h4>
      <button
        type="button"
        onClick={onMoreClick}
        className="text-gray-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg p-1 transition-colors duration-150 cursor-pointer"
        aria-label={`Detail ${title.toLowerCase()}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
    {children}
  </div>
);

/* ---------------------------------------------------------------------- */
/* Page Main Component                                                     */
/* ---------------------------------------------------------------------- */

interface DashboardStats {
  totalKegiatan: number;
  aktifKegiatan: number;
  totalPenugasan: number;
  produksiRunning: number;
  reviewPending: number;
  publikasiSukses: number;
  opdProduction: Array<{ name: string; singkatan: string; count: number }>;
  pegawaiProduction: Array<{ id: string; name: string; staffType: string; count: number }>;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const { data: kegiatanResponse } = useQuery({
    queryKey: ["kegiatan-dash"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: any[] }>("/activities");
        if (res.data && res.data.length > 0) return res;
        return { data: mockKegiatan };
      } catch {
        return { data: mockKegiatan };
      }
    },
  });
  const kegiatanList =
    kegiatanResponse?.data && kegiatanResponse.data.length > 0 ? kegiatanResponse.data : mockKegiatan;

  const { data: assignmentsResponse } = useQuery({
    queryKey: ["assignments-dash"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: any[] }>("/assignments");
        if (res.data && res.data.length > 0) return res;
        return { data: mockPenugasan };
      } catch {
        return { data: mockPenugasan };
      }
    },
  });
  const assignments =
    assignmentsResponse?.data && assignmentsResponse.data.length > 0 ? assignmentsResponse.data : mockPenugasan;

  const { data: stats } = useQuery({
    queryKey: ["dashboardStatsReal"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: DashboardStats }>("/dashboard/stats");
        return res.data;
      } catch {
        return null;
      }
    },
  });

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const dashboardCalendarLegend = useMemo(() => {
    return (Object.keys(KEGIATAN_STATUS_LABELS) as MockKegiatan["status"][]).map((status) => {
      let label = KEGIATAN_STATUS_LABELS[status];
      if (language === "en") {
        if (status === "active") label = "Active";
        else if (status === "review") label = "Review";
        else if (status === "done") label = "Done";
        else if (status === "pending") label = "Pending";
      }
      return {
        label,
        color: KEGIATAN_STATUS_COLORS[status],
      };
    });
  }, [language]);

  const dashboardCalendarEvents = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const k of kegiatanList) {
      if (!k.deadline) continue;
      const list = map[k.deadline] ?? (map[k.deadline] = []);
      list.push({ color: KEGIATAN_STATUS_COLORS[k.status], label: k.title });
    }
    return map;
  }, [kegiatanList]);

  const upcomingTugas = useMemo(() => {
    const today = todayDateKey();
    const sorted = [...kegiatanList].sort((a, b) => a.deadline.localeCompare(b.deadline));
    const upcoming = sorted.filter((k) => k.deadline >= today);
    const past = sorted.filter((k) => k.deadline < today).reverse();
    return [...upcoming, ...past].slice(0, 5);
  }, [kegiatanList]);

  const statCards = useMemo(() => {
    const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const values: Record<StatCardMeta["key"], number> = {
      totalBulanIni: stats?.totalKegiatan ?? kegiatanList.filter((k) => k.deadline.startsWith(monthPrefix)).length,
      tugasDalamProses: stats?.produksiRunning ?? kegiatanList.filter((k) => k.status === "active").length,
      kontenSiapReview: stats?.reviewPending ?? kegiatanList.filter((k) => k.status === "review").length,
      publikasiSukses: stats?.publikasiSukses ?? kegiatanList.filter((k) => k.status === "done").length,
    };
    return [
      ...STAT_CARD_META.map((meta) => ({
        label: t(meta.labelKey),
        value: String(values[meta.key]),
        icon: meta.icon,
        path: meta.path,
      })),
      {
        label: t(BANK_KONTEN_CARD.labelKey),
        value: BANK_KONTEN_CARD.value,
        icon: BANK_KONTEN_CARD.icon,
        path: BANK_KONTEN_CARD.path,
      },
    ];
  }, [kegiatanList, calYear, calMonth, stats, t]);

  const selectedEvents = selectedDateKey ? dashboardCalendarEvents[selectedDateKey] ?? [] : [];
  const maxOpdCount = Math.max(...(stats?.opdProduction?.map((o) => o.count) ?? [1]), 1);

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400">
          {language === "en" ? "Executive Dashboard" : "Dashboard Eksekutif"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {language === "en"
            ? "Real-time summary of Batu City Government agendas & public communication"
            : "Ringkasan Kegiatan & Publikasi Real-Time Pemerintah Kota Batu"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <SpotlightStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            onClick={() => navigate(card.path)}
          />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: calendar + tugas table */}
        <div className="lg:col-span-6 space-y-6">
          <EventCalendar
            year={calYear}
            month={calMonth}
            events={dashboardCalendarEvents}
            legend={dashboardCalendarLegend}
            subtitle={t("dash_activity_calendar_desc")}
            selectedDateKey={selectedDateKey}
            onNavigate={(y, m) => {
              setCalYear(y);
              setCalMonth(m);
            }}
            onDayClick={(dateKey) => setSelectedDateKey((prev) => (prev === dateKey ? null : dateKey))}
          />

          <TugasTerbaruTable items={upcomingTugas} />
        </div>

        {/* Right: status alur kerja produksi */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {language === "en" ? "Production Workflow Status" : "Status Alur Kerja Produksi"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrahumPanel assignments={assignments} />
            <FotoPanel assignments={assignments} />
            <VideoPanel assignments={assignments} />
            <DesainerPanel assignments={assignments} />
          </div>

          {/* OPD Volume & Leaderboard */}
          {stats?.opdProduction && stats.opdProduction.length > 0 && (
            <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-4 mt-4">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                {language === "en" ? "Activity Volume by Agency (OPD)" : "Volume Kegiatan per OPD"}
              </h4>
              <div className="space-y-2.5">
                {stats.opdProduction.map((opd) => {
                  const pct = (opd.count / maxOpdCount) * 100;
                  return (
                    <div key={opd.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{opd.singkatan || opd.name}</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{opd.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div className="bg-indigo-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup daftar kegiatan pada tanggal yang diklik di kalender */}
      <Dialog
        open={selectedDateKey !== null}
        onClose={() => setSelectedDateKey(null)}
        title={selectedDateKey ? formatDateLocale(selectedDateKey, language) : t("dash_activity_details")}
      >
        <div className="mt-1">
          {selectedEvents.length > 0 ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto -mx-1 px-1">
              {selectedEvents.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 bg-[#0f1f5c] dark:bg-blue-950/80 border dark:border-blue-800 text-white shadow-xs"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/25"
                    style={{ backgroundColor: ev.color || "#38bdf8" }}
                  />
                  <span className="text-xs font-bold text-white tracking-wide">
                    {ev.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-2">
                <CalendarDays className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("dash_no_activities_today")}</p>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedDateKey(null)}>
              {t("close")}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setSelectedDateKey(null);
                navigate("/kegiatan");
              }}
            >
              {language === "en" ? "Manage in Activities" : "Kelola di Manajemen Kegiatan"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
