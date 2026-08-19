import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { LoadingSpinner, ErrorState } from '../components/shared/StateComponents';

const ReviewPage = () => {
  const { data: reviews, isLoading, error, refetch } = useQuery({
    queryKey: ['review'],
    queryFn: api.review.getAll,
  });

  const columns = [
    { key: 'content',     label: 'Konten' },
    { key: 'reviewer',    label: 'Reviewer' },
    { key: 'submittedAt', label: 'Diajukan' },
    {
      key: 'status', label: 'Status',
      render: (val) => (
        <Badge variant={val === 'approved' ? 'success' : val === 'revision' ? 'warning' : 'default'}>
          {val}
        </Badge>
      ),
    },
    { key: 'feedback', label: 'Feedback', render: (val) => val || '—' },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error)     return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review</h2>
          <p className="text-sm text-gray-500">Kelola review konten</p>
        </div>
        <Button variant="default">+ Ajukan Review</Button>
      </div>
      <Card>
        <Table columns={columns} data={reviews ?? []} />
      </Card>
    </div>
  );
};

export default ReviewPage;
