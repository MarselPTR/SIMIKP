import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

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
  compact?: boolean;
}

const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_LABELS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const MONTH_LABELS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const dateKeyOf = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const EventCalendar = ({
  year,
  month,
  events,
  legend,
  title,
  subtitle,
  selectedDateKey,
  onDayClick,
  onNavigate,
  maxEventsPerDay = 2,
  compact = false,
}: EventCalendarProps) => {
  const { language, t } = useLanguage();
  const dayLabels = language === "en" ? DAY_LABELS_EN : DAY_LABELS_ID;
  const monthLabels = language === "en" ? MONTH_LABELS_EN : MONTH_LABELS_ID;
  const displayTitle = title ?? t("dash_activity_calendar");

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
    <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors">
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
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{displayTitle}</h3>
              {eventsThisMonth > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-[#0f1f5c] dark:text-sky-300 border border-blue-200/60 dark:border-blue-900"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f1f5c] dark:bg-sky-400" />
                  {eventsThisMonth} {language === "en" ? "events" : "kegiatan"}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
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
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    boxShadow: `inset 0 0 0 1px ${item.color}30`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          )}

          {onNavigate && (
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={goPrev}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-150 cursor-pointer"
                aria-label={language === "en" ? "Previous month" : "Bulan sebelumnya"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[8.5rem] text-center select-none">
                {monthLabels[month]} {year}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-150 cursor-pointer"
                aria-label={language === "en" ? "Next month" : "Bulan berikutnya"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={goToday}
                  className="ml-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors duration-150 hover:brightness-95 bg-blue-100 dark:bg-blue-900/60 text-[#0f1f5c] dark:text-sky-200 cursor-pointer"
                >
                  {t("today")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1.5 pb-1.5 border-b border-gray-100 dark:border-gray-800">
        {dayLabels.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[11px] font-semibold tracking-wide uppercase py-1 ${
              i === 0 || i === 6 ? "text-rose-500 font-bold" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Bento grid */}
      <div key={`${year}-${month}-${language}`} className="grid grid-cols-7 gap-1.5 pt-1 animate-in fade-in slide-in-from-right-2 duration-300">
        {cells.map((day, idx) => {
          const dateKey = day ? dateKeyOf(year, month, day) : null;
          const dayEvents = dateKey ? events[dateKey] ?? [] : [];
          const hasEvents = dayEvents.length > 0;
          const isToday = isCurrentMonth && day === today.getDate();
          const isSelected = !!dateKey && dateKey === selectedDateKey;
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;
          const clickable = day !== null && !!onDayClick;

          if (!day) {
            return <div key={idx} className="min-h-[88px]" />;
          }

          let cellClass = "bg-white dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 shadow-2xs";
          if (isSelected) {
            cellClass = "bg-blue-50/60 dark:bg-blue-950/60 border-blue-600 dark:border-sky-400 ring-2 ring-blue-500/25 shadow-md";
          } else if (hasEvents) {
            cellClass = "bg-blue-50/30 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/80 hover:border-[#0f1f5c] dark:hover:border-sky-400 shadow-xs";
          } else if (isToday) {
            cellClass = "bg-white dark:bg-gray-900 border-blue-400 dark:border-blue-600";
          } else if (isWeekend) {
            cellClass = "bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-800/80";
          }

          return (
            <div
              key={idx}
              onClick={() => {
                if (dateKey) onDayClick?.(dateKey, day);
              }}
              className={`group relative rounded-xl min-h-[88px] px-2 py-1.5 text-xs border transition-all duration-200 ease-out ${cellClass} ${
                clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400 dark:hover:border-sky-500 hover:z-10" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[12px] font-semibold inline-flex items-center justify-center w-[22px] h-[22px] rounded-full transition-all duration-150 ${
                    isSelected
                      ? "text-white shadow-sm"
                      : hasEvents
                      ? "text-white shadow-2xs bg-[#0f1f5c] dark:bg-blue-600 font-bold"
                      : isToday
                      ? "text-[#0f1f5c] dark:text-sky-300 font-extrabold ring-1.5 ring-[#0f1f5c]/40 dark:ring-sky-500/40 bg-blue-50/80 dark:bg-blue-950"
                      : isWeekend
                      ? "text-rose-500 font-bold"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                  style={
                    isSelected
                      ? { background: "linear-gradient(135deg, #3b82f6, #2563eb)" }
                      : undefined
                  }
                >
                  {day}
                </span>
                {clickable && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Plus className="w-3 h-3 text-blue-600 dark:text-sky-400" strokeWidth={2.5} />
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
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#0f1f5c] dark:bg-sky-400 border border-white dark:border-gray-900 shadow-xs"
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 leading-none">+{dayEvents.length - 4}</span>
                    )}
                  </div>
                ) : null
              ) : (
                <div className="mt-1 space-y-[3px]">
                  {dayEvents.slice(0, maxEventsPerDay).map((ev, i) => (
                    <div
                      key={i}
                      title={ev.label}
                      className="flex items-center gap-1.5 rounded-full px-2 py-[3.5px] leading-none bg-[#0f1f5c] dark:bg-slate-800 shadow-2xs transition-transform hover:scale-[1.02] border dark:border-slate-700"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ev.color || "#38bdf8" }}
                      />
                      <span className="text-[10px] font-semibold text-white dark:text-gray-100 truncate">
                        {ev.label}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > maxEventsPerDay && (
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 px-1.5">
                      +{dayEvents.length - maxEventsPerDay} {language === "en" ? "more" : "lainnya"}
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
