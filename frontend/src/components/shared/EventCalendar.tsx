
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";

const NAVY = "#0f1f5c";

export interface CalendarEvent {
  color: string;
  label: string;
}

interface EventCalendarProps {
  year: number;
  month: number; // 0-11
  events: Record<string, CalendarEvent[]>;
  legend?: { label: string; color: string }[];
  title?: string;
  subtitle?: string;
  selectedDateKey?: string | null;
  onDayClick?: (dateKey: string, day: number) => void;
  onNavigate?: (year: number, month: number) => void;
  maxEventsPerDay?: number;
  /** Sel dipersempit (mis. saat panel detail terbuka di samping) — event ditampilkan sebagai dot saja, bukan chip berlabel, supaya teks tidak terpotong jadi tidak terbaca. */
  compact?: boolean;
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const dateKeyOf = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const EventCalendar = ({
  year,
  month,
  events,
  legend,
  title = "Kalender Kegiatan",
  subtitle,
  selectedDateKey,
  onDayClick,
  onNavigate,
  maxEventsPerDay = 2,
  compact = false,
}: EventCalendarProps) => {
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDayOffset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const eventsThisMonth = Object.entries(events).reduce(
    (sum, [key, list]) => (key.startsWith(monthPrefix) ? sum + list.length : sum),
    0,
  );

  const goPrev = () => {
    if (!onNavigate) return;
    const d = new Date(year, month - 1, 1);
    onNavigate(d.getFullYear(), d.getMonth());
  };
  const goNext = () => {
    if (!onNavigate) return;
    const d = new Date(year, month + 1, 1);
    onNavigate(d.getFullYear(), d.getMonth());
  };
  const goToday = () => {
    if (!onNavigate) return;
    onNavigate(today.getFullYear(), today.getMonth());
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #24399e)`, color: "#fff" }}
          >
            <CalendarDays className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {eventsThisMonth > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${NAVY}12`, color: NAVY }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NAVY }} />
                  {eventsThisMonth} kegiatan
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {legend && legend.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {legend.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${item.color}0F`,
                    color: item.color,
                    boxShadow: `inset 0 0 0 1px ${item.color}22`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          )}

          {onNavigate && (
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={goPrev}
                className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all duration-150"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-700 min-w-[8.5rem] text-center select-none">
                {MONTH_LABELS[month]} {year}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all duration-150"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={goToday}
                  className="ml-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors duration-150 hover:brightness-95"
                  style={{ backgroundColor: `${NAVY}12`, color: NAVY }}
                >
                  Hari Ini
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1.5 pb-1.5 border-b border-gray-100">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[11px] font-semibold tracking-wide uppercase py-1 ${
              i === 0 || i === 6 ? "text-rose-500 font-bold" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Bento grid — setiap tanggal adalah kartu mengambang tersendiri */}
      <div key={`${year}-${month}`} className="grid grid-cols-7 gap-1.5 pt-1 animate-in fade-in slide-in-from-right-2 duration-300">
        {cells.map((day, idx) => {
          const dateKey = day ? dateKeyOf(year, month, day) : null;
          const dayEvents = dateKey ? events[dateKey] ?? [] : [];
          const isToday = isCurrentMonth && day === today.getDate();
          const isSelected = !!dateKey && dateKey === selectedDateKey;
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;
          const clickable = day !== null && !!onDayClick;

          if (!day) {
            return <div key={idx} className="min-h-[88px]" />;
          }

          let cellClass = "bg-white border-gray-200/90 shadow-2xs";
          if (isSelected) {
            cellClass = "bg-white border-blue-600 ring-2 ring-blue-500/25 shadow-md";
          } else if (isToday) {
            cellClass = "bg-white border-[#0f1f5c] ring-2 ring-[#0f1f5c]/20 shadow-sm";
          } else if (isWeekend) {
            cellClass = "bg-white border-gray-200/90";
          }

          return (
            <div
              key={idx}
              onClick={() => {
                if (dateKey) onDayClick?.(dateKey, day);
              }}
              className={`group relative rounded-xl min-h-[88px] px-2 py-1.5 text-xs border transition-all duration-200 ease-out ${cellClass} ${
                clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400 hover:z-10" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[12px] font-semibold inline-flex items-center justify-center w-[22px] h-[22px] rounded-full transition-all duration-150 ${
                    isSelected
                      ? "text-white shadow-sm"
                      : isToday
                        ? "text-white shadow-sm"
                        : isWeekend
                          ? "text-rose-500 font-bold"
                          : "text-gray-800"
                  }`}
                  style={
                    isSelected
                      ? { background: "linear-gradient(135deg, #3b82f6, #2563eb)" }
                      : isToday
                        ? { background: `linear-gradient(135deg, ${NAVY}, #24399e)` }
                        : undefined
                  }
                >
                  {day}
                </span>
                {clickable && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Plus className="w-3 h-3 text-blue-600" strokeWidth={2.5} />
                  </span>
                )}
              </div>
              {compact ? (
                dayEvents.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1 px-0.5">
                    {dayEvents.slice(0, 4).map((ev, i) => (
                      <span
                        key={i}
                        title={ev.label}
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#0f1f5c] border border-white shadow-xs"
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] font-medium text-gray-500 leading-none">+{dayEvents.length - 4}</span>
                    )}
                  </div>
                ) : null
              ) : (
                <div className="mt-1 space-y-[3px]">
                  {dayEvents.slice(0, maxEventsPerDay).map((ev, i) => (
                    <div
                      key={i}
                      title={ev.label}
                      className="flex items-center gap-1.5 rounded-full px-2 py-[3.5px] leading-none bg-[#0f1f5c] shadow-2xs transition-transform hover:scale-[1.02]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ev.color || "#38bdf8" }}
                      />
                      <span className="text-[10px] font-semibold text-white truncate">
                        {ev.label}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > maxEventsPerDay && (
                    <div className="text-[10px] font-semibold text-slate-500 px-1.5">
                      +{dayEvents.length - maxEventsPerDay} lainnya
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventCalendar;
