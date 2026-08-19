import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { LoadingSpinner, ErrorState } from '../components/shared/StateComponents';

const KegiatanPage = () => {
  const { data: kegiatan, isLoading, error, refetch } = useQuery({
    queryKey: ['kegiatan'],
    queryFn: api.kegiatan.getAll,
  });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!kegiatan) return [];
    if (!search)   return kegiatan;
    return kegiatan.filter((k) => k.title.toLowerCase().includes(search.toLowerCase()));
  }, [kegiatan, search]);

  const columns = [
    { key: 'title',    label: 'Judul' },
    { key: 'assignee', label: 'Penanggung Jawab' },
    { key: 'deadline', label: 'Deadline' },
    {
      key: 'status', label: 'Status',
      render: (val) => (
        <Badge
          variant={
            val === 'active'  ? 'success' :
            val === 'review'  ? 'warning' :
            val === 'done'    ? 'default' : 'info'
          }
        >
          {val}
        </Badge>
      ),
    },
    {
      key: 'progress', label: 'Progress',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${val}%` }} />
          </div>
          <span className="text-xs text-gray-500">{val}%</span>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kegiatan</h2>
          <p className="text-sm text-gray-500">Kelola semua kegiatan proyek</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Cari kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Button variant="default">+ Tambah</Button>
        </div>
      </div>
      <Card>
        <Table columns={columns} data={filtered} />
      </Card>
    </div>
  );
};

export default KegiatanPage;
