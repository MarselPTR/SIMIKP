import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { LoadingSpinner, ErrorState } from '../components/shared/StateComponents';

const ProduksiPage = () => {
  const { data: produksi, isLoading, error, refetch } = useQuery({
    queryKey: ['produksi'],
    queryFn: api.produksi.getAll,
  });

  const columns = [
    { key: 'name',      label: 'Nama Produksi' },
    { key: 'qty',       label: 'Jumlah', render: (val, row) => `${val} ${row.unit}` },
    { key: 'startDate', label: 'Mulai' },
    { key: 'endDate',   label: 'Selesai' },
    {
      key: 'status', label: 'Status',
      render: (val) => (
        <Badge variant={val === 'running' ? 'success' : 'default'}>{val}</Badge>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produksi</h2>
          <p className="text-sm text-gray-500">Kelola produksi konten</p>
        </div>
        <Button variant="default">+ Produksi Baru</Button>
      </div>
      <Card>
        <Table columns={columns} data={produksi ?? []} />
      </Card>
    </div>
  );
};

export default ProduksiPage;
