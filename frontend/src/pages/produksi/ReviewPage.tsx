import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
import type { MockReview } from "../../lib/mock-data";
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

const ReviewPage = () => {
  const { data: reviews = [], isLoading, error, refetch } = useQuery({
    queryKey: ["review"],
    queryFn: async () => {
      const res = await apiFetch<{ data: any[] }>("/reviews");
      // Meneruskan data langsung, mapping dilakukan jika nama propertinya berbeda,
      // tetapi backend sudah mengembalikan `content`, `reviewer`, `status`, `submittedAt`, `feedback`!
      return res.data;
    },
  });

  const columns: TableColumn<MockReview>[] = [
    { key: "content", label: "Konten" },
    { key: "reviewer", label: "Reviewer" },
    { key: "submittedAt", label: "Diajukan" },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <Badge variant={val === "approved" ? "success" : val === "revision" ? "warning" : "default"}>
          {val as string}
        </Badge>
      ),
    },
    { key: "feedback", label: "Feedback", render: (val) => (val as string) || "—" },
  ];

  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ content: "", status: "pending", feedback: "" });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setIsModalOpen(false);
      setFormData({ content: "", status: "pending", feedback: "" });
      addToast("Review berhasil diajukan", "success");
    },
    onError: (err: any) => addToast(err.message || "Gagal mengajukan review", "error"),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const handleSubmit = () => {
    if (!formData.content) {
      addToast("Mohon isi judul konten", "warning");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review</h2>
          <p className="text-sm text-gray-500">Kelola review konten</p>
        </div>
        <Button variant="default" onClick={() => setIsModalOpen(true)}>+ Ajukan Review</Button>
      </div>
      <Card>
        <Table columns={columns} data={reviews ?? []} />
      </Card>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajukan Review Baru"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Konten / Produksi</label>
            <Input
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Masukkan judul produksi yang direview"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Review</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "revision", label: "Revision" }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Catatan</label>
            <Input
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="Catatan revisi jika ada..."
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

export default ReviewPage;
