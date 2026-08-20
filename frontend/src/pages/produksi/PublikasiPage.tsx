import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import type { MockPublikasi } from "../../lib/mock-data";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";

const PublikasiPage = () => {
  const { data: publikasi, isLoading, error, refetch } = useQuery({
    queryKey: ["publikasi"],
    queryFn: mockApi.publikasi.getAll,
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Publikasi</h2>
          <p className="text-sm text-gray-500">Kelola publikasi konten</p>
        </div>
        <Button variant="default">+ Publikasi Baru</Button>
      </div>
      <Card>
        <Table columns={columns} data={publikasi ?? []} />
      </Card>
    </div>
  );
};

export default PublikasiPage;
