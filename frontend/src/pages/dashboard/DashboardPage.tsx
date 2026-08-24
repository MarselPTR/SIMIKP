import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Pencil,
  Megaphone,
  FolderOpen,
  TrendingUp,
  MoreHorizontal,
  User,
  Users,
  Image as ImageIcon,
  Camera,
  X,
} from "lucide-react";
import EventCalendar, { dateKeyOf } from "../../components/shared/EventCalendar";
import type { CalendarEvent } from "../../components/shared/EventCalendar";
import Button from "../../components/ui/Button";

const NAVY = "#0f1f5c";

/* ---------------------------------------------------------------------- */
/* Stat cards                                                              */
/* ---------------------------------------------------------------------- */

interface StatCard {
  label: string;
  value: string;
  trend?: string;
  icon: typeof CalendarDays;
  cardBg: string;
  iconBg: string;
  iconColor: string;
  trendColor?: string;
  path: string;
}

const statCards: StatCard[] = [
  {
    label: "Total Kegiatan Bulan Ini",
    value: "142",
    trend: "↑12%",
    icon: CalendarDays,
    cardBg: "bg-blue-50/70",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    trendColor: "text-emerald-600",
    path: "/kegiatan",
  },
  {
    label: "Tugas Dalam Proses",
    value: "68",
    icon: ClipboardList,
    cardBg: "bg-sky-50/60",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    path: "/produksi",
  },
  {
    label: "Konten Siap Review",
    value: "23",
    icon: Pencil,
    cardBg: "bg-emerald-50/70",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    trendColor: "text-emerald-600",
    path: "/review",
  },
  {
    label: "Publikasi Sukses",
    value: "105",
    trend: "↑18%",
    icon: Megaphone,
    cardBg: "bg-orange-50/70",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    trendColor: "text-orange-600",
    path: "/publikasi",
  },
  {
    label: "Total File di Bank Konten",
    value: "1.2TB",
    icon: FolderOpen,
    cardBg: "bg-gray-50",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    path: "/bank-konten",
  },
];

/* ---------------------------------------------------------------------- */
/* Kalender Kegiatan                                                       */
/* ---------------------------------------------------------------------- */

type EventType = "Upacara" | "Rapat" | "Peresmian" | "Sidang";

const EVENT_COLORS: Record<EventType, string> = {
  Upacara: "#22c55e",
  Rapat: "#3b82f6",
  Peresmian: "#f59e0b",
  Sidang: "#a855f7",
};

const calendarEventDays: Record<number, EventType> = {
  2: "Upacara",
  3: "Rapat",
  4: "Sidang",
  6: "Upacara",
  8: "Rapat",
  9: "Peresmian",
  13: "Peresmian",
  14: "Rapat",
  15: "Rapat",
  16: "Peresmian",
  18: "Sidang",
  20: "Rapat",
  22: "Peresmian",
  24: "Rapat",
  26: "Upacara",
};

const CALENDAR_YEAR = 2026;
const CALENDAR_MONTH = 7; // Agustus (0-indexed)

const dashboardCalendarEvents: Record<string, CalendarEvent[]> = Object.fromEntries(
  Object.entries(calendarEventDays).map(([day, type]) => [
    dateKeyOf(CALENDAR_YEAR, CALENDAR_MONTH, Number(day)),
    [{ color: EVENT_COLORS[type], label: type }],
  ]),
);

const dashboardCalendarLegend = (Object.keys(EVENT_COLORS) as EventType[]).map((type) => ({
  label: type,
  color: EVENT_COLORS[type],
}));

const formatIndonesianDate = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/* ---------------------------------------------------------------------- */
/* Tugas Terbaru & Deadline Mendekati                                      */
/* ---------------------------------------------------------------------- */

interface TugasRow {
  kegiatan: string;
  jenisKonten: string;
  petugas: string;
  deadline: string;
  status: "Sedang Berjalan" | "Review Diperlukan" | "Revisi" | "Selesai";
}

const tugasTerbaru: TugasRow[] = [
  { kegiatan: "Liputan Peresmian Taman Kota", jenisKonten: "Naskah Berita", petugas: "Rizky Fadillah", deadline: "20 Agu 2026", status: "Sedang Berjalan" },
  { kegiatan: "Dokumentasi Foto Peresmian", jenisKonten: "Foto & Media", petugas: "Dinda Amelia", deadline: "20 Agu 2026", status: "Review Diperlukan" },
  { kegiatan: "Desain Banner HUT Kota", jenisKonten: "Desain Grafis", petugas: "Fajar Nugroho", deadline: "22 Agu 2026", status: "Revisi" },
  { kegiatan: "Video Profil Daerah", jenisKonten: "Video Dokumenter", petugas: "Dinda Amelia", deadline: "18 Agu 2026", status: "Selesai" },
  { kegiatan: "Infografis APBD", jenisKonten: "Infografis", petugas: "Fajar Nugroho", deadline: "25 Agu 2026", status: "Sedang Berjalan" },
];

const STATUS_STYLES: Record<TugasRow["status"], string> = {
  "Sedang Berjalan": "bg-blue-100 text-blue-700",
  "Review Diperlukan": "bg-amber-100 text-amber-700",
  Revisi: "bg-red-100 text-red-700",
  Selesai: "bg-emerald-100 text-emerald-700",
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const TugasTerbaruTable = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Tugas Terbaru & Deadline Mendekati</h3>
        <button
          type="button"
          onClick={() => navigate("/produksi")}
          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1 transition-colors duration-150"
          aria-label="Lihat semua tugas produksi"
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
            <tr className="text-left text-[11px] text-gray-400 border-b border-gray-100">
              <th className="px-3 py-2.5 font-medium">Nama Kegiatan</th>
              <th className="px-3 py-2.5 font-medium">Jenis Konten</th>
              <th className="px-3 py-2.5 font-medium">Petugas</th>
              <th className="px-3 py-2.5 font-medium">Deadline</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tugasTerbaru.map((row) => (
              <tr
                key={row.kegiatan}
                onClick={() => navigate("/produksi")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate("/produksi");
                }}
                tabIndex={0}
                role="button"
                aria-label={`Lihat detail ${row.kegiatan}`}
                className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:bg-blue-50/60"
              >
                <td className="px-3 py-3 font-medium text-gray-800">
                  <span className="block truncate" title={row.kegiatan}>{row.kegiatan}</span>
                </td>
                <td className="px-3 py-3 text-gray-500">
                  <span className="block truncate" title={row.jenisKonten}>{row.jenisKonten}</span>
                </td>
                <td className="px-3 py-3 text-gray-600">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: NAVY }}
                    >
                      {initialsOf(row.petugas)}
                    </span>
                    <span className="truncate">{row.petugas}</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{row.deadline}</td>
                <td className="px-3 py-3">
                  <span className={`block truncate rounded-full px-2 py-1 text-center text-[11px] font-medium ${STATUS_STYLES[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/* Status Alur Kerja Produksi — PRAHUM (funnel)                            */
/* ---------------------------------------------------------------------- */

const prahumStages = [
  { label: "BELUM", count: 3, color: "#9ca3af", icon: User },
  { label: "LIPUTAN", count: 15, color: "#f59e0b", icon: Users },
  { label: "MENULIS", count: 12, color: "#3b82f6", icon: ImageIcon },
  { label: "SIAP\nTAYANG", count: 6, color: "#22c55e", icon: Camera },
];

const PrahumPanel = () => {
  const navigate = useNavigate();
  return (
    <PanelShell title="PRAHUM" onMoreClick={() => navigate("/produksi")}>
      <div className="relative mt-5 px-1">
        <div
          className="absolute left-6 right-6 top-[18px] h-1 rounded-full"
          style={{ background: "linear-gradient(to right, #9ca3af, #f59e0b, #3b82f6, #22c55e)" }}
        />
        <div className="relative flex items-start justify-between">
          {prahumStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                type="button"
                key={stage.label}
                onClick={() => navigate("/produksi")}
                className="group relative flex flex-col items-center gap-1.5 flex-1 focus-visible:outline-none"
                aria-label={`${stage.count} tugas pada tahap ${stage.label.replace("\n", " ")}`}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 ease-out group-hover:opacity-100 group-hover:-top-9 z-20">
                  {stage.count} tugas
                </span>
                <span
                  className="text-[11px] font-bold text-white rounded-full px-1.5 min-w-[18px] text-center leading-[18px] -mb-1 z-10 transition-transform duration-200 ease-out group-hover:scale-110"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.count}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center ring-4 ring-white z-10 transition-all duration-200 ease-out group-hover:scale-110 group-hover:shadow-lg"
                  style={{ backgroundColor: stage.color }}
                >
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium text-gray-500 text-center whitespace-pre-line leading-tight transition-colors duration-150 group-hover:text-gray-800">
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </PanelShell>
  );
};

/* ---------------------------------------------------------------------- */
/* Status Alur Kerja Produksi — FOTO (donut, SVG interaktif)               */
/* ---------------------------------------------------------------------- */

const fotoData = [
  { label: "BELUM", value: 3, color: "#9ca3af" },
  { label: "LIPUTAN", value: 9, color: "#f59e0b" },
  { label: "SIAP TAYANG", value: 16, color: "#22c55e" },
];

const FOTO_RADIUS = 38;
const FOTO_CIRC = 2 * Math.PI * FOTO_RADIUS;

const FotoPanel = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);
  const total = fotoData.reduce((sum, d) => sum + d.value, 0);

  let cumulative = 0;
  const segments = fotoData.map((d, i) => {
    const len = (d.value / total) * FOTO_CIRC;
    const seg = { ...d, len, offset: cumulative, index: i };
    cumulative += len;
    return seg;
  });
  const active = hovered !== null ? segments[hovered] : null;

  return (
    <PanelShell title="FOTO" onMoreClick={() => navigate("/produksi")}>
      <div className="flex items-center gap-4 mt-3">
        <button
          type="button"
          onClick={() => navigate("/produksi")}
          className="relative w-24 h-24 flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Lihat detail produksi foto"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={FOTO_RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="14" />
            {segments.map((seg, i) => (
              <circle
                key={seg.label}
                cx="50"
                cy="50"
                r={FOTO_RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={hovered === i ? 16 : 14}
                strokeDasharray={`${seg.len} ${FOTO_CIRC - seg.len}`}
                strokeDashoffset={-seg.offset}
                className="transition-all duration-300 ease-out cursor-pointer"
                style={{ opacity: hovered === null || hovered === i ? 1 : 0.35 }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
            <span
              className="text-lg font-bold transition-colors duration-200"
              style={{ color: active ? active.color : NAVY }}
            >
              {active ? active.value : total}
            </span>
            <span className="text-[8px] text-gray-400 text-center leading-tight">
              {active ? active.label : "Total"}
            </span>
          </div>
        </button>
        <div className="space-y-1">
          {fotoData.map((d, i) => (
            <button
              type="button"
              key={d.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onClick={() => navigate("/produksi")}
              className={`flex items-center gap-1.5 text-[11px] rounded px-1.5 -mx-1.5 py-1 transition-colors duration-150 focus-visible:outline-none ${
                hovered === i ? "bg-gray-50 text-gray-900 font-semibold" : "text-gray-600"
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span>
                {Math.round((d.value / total) * 100)}% {d.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </PanelShell>
  );
};

/* ---------------------------------------------------------------------- */
/* Status Alur Kerja Produksi — VIDEO (stacked bar, animasi masuk)         */
/* ---------------------------------------------------------------------- */

const videoSegmentColors = { belum: "#9ca3af", liputan: "#f59e0b", siapTayang: "#3b82f6", finis: "#22c55e" };
const videoSegmentLabels: Record<keyof typeof videoSegmentColors, string> = {
  belum: "Belum",
  liputan: "Liputan",
  siapTayang: "Siap Tayang",
  finis: "Finis",
};

const videoBars = [
  { label: "TUGAS BARU", segments: [{ key: "belum", v: 2 }, { key: "liputan", v: 6 }] },
  { label: "SEDANG\nDIKERJAKAN", segments: [{ key: "belum", v: 2 }, { key: "liputan", v: 3 }, { key: "siapTayang", v: 4 }] },
  { label: "FINIS", segments: [{ key: "siapTayang", v: 1 }, { key: "finis", v: 7 }] },
] as const;

const VideoPanel = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const maxTotal = Math.max(...videoBars.map((b) => b.segments.reduce((s, seg) => s + seg.v, 0)));

  return (
    <PanelShell title="VIDEO" onMoreClick={() => navigate("/produksi")}>
      <div className="flex items-end justify-between gap-4 mt-4 h-28 px-2">
        {videoBars.map((bar) => {
          const total = bar.segments.reduce((s, seg) => s + seg.v, 0);
          const targetHeightPct = (total / maxTotal) * 100;
          return (
            <button
              type="button"
              key={bar.label}
              onClick={() => navigate("/produksi")}
              className="group flex flex-col items-center flex-1 h-full justify-end focus-visible:outline-none"
              aria-label={`${bar.label.replace("\n", " ")}: ${total} konten`}
            >
              <span className="text-xs font-bold text-gray-700 mb-1 transition-transform duration-200 group-hover:-translate-y-0.5">
                {total}
              </span>
              <div
                className="w-8 flex flex-col-reverse rounded-md overflow-hidden transition-all duration-700 ease-out group-hover:shadow-md"
                style={{ height: mounted ? `${targetHeightPct}%` : "0%" }}
              >
                {bar.segments.map((seg, i) => (
                  <div
                    key={i}
                    title={`${videoSegmentLabels[seg.key as keyof typeof videoSegmentColors]}: ${seg.v}`}
                    className="transition-all duration-200 ease-out hover:brightness-90"
                    style={{
                      height: `${(seg.v / total) * 100}%`,
                      backgroundColor: videoSegmentColors[seg.key as keyof typeof videoSegmentColors],
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 text-center mt-2 whitespace-pre-line leading-tight transition-colors duration-150 group-hover:text-gray-600">
                {bar.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
        {(Object.keys(videoSegmentColors) as (keyof typeof videoSegmentColors)[]).map((key) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: videoSegmentColors[key] }} />
            {videoSegmentLabels[key]}
          </span>
        ))}
      </div>
    </PanelShell>
  );
};

/* ---------------------------------------------------------------------- */
/* Status Alur Kerja Produksi — DESAINER (kanban)                          */
/* ---------------------------------------------------------------------- */

const desainerColumns = [
  { label: "ANTREAN", count: 14, color: "#9ca3af", bg: "bg-gray-100", text: "text-gray-700", items: ["Banner HUT Kota", "Infografis APBD"] },
  { label: "DIPROSES", count: 12, color: "#f59e0b", bg: "bg-amber-100", text: "text-amber-700", items: ["Feeds Instagram", "Revisi Layout"] },
  { label: "SELESAI", count: 8, color: "#22c55e", bg: "bg-emerald-100", text: "text-emerald-700", items: ["Logo OPD", "Sertifikat"] },
];

const DesainerPanel = () => {
  const navigate = useNavigate();
  return (
    <PanelShell title="DESAINER" onMoreClick={() => navigate("/produksi")}>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {desainerColumns.map((col) => (
          <div key={col.label} className="flex flex-col gap-1.5">
            <div className={`flex items-center justify-between rounded-lg px-2 py-1 transition-transform duration-150 ${col.bg}`}>
              <span className={`text-[10px] font-bold ${col.text}`}>{col.label}</span>
              <span className={`text-[10px] font-bold ${col.text}`}>{col.count}</span>
            </div>
            {col.items.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => navigate("/produksi")}
                className="text-left bg-gray-50 border-l-2 rounded px-2 py-1.5 text-[10px] text-gray-600 leading-tight transition-all duration-200 ease-out hover:bg-white hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                style={{ borderColor: col.color }}
              >
                {item}
              </button>
            ))}
          </div>
        ))}
      </div>
    </PanelShell>
  );
};

/* ---------------------------------------------------------------------- */
/* Shared panel shell                                                      */
/* ---------------------------------------------------------------------- */

const PanelShell = ({
  title,
  children,
  onMoreClick,
}: {
  title: string;
  children: ReactNode;
  onMoreClick?: () => void;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-bold text-gray-800 tracking-wide">{title}</h4>
      <button
        type="button"
        onClick={onMoreClick}
        className="text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1 transition-colors duration-150"
        aria-label={`Lihat detail produksi ${title.toLowerCase()}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
    {children}
  </div>
);

/* ---------------------------------------------------------------------- */
/* Page                                                                     */
/* ---------------------------------------------------------------------- */

const DashboardPage = () => {
  const navigate = useNavigate();

  const [calYear, setCalYear] = useState(CALENDAR_YEAR);
  const [calMonth, setCalMonth] = useState(CALENDAR_MONTH);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const selectedEvents = selectedDateKey ? dashboardCalendarEvents[selectedDateKey] ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Ringkasan Kegiatan &amp; Publikasi</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => navigate(card.path)}
              className={`text-left w-full rounded-xl border border-gray-200 shadow-sm p-4 ${card.cardBg} transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
              aria-label={`Buka ${card.label}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} strokeWidth={1.8} />
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-extrabold" style={{ color: NAVY }}>
                  {card.value}
                </span>
                {card.trend && (
                  <span className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${card.trendColor}`}>
                    <TrendingUp className="w-3 h-3" />
                    {card.trend}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: calendar + tugas table */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 min-w-0">
              <EventCalendar
                year={calYear}
                month={calMonth}
                events={dashboardCalendarEvents}
                legend={dashboardCalendarLegend}
                subtitle="Klik tanggal untuk melihat detail kegiatan hari itu"
                selectedDateKey={selectedDateKey}
                compact={!!selectedDateKey}
                onNavigate={(y, m) => {
                  setCalYear(y);
                  setCalMonth(m);
                }}
                onDayClick={(dateKey) => setSelectedDateKey((prev) => (prev === dateKey ? null : dateKey))}
              />
            </div>

            {selectedDateKey && (
              <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-400">Detail Tanggal</p>
                    <h4 className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">
                      {formatIndonesianDate(selectedDateKey)}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(null)}
                    className="flex-shrink-0 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-md p-1 transition-colors duration-150"
                    aria-label="Tutup panel detail"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {selectedEvents.length > 0 ? (
                    selectedEvents.map((ev, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                        style={{ backgroundColor: `${ev.color}14` }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                        <span className="text-sm font-medium" style={{ color: ev.color }}>
                          {ev.label}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Belum ada kegiatan terjadwal pada tanggal ini.</p>
                  )}
                </div>

                <Button
                  variant="default"
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedDateKey(null);
                    navigate("/kegiatan");
                  }}
                >
                  Kelola di Manajemen Kegiatan
                </Button>
              </div>
            )}
          </div>

          <TugasTerbaruTable />
        </div>

        {/* Right: status alur kerja produksi */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Status Alur Kerja Produksi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrahumPanel />
            <FotoPanel />
            <VideoPanel />
            <DesainerPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
