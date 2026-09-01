import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../lib/api-client";
import type { MockPublikasi } from "../../lib/mock-data";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useToast } from "../../contexts/ToastContext";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import { useLanguage } from "../../lib/LanguageContext";

const PublikasiPage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", channel: "Website", url: "", status: "scheduled" });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/publications", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publikasi"] });
      setIsModalOpen(false);
      setFormData({ title: "", channel: "Website", url: "", status: "scheduled" });
      addToast(language === "en" ? "Publication added successfully" : "Publikasi berhasil ditambahkan", "success");
    },
    onError: (err: any) => addToast(err.message || (language === "en" ? "Failed to add publication" : "Gagal menambah publikasi"), "error"),
  });

  const { data: publikasi = [], isLoading, error, refetch } = useQuery({
    queryKey: ["publikasi"],
    queryFn: async () => {
      const res = await apiFetch<{ data: any[] }>("/publications");
      return res.data;
    },
  });

  const getStatusLabel = (val: string) => {
    if (val === "published") return language === "en" ? "Published" : "Diterbitkan";
    if (val === "scheduled") return language === "en" ? "Scheduled" : "Dijadwalkan";
    return val;
  };

  const columns: TableColumn<MockPublikasi>[] = [
    { key: "title", label: t("pub_col_title") },
    { key: "channel", label: t("pub_col_channel") },
    {
      key: "link",
      label: t("pub_col_link"),
      render: (val) =>
        val ? (
          <a href={val as string} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            {t("produksi_open_link")}
          </a>
        ) : (
          "—"
        ),
    },
    { key: "publishDate", label: t("pub_col_publish_date"), render: (val) => (val as string) || "—" },
    { key: "views", label: t("pub_col_views") },
    {
      key: "status",
      label: t("status"),
      render: (val) => (
        <Badge variant={val === "published" ? "success" : val === "scheduled" ? "warning" : "default"}>
          {getStatusLabel(val as string)}
        </Badge>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner text={t("loading")} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const handleSubmit = () => {
    if (!formData.title) {
      addToast(language === "en" ? "Please enter content title" : "Mohon isi judul produksi", "warning");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400">{t("pub_title")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t("pub_subtitle")}</p>
        </div>
        <Button variant="default" onClick={() => setIsModalOpen(true)} className="bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#162a7a] dark:hover:bg-blue-700 text-white shadow-xs">
          + {t("pub_add_btn")}
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={publikasi ?? []} />
      </Card>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("pub_modal_title")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t("pub_col_title")}</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={language === "en" ? "Enter publication title..." : "Masukkan judul produksi..."}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t("pub_col_channel")}</label>
            <Select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              options={[
                { value: "Website", label: t("pub_channel_website") },
                { value: "Instagram", label: t("pub_channel_instagram") },
                { value: "YouTube", label: t("pub_channel_youtube") },
                { value: "Facebook", label: t("pub_channel_facebook") },
                { value: "TikTok", label: t("pub_channel_tiktok") },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t("pub_col_status")}</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: "scheduled", label: t("pub_status_scheduled") },
                { value: "published", label: t("pub_status_published") },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t("pub_col_link")}</label>
            <Input
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending} className="bg-[#0f1f5c] dark:bg-blue-600 text-white">
              {t("save")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PublikasiPage;
