import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import Card from "../../components/ui/Card";

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Produksi per OPD">
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Diskominfo</span>
                <span className="font-bold">25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Dinas Pendidikan</span>
                <span className="font-bold">18</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Produksi per Pegawai">
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Andi Prahum</p>
                <p className="text-xs text-gray-500">PRAHUM</p>
              </div>
              <span className="font-bold">15</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Budi Fotografer</p>
                <p className="text-xs text-gray-500">FOTO_VIDEO</p>
              </div>
              <span className="font-bold">12</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LaporanPage;
