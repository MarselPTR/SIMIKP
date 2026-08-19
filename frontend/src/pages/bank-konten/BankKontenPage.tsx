import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import type { MockBankKonten } from "../../lib/mock-data";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";

const BankKontenPage = () => {
  const { data: konten, isLoading, error, refetch } = useQuery({
    queryKey: ["bankKonten"],
    queryFn: mockApi.bankKonten.getAll,
  });

  const columns: TableColumn<MockBankKonten>[] = [
    { key: "title", label: "Judul" },
    { key: "type", label: "Tipe", render: (val) => <Badge variant="info">{val as string}</Badge> },
    { key: "category", label: "Kategori" },
    { key: "tags", label: "Tag", render: (val) => (val as string[])?.join(", ") || "—" },
    { key: "createdAt", label: "Dibuat" },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bank Konten</h2>
          <p className="text-sm text-gray-500">Kelola aset dan konten</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">📤 Upload</Button>
          <Button variant="default">+ Tambah</Button>
        </div>
      </div>
      <Card>
        <Table columns={columns} data={konten ?? []} />
      </Card>
    </div>
  );
};

export default BankKontenPage;
