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
  User,
  Users,
  Image as ImageIcon,
  Camera,
} from "lucide-react";
import { mockApi } from "../../lib/mock-api";
import { KEGIATAN_STATUS_COLORS, KEGIATAN_STATUS_LABELS } from "../../lib/mock-data";
import type { MockKegiatan } from "../../lib/mock-data";
import EventCalendar, { dateKeyOf } from "../../components/shared/EventCalendar";
import type { CalendarEvent } from "../../components/shared/EventCalendar";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";

const NAVY = "#0f1f5c";

/* ---------------------------------------------------------------------- */
/* Stat cards                                                              */
/* ---------------------------------------------------------------------- */

interface StatCard {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  path: string;
}

// Angka dihitung langsung dari data kegiatan yang sama dengan Manajemen
// Kegiatan (lihat computeStatCards di bawah) — bukan dummy statis, supaya
// kedua halaman selalu menampilkan jumlah yang sinkron.
interface StatCardMeta {
  key: "totalBulanIni" | "tugasDalamProses" | "kontenSiapReview" | "publikasiSukses";
  label: string;
  icon: typeof CalendarDays;
  path: string;
}

const STAT_CARD_META: StatCardMeta[] = [
  { key: "totalBulanIni", label: "Total Kegiatan Bulan Ini", icon: CalendarDays, path: "/kegiatan" },
  { key: "tugasDalamProses", label: "Tugas Dalam Proses", icon: ClipboardList, path: "/produksi" },
  { key: "kontenSiapReview", label: "Konten Siap Review", icon: Pencil, path: "/review" },
  { key: "publikasiSukses", label: "Publikasi Sukses", icon: Megaphone, path: "/publikasi" },
];

const BANK_KONTEN_CARD: StatCard = {
  label: "Total File di Bank Konten",
  value: "1.2TB",
  icon: FolderOpen,
  path: "/bank-konten",
};

// Satu warna biru muda seragam untuk semua stat card (bukan gradasi lagi).
const STAT_CARD_TONE = {
  bg: "#eff6ff",
  iconBg: "#e2e8f5",
  icon: "#0f1f5c",
  value: "#0f1f5c",
  label: "#6b7ba8",
};

/* ---------------------------------------------------------------------- */
/* Kalender Kegiatan — bersumber dari data kegiatan yang sama dipakai      */
/* halaman Manajemen Kegiatan (lib/mock-data.ts), bukan dummy terpisah.    */
/* ---------------------------------------------------------------------- */

const dashboardCalendarLegend = (Object.keys(KEGIATAN_STATUS_LABELS) as MockKegiatan["status"][]).map((status) => ({
  label: KEGIATAN_STATUS_LABELS[status],
  color: KEGIATAN_STATUS_COLORS[status],
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

const formatShortDate = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const todayDateKey = () => {
  const d = new Date();
  return dateKeyOf(d.getFullYear(), d.getMonth(), d.getDate());
};

/* ---------------------------------------------------------------------- */
/* Tugas Terbaru & Deadline Mendekati                                      */
/* ---------------------------------------------------------------------- */

// Model MockKegiatan tidak menyimpan petugas yang ditugaskan — dipetakan
// dari jenis output yang dibutuhkan supaya tetap masuk akal (naskah -> tim
// Prahum, foto/video -> tim Foto-Video, selain itu -> tim Desainer).
const petugasForOutput = (outputs?: string[]) => {
  const first = outputs?.[0];
  if (first === "Naskah Berita") return "Rizky Fadillah";
  if (first === "Foto" || first === "Video" || first === "Reels") return "Dinda Amelia";
  return "Fajar Nugroho";
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const TugasTerbaruTable = ({ items }: { items: MockKegiatan[] }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Tugas Terbaru & Deadline Mendekati</h3>
        <button
          type="button"
          onClick={() => navigate("/kegiatan")}
          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1 transition-colors duration-150"
          aria-label="Lihat semua kegiatan"
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
                  aria-label={`Lihat detail ${row.title}`}
                  className="cursor-pointer transition-colors duration-150 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:bg-blue-50/60"
                >
                  <td className="px-3 py-3 font-medium text-gray-800">
                    <span className="block truncate" title={row.title}>{row.title}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    <span className="block truncate" title={outputLabel}>{outputLabel}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: NAVY }}
                      >
                        {initialsOf(petugas)}
                      </span>
                      <span className="truncate">{petugas}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{formatShortDate(row.deadline)}</td>
                  <td className="px-3 py-3">
                    <span
                      className="block truncate rounded-full px-2 py-1 text-center text-[11px] font-medium"
                      style={{
                        backgroundColor: `${KEGIATAN_STATUS_COLORS[row.status]}17`,
                        color: KEGIATAN_STATUS_COLORS[row.status],
                      }}
                    >
                      {KEGIATAN_STATUS_LABELS[row.status]}
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
/* Status Alur Kerja Produksi — PRAHUM (workflow proportion bar)           */
/* ---------------------------------------------------------------------- */

const prahumStages = [
  { label: "BELUM", count: 3, color: "#9ca3af", icon: User },
  { label: "LIPUTAN", count: 15, color: "#f59e0b", icon: Users },
  { label: "MENULIS", count: 12, color: "#3b82f6", icon: ImageIcon },
  { label: "SIAP TAYANG", count: 6, color: "#22c55e", icon: Camera },
];

const PrahumPanel = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const total = prahumStages.reduce((s, stage) => s + stage.count, 0);
  const active = hovered !== null ? prahumStages[hovered] : null;

  return (
    <PanelShell title="PRAHUM" onMoreClick={() => navigate("/produksi")}>
      <div className="flex items-baseline justify-between mt-3 mb-2">
        <span className="text-[11px] text-gray-400">Total tugas berjalan</span>
        <span className="text-sm font-bold transition-colors duration-150" style={{ color: active ? active.color : NAVY }}>
          {active ? `${active.count} · ${active.label}` : total}
        </span>
      </div>

      {/* Proportional workflow bar — jujur ke data: lebar segmen = porsi tugas, bukan funnel yang menyiratkan penyusutan bertahap */}
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-100 gap-[2px]">
        {prahumStages.map((stage, i) => (
          <button
            key={stage.label}
            type="button"
            onClick={() => navigate("/produksi")}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            aria-label={`${stage.count} tugas pada tahap ${stage.label}`}
            className="h-full transition-all duration-500 ease-out focus-visible:outline-none"
            style={{
              width: mounted ? `${(stage.count / total) * 100}%` : "0%",
              backgroundColor: stage.color,
              opacity: hovered === null || hovered === i ? 1 : 0.45,
            }}
          />
        ))}
      </div>

      {/* Stat chips per tahap */}
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        {prahumStages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <button
              type="button"
              key={stage.label}
              onClick={() => navigate("/produksi")}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="group flex flex-col items-center gap-1 rounded-lg py-2 transition-colors duration-150 hover:bg-gray-50 focus-visible:outline-none"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110"
                style={{ backgroundColor: `${stage.color}17` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: stage.color }} strokeWidth={2.2} />
              </div>
              <span className="text-xs font-bold text-gray-800">{stage.count}</span>
              <span className="text-[8.5px] font-medium text-gray-400 text-center leading-tight">{stage.label}</span>
            </button>
          );
        })}
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
      <div className="flex flex-col items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => navigate("/produksi")}
          className="relative w-32 h-32 flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-3">
            <span
              className="text-2xl font-bold transition-colors duration-200"
              style={{ color: active ? active.color : NAVY }}
            >
              {active ? active.value : total}
            </span>
            <span className="text-[10px] text-gray-400 text-center leading-tight">
              {active ? active.label : "Total"}
            </span>
          </div>
        </button>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {fotoData.map((d, i) => (
            <button
              type="button"
              key={d.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onClick={() => navigate("/produksi")}
              className={`flex items-center gap-1.5 text-xs whitespace-nowrap rounded px-1.5 py-1 transition-colors duration-150 focus-visible:outline-none ${
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
/* Status Alur Kerja Produksi — VIDEO (bullet-style horizontal bars)       */
/* ---------------------------------------------------------------------- */

const videoSegmentColors = { belum: "#9ca3af", liputan: "#f59e0b", siapTayang: "#3b82f6", finis: "#22c55e" };
const videoSegmentLabels: Record<keyof typeof videoSegmentColors, string> = {
  belum: "Belum",
  liputan: "Liputan",
  siapTayang: "Siap Tayang",
  finis: "Finis",
};

const videoBars = [
  { label: "Tugas Baru", segments: [{ key: "belum", v: 2 }, { key: "liputan", v: 6 }] },
  { label: "Sedang Dikerjakan", segments: [{ key: "belum", v: 2 }, { key: "liputan", v: 3 }, { key: "siapTayang", v: 4 }] },
  { label: "Finis", segments: [{ key: "siapTayang", v: 1 }, { key: "finis", v: 7 }] },
] as const;

const VideoPanel = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const maxTotal = Math.max(...videoBars.map((b) => b.segments.reduce((s, seg) => s + seg.v, 0)));

  return (
    <PanelShell title="VIDEO" onMoreClick={() => navigate("/produksi")}>
      {/* Bullet-style: satu baris per kategori, panjang bar = proporsi terhadap kategori terbesar */}
      <div className="mt-3 space-y-3">
        {videoBars.map((bar, i) => {
          const total = bar.segments.reduce((s, seg) => s + seg.v, 0);
          const trackWidthPct = (total / maxTotal) * 100;
          return (
            <button
              type="button"
              key={bar.label}
              onClick={() => navigate("/produksi")}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              className="group block w-full text-left focus-visible:outline-none"
              aria-label={`${bar.label}: ${total} konten`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-500 transition-colors duration-150 group-hover:text-gray-800">
                  {bar.label}
                </span>
                <span className="text-xs font-bold text-gray-800">{total}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full flex rounded-full overflow-hidden transition-all duration-700 ease-out gap-[1.5px] group-hover:shadow-sm"
                  style={{ width: mounted ? `${trackWidthPct}%` : "0%" }}
                >
                  {bar.segments.map((seg, j) => (
                    <div
                      key={j}
                      title={`${videoSegmentLabels[seg.key as keyof typeof videoSegmentColors]}: ${seg.v}`}
                      className="h-full transition-all duration-200 ease-out group-hover:brightness-95"
                      style={{
                        width: `${(seg.v / total) * 100}%`,
                        backgroundColor: videoSegmentColors[seg.key as keyof typeof videoSegmentColors],
                        opacity: hoveredBar === null || hoveredBar === i ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
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
  const { data: kegiatanData } = useQuery({ queryKey: ["kegiatan"], queryFn: mockApi.kegiatan.getAll });
  const kegiatanList = kegiatanData ?? [];

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

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

  const statCards: StatCard[] = useMemo(() => {
    const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const values: Record<StatCardMeta["key"], number> = {
      totalBulanIni: kegiatanList.filter((k) => k.deadline.startsWith(monthPrefix)).length,
      tugasDalamProses: kegiatanList.filter((k) => k.status === "active").length,
      kontenSiapReview: kegiatanList.filter((k) => k.status === "review").length,
      publikasiSukses: kegiatanList.filter((k) => k.status === "done").length,
    };
    return [
      ...STAT_CARD_META.map((meta) => ({
        label: meta.label,
        value: String(values[meta.key]),
        icon: meta.icon,
        path: meta.path,
      })),
      BANK_KONTEN_CARD,
    ];
  }, [kegiatanList, calYear, calMonth]);

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

      {/* Stat cards — satu warna biru muda seragam untuk semua kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const tone = STAT_CARD_TONE;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => navigate(card.path)}
              className="text-left w-full rounded-xl shadow-sm p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              style={{ backgroundColor: tone.bg }}
              aria-label={`Buka ${card.label}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200"
                style={{ backgroundColor: tone.iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: tone.icon }} strokeWidth={1.8} />
              </div>
              <p className="text-sm" style={{ color: tone.label }}>
                {card.label}
              </p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-extrabold" style={{ color: tone.value }}>
                  {card.value}
                </span>
              </div>
            </button>
          );
        })}
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
            subtitle="Klik tanggal untuk melihat kegiatan pada hari itu"
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

      {/* Popup daftar kegiatan pada tanggal yang diklik di kalender */}
      <Dialog
        open={selectedDateKey !== null}
        onClose={() => setSelectedDateKey(null)}
        title={selectedDateKey ? formatIndonesianDate(selectedDateKey) : "Detail Tanggal"}
      >
        <div className="mt-1">
          {selectedEvents.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto -mx-1 px-1">
              {selectedEvents.map((ev, i) => (
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                <CalendarDays className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Belum ada kegiatan terjadwal pada tanggal ini.</p>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedDateKey(null)}>
              Tutup
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setSelectedDateKey(null);
                navigate("/kegiatan");
              }}
            >
              Kelola di Manajemen Kegiatan
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
