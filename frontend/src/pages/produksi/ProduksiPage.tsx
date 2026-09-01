import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";
import type { MockProduksi } from "../../lib/mock-data";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import { useLanguage } from "../../lib/LanguageContext";

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

  const columns: TableColumn<MockProduksi>[] = [
    { key: "kegiatan", label: language === "en" ? "Activity" : "Kegiatan" },
    { key: "bidangPekerjaan", label: language === "en" ? "Division" : "Bidang" },
    {
      key: "workLink",
      label: t("produksi_work_link"),
      render: (val) =>
        val ? (
          <a href={val as string} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            {t("produksi_open_link")}
          </a>
        ) : (
          "—"
        ),
    },
    { key: "startDate", label: t("produksi_start_date") },
    { key: "endDate", label: t("produksi_end_date") },
    {
      key: "status",
      label: t("status"),
      render: (val) => getStatusBadge(val as string),
    },
  ];

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
      <Card>
        <Table columns={columns} data={produksi ?? []} />
      </Card>
    </div>
  );
};

export default ProduksiPage;
