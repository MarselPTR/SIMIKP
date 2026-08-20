import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import type { MockPenugasan } from "../../lib/mock-data";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import { AlertTriangle } from "lucide-react";

const PenugasanPage = () => {
  const { data: penugasan, isLoading, error, refetch } = useQuery({
    queryKey: ["penugasan"],
    queryFn: mockApi.penugasan.getAll,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const columns: TableColumn<MockPenugasan>[] = [
    { key: "kegiatanTerkait", label: "Kegiatan Terkait" },
    { key: "jenisKonten", label: "Output (Jenis Konten)", render: (val) => <span className="font-semibold text-gray-700">{val as string}</span> },
    { key: "pic", label: "PIC" },
    { key: "jamMulai", label: "Waktu (Mulai - Selesai)", render: (_, row) => `${row.jamMulai} - ${row.jamSelesai}` },
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

  const handleSimpan = () => {
    if (!showWarning) {
      setShowWarning(true); // Simulate a backend conflict warning on first click
    } else {
      setIsModalOpen(false);
      setShowWarning(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Penugasan</h2>
          <p className="text-sm text-gray-500">Kelola penugasan tim (Pilih PIC & Deteksi Bentrok)</p>
        </div>
        <Button variant="default" onClick={() => setIsModalOpen(true)}>+ Tugas Baru</Button>
      </div>
      <Card>
        <Table columns={columns} data={penugasan ?? []} />
      </Card>

      <Dialog open={isModalOpen} onClose={() => { setIsModalOpen(false); setShowWarning(false); }} title="Buat Penugasan Baru">
        <div className="space-y-4 mt-4">
          {showWarning && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">⚠️ Peringatan: PIC memiliki penugasan yang bertabrakan.</p>
                <p className="text-xs text-amber-700 mt-1">Sistem mendeteksi jadwal ganda pada jam ini. Anda tetap dapat menyimpan tugas jika diperlukan.</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Pilih PIC (Pegawai)</label>
            <Select 
              options={[
                { value: "andi", label: "Andi Prahum (PRAHUM)" },
                { value: "budi", label: "Budi Fotografer (FOTO_VIDEO)" },
                { value: "citra", label: "Citra Desainer (DESAINER_EDITOR)" }
              ]} 
              placeholder="Pilih PIC"
              className="mt-1" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Kegiatan Terkait</label>
            <Select 
              options={[
                { value: "keg1", label: "Upacara Hari Jadi Kota" },
              ]} 
              placeholder="Pilih Kegiatan"
              className="mt-1" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Jam Mulai</label>
              <Input type="time" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jam Selesai</label>
              <Input type="time" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Deadline Pengumpulan</label>
            <Input type="datetime-local" className="mt-1" />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setShowWarning(false); }}>Batal</Button>
            <Button variant={showWarning ? "warning" : "default"} onClick={handleSimpan}>
              {showWarning ? "Tetap Simpan" : "Simpan Penugasan"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PenugasanPage;
