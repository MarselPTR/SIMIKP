import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import type { MockPenugasan } from "../../lib/mock-data";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";

const PenugasanPage = () => {
  const { data: penugasan, isLoading, error, refetch } = useQuery({
    queryKey: ["penugasan"],
    queryFn: mockApi.penugasan.getAll,
  });

  const columns: TableColumn<MockPenugasan>[] = [
    { key: "title", label: "Tugas" },
    { key: "assignedTo", label: "Ditugaskan Kepada" },
    { key: "dueDate", label: "Tenggat" },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <Badge variant={val === "done" ? "success" : val === "in-progress" ? "warning" : "default"}>
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
          <h2 className="text-2xl font-bold text-gray-900">Penugasan</h2>
          <p className="text-sm text-gray-500">Kelola penugasan tim</p>
        </div>
        <Button variant="default">+ Tugas Baru</Button>
      </div>
      <Card>
        <Table columns={columns} data={penugasan ?? []} />
      </Card>
    </div>
  );
};

export default PenugasanPage;
