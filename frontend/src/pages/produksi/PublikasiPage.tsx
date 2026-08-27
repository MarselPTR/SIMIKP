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

const PublikasiPage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
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
      addToast("Publikasi berhasil ditambahkan", "success");
    },
    onError: (err: any) => addToast(err.message || "Gagal menambah publikasi", "error"),
  });

  const { data: publikasi = [], isLoading, error, refetch } = useQuery({
    queryKey: ["publikasi"],
    queryFn: async () => {
      const res = await apiFetch<{ data: any[] }>("/publications");
      return res.data;
    },
  });

  const columns: TableColumn<MockPublikasi>[] = [
    { key: "title", label: "Judul" },
    { key: "channel", label: "Kanal Publikasi" },
    { key: "link", label: "Tautan", render: (val) => val ? <a href={val as string} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Buka Link</a> : "—" },
    { key: "publishDate", label: "Tanggal Terbit", render: (val) => (val as string) || "—" },
    { key: "views", label: "Tayangan" },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <Badge variant={val === "published" ? "success" : val === "scheduled" ? "warning" : "default"}>
          {val as string}
        </Badge>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const handleSubmit = () => {
    if (!formData.title) {
      addToast("Mohon isi judul produksi", "warning");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Publikasi</h2>
          <p className="text-sm text-gray-500">Kelola publikasi konten</p>
        </div>
        <Button variant="default" onClick={() => setIsModalOpen(true)}>+ Publikasi Baru</Button>
      </div>
      <Card>
        <Table columns={columns} data={publikasi ?? []} />
      </Card>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publikasi Baru"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Produksi</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masukkan judul produksi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kanal Publikasi</label>
            <Select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              options={[
                { value: "Website", label: "Website" },
                { value: "Instagram", label: "Instagram" },
                { value: "YouTube", label: "YouTube" }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Publikasi</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: "scheduled", label: "Scheduled" },
                { value: "published", label: "Published" }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
            <Input
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>Simpan</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PublikasiPage;
