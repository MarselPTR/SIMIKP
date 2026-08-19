import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { EmptyState } from "../../components/shared/StateComponents";

const LaporanPage = () => {
  const { data: kegiatan } = useQuery({ queryKey: ["kegiatan"], queryFn: mockApi.kegiatan.getAll });
  const { data: produksi } = useQuery({ queryKey: ["produksi"], queryFn: mockApi.produksi.getAll });
  const { data: publikasi } = useQuery({ queryKey: ["publikasi"], queryFn: mockApi.publikasi.getAll });

  const totalKegiatan = kegiatan?.length ?? 0;
  const totalProduksi = produksi?.length ?? 0;
  const totalPublikasi = publikasi?.length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Laporan</h2>
        <p className="text-sm text-gray-500">Ringkasan laporan seluruh aktivitas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500">Total Kegiatan</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalKegiatan}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500">Total Produksi</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalProduksi}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500">Total Publikasi</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalPublikasi}</p>
        </Card>
      </div>

      <Card title="Ringkasan Kegiatan">
        <div className="space-y-2">
          {kegiatan?.slice(0, 5).map((k) => (
            <div key={k.id} className="flex items-center justify-between p-2 border-b border-gray-100">
              <span className="text-sm">{k.title}</span>
              <Badge variant={k.status === "active" ? "success" : "default"}>{k.status}</Badge>
            </div>
          ))}
          {(!kegiatan || kegiatan.length === 0) && <EmptyState title="Belum ada kegiatan" />}
        </div>
      </Card>
    </div>
  );
};

export default LaporanPage;
