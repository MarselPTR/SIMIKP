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

const ProduksiPage = () => {
  const navigate = useNavigate();
  const { data: produksi = [], isLoading, error, refetch } = useQuery({
    queryKey: ["produksi"],
    queryFn: async () => (await apiFetch<{ data: any[] }>("/productions")).data,
  });

  const columns: TableColumn<MockProduksi>[] = [
    { key: "kegiatan", label: "Kegiatan" },
    { key: "bidangPekerjaan", label: "Bidang" },
    { key: "workLink", label: "Link Kerja", render: (val) => val ? <a href={val as string} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Buka Link</a> : "—" },
    { key: "startDate", label: "Mulai" },
    { key: "endDate", label: "Selesai" },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const str = val as string;
        let v = "default";
        if (str === "SELESAI" || str === "SIAP_TAYANG") v = "success";
        else if (str === "REVISI") v = "warning";
        else if (str === "LIPUTAN" || str === "DESAIN") v = "info";
        return <Badge variant={v as any}>{str.replace("_", " ")}</Badge>;
      },
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produksi</h2>
          <p className="text-sm text-gray-500">Kelola produksi konten</p>
        </div>
        <Button variant="default" onClick={() => navigate("/penugasan?action=create")}>+ Produksi Baru</Button>
      </div>
      <Card>
        <Table columns={columns} data={produksi ?? []} />
      </Card>
    </div>
  );
};

export default ProduksiPage;
