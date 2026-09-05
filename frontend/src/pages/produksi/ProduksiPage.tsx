import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";
import type { ApiProduksi } from "../../types/api.types";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import { useLanguage } from "../../lib/LanguageContext";
import { Calendar, MapPin, Clock } from "lucide-react";

const ProduksiPage = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { data: produksi = [], isLoading, error, refetch } = useQuery({
    queryKey: ["produksi"],
    queryFn: async () => (await apiFetch<{ data: any[] }>("/productions")).data,
  });

  const getStatusBadge = (str: string) => {
    let v = "default";
    let text = str.replace("_", " ");
    if (str === "SELESAI" || str === "SIAP_TAYANG" || str === "COMPLETED") {
      v = "success";
      text = language === "en" ? "Completed" : "Selesai";
    } else if (str === "REVISI") {
      v = "warning";
      text = language === "en" ? "Revision" : "Revisi";
    } else if (str === "LIPUTAN" || str === "DESAIN" || str === "IN_PROGRESS") {
      v = "info";
      text = language === "en" ? "In Progress" : "Sedang Dikerjakan";
    }
    return <Badge variant={v as any}>{text}</Badge>;
  };

  const columns: TableColumn<ApiProduksi>[] = [
    { key: "bidangPekerjaan", label: language === "en" ? "Division" : "Bidang" },
    {
      key: "picName",
      label: language === "en" ? "Officer" : "Petugas",
      render: (val) => (
        <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
          <div className="w-6 h-6 rounded-full bg-[#0f1f5c]/10 dark:bg-sky-500/10 flex items-center justify-center text-[10px] text-[#0f1f5c] dark:text-sky-400">
            {val ? (val as string).slice(0, 2).toUpperCase() : "PT"}
          </div>
          <span>{val ? (val as string) : "—"}</span>
        </div>
      ),
    },
    { 
      key: "startDate", 
      label: t("produksi_start_date"),
      render: (_, row) => (
        <div className="flex flex-col text-xs">
          <span>{row.startDate ? row.startDate.substring(0, 5) : "—"} - {row.endDate ? row.endDate.substring(0, 5) : "—"}</span>
        </div>
      )
    },
    {
      key: "status",
      label: t("status"),
      render: (val) => getStatusBadge(val as string),
    },
  ];

  const parseActivityTime = (timeStr?: string) => {
    if (!timeStr) return { start: "08:00", end: "10:00" };
    const parts = timeStr.split("-").map(t => t.trim().slice(0, 5));
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { start: parts[0], end: parts[1] };
    } else if (parts.length >= 1 && parts[0]) {
      const startHour = parseInt(parts[0].split(":")[0] || "8", 10);
      const endHour = (startHour + 2).toString().padStart(2, "0");
      const endStr = `${endHour}:${parts[0].split(":")[1] || "00"}`;
      return { start: parts[0], end: endStr };
    }
    return { start: "08:00", end: "10:00" };
  };

  const groups = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of (produksi || [])) {
      const key = item.activityId || item.kegiatan;
      if (!map.has(key)) {
        map.set(key, {
          activityId: item.activityId,
          kegiatan: item.kegiatan,
          tanggalKegiatan: item.tanggalKegiatan,
          activityTime: item.activityTime,
          lokasi: item.lokasi,
          items: []
        });
      }
      map.get(key).items.push(item);
    }
    return Array.from(map.values());
  }, [produksi]);

  if (isLoading) return <LoadingSpinner text={t("loading")} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400">{t("produksi_title")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t("produksi_subtitle")}</p>
        </div>
        <Button variant="default" onClick={() => navigate("/penugasan?action=create")} className="bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#162a7a] dark:hover:bg-blue-700 text-white shadow-xs">
          + {t("produksi_add_btn")}
        </Button>
      </div>
      <div className="space-y-6">
        {groups.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 dark:text-gray-400 border-dashed">
            {language === "en" ? "No productions found." : "Belum ada data produksi konten."}
          </Card>
        ) : (
          groups.map((group: any, idx: number) => {
            const dateStr = group.tanggalKegiatan 
              ? new Date(group.tanggalKegiatan).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              : (language === "en" ? "Date Not Set" : "Tanggal Belum Ditentukan");
            
            const timeObj = parseActivityTime(group.activityTime);

            return (
              <Card key={group.activityId || idx} className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                {/* Group Header */}
                <div className="p-5 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800/60">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{group.kegiatan}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-xs">
                      <Calendar size={13} className="text-blue-600 dark:text-sky-400" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-xs">
                      <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                      <span>{timeObj.start} - {timeObj.end}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-xs">
                      <MapPin size={13} className="text-rose-600 dark:text-rose-400" />
                      <span>{group.lokasi || (language === "en" ? "Location Not Set" : "Lokasi Belum Ditentukan")}</span>
                    </div>
                  </div>
                </div>
                {/* Group Items */}
                <div className="p-0 sm:p-2">
                  <Table columns={columns} data={group.items} />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProduksiPage;
