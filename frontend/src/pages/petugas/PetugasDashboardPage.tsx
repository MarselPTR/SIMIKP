import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  FileText,
  Edit3,
  Megaphone,
  Folder,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  User,
  Users,
  PenTool,
  Camera,
  MapPin,
  Clock,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

const NAVY = "#0a1647"; // Biru Gelap (Midnight Navy)

interface CalendarEvent {
  day: number;
  type: "aktif" | "review" | "selesai" | "pending";
  title: string;
  time?: string;
  location?: string;
}

const calendarEvents: CalendarEvent[] = [
  { day: 3, type: "aktif", title: "Upacara Hari Jadi Kota", time: "07:30 - 09:30", location: "Balaikota Among Tani" },
  { day: 4, type: "pending", title: "Rapat Koordinasi OPD", time: "09:00 - 11:30", location: "Ruang Rapat Utama" },
  { day: 5, type: "aktif", title: "Sosialisasi Kebijakan", time: "09:00 - 11:00", location: "Balaikota Among Tani" },
  { day: 5, type: "review", title: "Rapat Anggaran", time: "13:00 - 15:30", location: "Ruang Rapat TPID" },
  { day: 6, type: "aktif", title: "Bimbingan Teknis", time: "08:30 - 12:00", location: "Pusdiklat Songgoriti" },
  { day: 7, type: "pending", title: "Konferensi Pers", time: "10:00 - 11:30", location: "Diskominfo Kota Batu" },
  { day: 8, type: "selesai", title: "Jalan Sehat Warga", time: "06:30 - 09:30", location: "Alun-Alun Kota Batu" },
  { day: 10, type: "aktif", title: "Upacara Hari Pramuka", time: "07:30 - 09:00", location: "Balaikota Among Tani" },
  { day: 11, type: "pending", title: "Kunjungan Kerja", time: "09:00 - 13:00", location: "Kecamatan Bumiaji" },
  { day: 12, type: "review", title: "Lomba Desain Grafis", time: "09:00 - 16:00", location: "Studio SIMIKP" },
  { day: 13, type: "aktif", title: "Pelatihan Videografi", time: "08:30 - 12:00", location: "Balaikota Among Tani" },
  { day: 13, type: "review", title: "Penyusunan Rilis", time: "13:00 - 15:00", location: "Kantor Diskominfo" },
  { day: 14, type: "pending", title: "Rapat Paripurna", time: "10:00 - 12:30", location: "Gedung DPRD" },
  { day: 15, type: "selesai", title: "Gladi Bersih Upacara", time: "08:00 - 11:00", location: "Stadion Brantas" },
  { day: 17, type: "aktif", title: "Upacara Kemerdekaan", time: "07:30 - 11:00", location: "Balaikota Among Tani" },
  { day: 18, type: "pending", title: "Karnaval Budaya", time: "12:00 - 17:00", location: "Jalan Panglima Sudirman" },
  { day: 19, type: "review", title: "Pameran UMKM", time: "09:00 - 18:00", location: "Pasar Induk Among Tani" },
  { day: 20, type: "aktif", title: "Media Briefing", time: "09:30 - 11:30", location: "Studio SIMIKP" },
  { day: 21, type: "pending", title: "Audiensi Walikota", time: "10:00 - 12:00", location: "Ruang Rapat Pimpinan" },
  { day: 22, type: "selesai", title: "Festival Kuliner", time: "15:00 - 21:00", location: "Stadion Gelora Brantas" },
];

const PetugasDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDay, setSelectedDay] = useState<number>(3);
  const [activeStatIndex, setActiveStatIndex] = useState<number>(0);

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startDayOffset = 6; // Start Saturday (1 Agustus 2026 on Saturday)

  const selectedDayEvents = calendarEvents.filter((e) => e.day === selectedDay);

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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a1647]">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ringkasan Kegiatan &amp; Publikasi {user?.name ? `• Petugas: ${user.name}` : ""}
        </p>
      </div>

      {/* 2. Top Metric Cards (5 Cards: White with Dark Navy & Silver Gradient Spotlight) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Kegiatan Bulan Ini */}
        <div
          onClick={() => setActiveStatIndex(0)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-xs ${
            activeStatIndex === 0
              ? "border-2 border-slate-400/90 ring-2 ring-slate-300/40 shadow-md bg-gradient-to-br from-white via-[#f8fafc] to-[#cbd5e1]/30"
              : "border border-gray-200 hover:border-slate-400 hover:shadow-sm"
          }`}
          style={{
            background:
              activeStatIndex === 0
                ? undefined
                : `radial-gradient(450px circle at var(--x, -1000px) var(--y, -1000px), rgba(10, 22, 71, 0.12) 0%, rgba(148, 163, 184, 0.16) 35%, rgba(226, 232, 240, 0.3) 65%, transparent 80%) #ffffff`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-[#0a1647] text-white flex items-center justify-center shadow-xs">
              <CalendarIcon size={22} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Total Kegiatan Bulan Ini
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#0a1647]">
                29
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Tugas Dalam Proses */}
        <div
          onClick={() => setActiveStatIndex(1)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-xs ${
            activeStatIndex === 1
              ? "border-2 border-slate-400/90 ring-2 ring-slate-300/40 shadow-md bg-gradient-to-br from-white via-[#f8fafc] to-[#cbd5e1]/30"
              : "border border-gray-200 hover:border-slate-400 hover:shadow-sm"
          }`}
          style={{
            background:
              activeStatIndex === 1
                ? undefined
                : `radial-gradient(450px circle at var(--x, -1000px) var(--y, -1000px), rgba(10, 22, 71, 0.12) 0%, rgba(148, 163, 184, 0.16) 35%, rgba(226, 232, 240, 0.3) 65%, transparent 80%) #ffffff`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0a1647] flex items-center justify-center">
              <FileText size={22} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Tugas Dalam Proses
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#0a1647]">
                7
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Konten Siap Review */}
        <div
          onClick={() => setActiveStatIndex(2)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-xs ${
            activeStatIndex === 2
              ? "border-2 border-slate-400/90 ring-2 ring-slate-300/40 shadow-md bg-gradient-to-br from-white via-[#f8fafc] to-[#cbd5e1]/30"
              : "border border-gray-200 hover:border-slate-400 hover:shadow-sm"
          }`}
          style={{
            background:
              activeStatIndex === 2
                ? undefined
                : `radial-gradient(450px circle at var(--x, -1000px) var(--y, -1000px), rgba(10, 22, 71, 0.12) 0%, rgba(148, 163, 184, 0.16) 35%, rgba(226, 232, 240, 0.3) 65%, transparent 80%) #ffffff`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0a1647] flex items-center justify-center">
              <Edit3 size={22} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Konten Siap Review
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#0a1647]">
                5
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Publikasi Sukses */}
        <div
          onClick={() => setActiveStatIndex(3)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-xs ${
            activeStatIndex === 3
              ? "border-2 border-slate-400/90 ring-2 ring-slate-300/40 shadow-md bg-gradient-to-br from-white via-[#f8fafc] to-[#cbd5e1]/30"
              : "border border-gray-200 hover:border-slate-400 hover:shadow-sm"
          }`}
          style={{
            background:
              activeStatIndex === 3
                ? undefined
                : `radial-gradient(450px circle at var(--x, -1000px) var(--y, -1000px), rgba(10, 22, 71, 0.12) 0%, rgba(148, 163, 184, 0.16) 35%, rgba(226, 232, 240, 0.3) 65%, transparent 80%) #ffffff`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0a1647] flex items-center justify-center">
              <Megaphone size={22} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Publikasi Sukses
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#0a1647]">
                10
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Total File di Bank Konten */}
        <div
          onClick={() => setActiveStatIndex(4)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-xs ${
            activeStatIndex === 4
              ? "border-2 border-slate-400/90 ring-2 ring-slate-300/40 shadow-md bg-gradient-to-br from-white via-[#f8fafc] to-[#cbd5e1]/30"
              : "border border-gray-200 hover:border-slate-400 hover:shadow-sm"
          }`}
          style={{
            background:
              activeStatIndex === 4
                ? undefined
                : `radial-gradient(450px circle at var(--x, -1000px) var(--y, -1000px), rgba(10, 22, 71, 0.12) 0%, rgba(148, 163, 184, 0.16) 35%, rgba(226, 232, 240, 0.3) 65%, transparent 80%) #ffffff`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0a1647] flex items-center justify-center">
              <Folder size={22} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Total File di Bank Konten
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#0a1647]">
                1.2TB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Kalender Kegiatan (7 Columns on large screen) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
          {/* Header Kalender */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0f1f5c] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <CalendarIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-gray-900">Kalender Kegiatan</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#eef4ff] text-[#0f1f5c] border border-[#c8dcfa]">
                    ● 29 kegiatan
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Klik tanggal untuk melihat kegiatan pada hari itu</p>
              </div>
            </div>

            {/* Event Category Legends & Month selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                <button className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-gray-800">Agustus 2026</span>
                <button className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (Aktif, Review, Selesai, Pending) */}
          <div className="flex flex-wrap items-center gap-3 py-3 text-xs font-medium text-gray-700">
            <span className="flex items-center gap-1.5 bg-[#f0fdf4] text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktif
            </span>
            <span className="flex items-center gap-1.5 bg-[#fffbf5] text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Review
            </span>
            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> Selesai
            </span>
            <span className="flex items-center gap-1.5 bg-[#eff6ff] text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Pending
            </span>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-bold tracking-wider">
            <span className="text-rose-500">MIN</span>
            <span className="text-gray-500">SEN</span>
            <span className="text-gray-500">SEL</span>
            <span className="text-gray-500">RAB</span>
            <span className="text-gray-500">KAM</span>
            <span className="text-gray-500">JUM</span>
            <span className="text-rose-500">SAB</span>
          </div>

          {/* Calendar Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {/* Blank offset for Saturday (1 Agustus 2026 on Saturday, offset 6) */}
            {Array.from({ length: startDayOffset }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-16 rounded-xl bg-gray-50/40 border border-transparent" />
            ))}

            {/* Month days 1 - 31 */}
            {daysInMonth.map((day) => {
              const dayEvents = calendarEvents.filter((e) => e.day === day);
              const isSelected = selectedDay === day;
              const isSunday = (day + startDayOffset - 1) % 7 === 0;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[64px] rounded-xl p-1.5 border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-xs"
                      : "border-gray-200 bg-white hover:bg-gray-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSunday ? "text-rose-500" : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Dark Navy Solid Event Pills inside cell */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(day);
                        }}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0f1f5c] text-white truncate flex items-center gap-1 shadow-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-300 flex-shrink-0" />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Detail Drawer */}
          {selectedDayEvents.length > 0 && (
            <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-gray-800">
                  Agenda Tanggal {selectedDay} Agustus 2026
                </span>
                <button
                  onClick={() => navigate("/petugas/penugasan")}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Buka di Penugasan &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {selectedDayEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0f1f5c] text-white">
                          {evt.title}
                        </span>
                      </div>
                      <div className="flex gap-3 text-[11px] text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" /> {evt.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" /> {evt.location}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/petugas/penugasan")}
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: NAVY }}
                    >
                      Kelola
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Status Alur Kerja Produksi (5 Columns on large screen) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-gray-900">Status Alur Kerja Produksi</h2>
          </div>

          {/* 1. PRAHUM Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-wide">PRAHUM</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Total tugas berjalan</span>
              <span className="font-bold text-gray-900 text-sm">36</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex mb-4">
              <div style={{ width: "8%" }} className="bg-slate-300 h-full" title="Belum: 3" />
              <div style={{ width: "42%" }} className="bg-amber-500 h-full" title="Liputan: 15" />
              <div style={{ width: "33%" }} className="bg-blue-600 h-full" title="Menulis: 12" />
              <div style={{ width: "17%" }} className="bg-emerald-500 h-full" title="Siap Tayang: 6" />
            </div>

            {/* 4 Status Submetrics */}
            <div className="grid grid-cols-4 gap-2 text-center pt-1 border-t border-gray-100">
              <div>
                <User size={15} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-bold text-gray-900">3</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase">BELUM</p>
              </div>
              <div>
                <Users size={15} className="mx-auto text-amber-500 mb-1" />
                <p className="text-sm font-bold text-gray-900">15</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase">LIPUTAN</p>
              </div>
              <div>
                <PenTool size={15} className="mx-auto text-blue-600 mb-1" />
                <p className="text-sm font-bold text-gray-900">12</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase">MENULIS</p>
              </div>
              <div>
                <Camera size={15} className="mx-auto text-emerald-500 mb-1" />
                <p className="text-sm font-bold text-gray-900">6</p>
                <p className="text-[9px] font-semibold text-gray-400 uppercase">SIAP TAYANG</p>
              </div>
            </div>
          </div>

          {/* 2. FOTO Card (With Donut Chart) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 tracking-wide">FOTO</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Donut chart graphic */}
              <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-slate-400"
                    strokeDasharray="11, 100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-500"
                    strokeDasharray="32, 100"
                    strokeDashoffset="-11"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="57, 100"
                    strokeDashoffset="-43"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-extrabold text-gray-900">28</span>
                  <span className="text-[9px] font-semibold text-gray-400">Total</span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="space-y-2 text-xs font-semibold text-gray-700 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0" />
                  <span>11% BELUM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>32% LIPUTAN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>57% SIAP TAYANG</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. VIDEO Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 tracking-wide">VIDEO</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Tugas Baru</span>
                  <span className="font-bold text-gray-900">8</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "80%" }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Sedang Dikerjakan</span>
                  <span className="font-bold text-gray-900">9</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-amber-500" style={{ width: "40%" }} />
                  <div className="h-full bg-blue-600" style={{ width: "50%" }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Finis</span>
                  <span className="font-bold text-gray-900">8</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "30%" }} />
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "70%" }} />
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-gray-500 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" /> Belum
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Liputan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Siap Tayang
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Finis
              </span>
            </div>
          </div>

          {/* 4. DESAINER Card (Kanban Columns) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 tracking-wide">DESAINER</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {/* Column 1: Antrean */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-700 text-[10px]">
                  <span>ANTREAN</span>
                  <span>14</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-800">
                    Banner HUT Kota
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-800">
                    Infografis APBD
                  </div>
                </div>
              </div>

              {/* Column 2: Diproses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-amber-100 px-2 py-1 rounded-md font-bold text-amber-800 text-[10px]">
                  <span>DIPROSES</span>
                  <span>12</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-800">
                    Feeds Instagram
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-800">
                    Revisi Layout
                  </div>
                </div>
              </div>

              {/* Column 3: Selesai */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-emerald-100 px-2 py-1 rounded-md font-bold text-emerald-800 text-[10px]">
                  <span>SELESAI</span>
                  <span>8</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-800">
                    Logo OPD
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-800">
                    Sertifikat
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetugasDashboardPage;
