import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import type { MockKegiatan } from "../../lib/mock-data";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import type { TableColumn } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Select from "../../components/ui/Select";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";

const KegiatanPage = () => {
  const { data: kegiatan, isLoading, error, refetch } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: mockApi.kegiatan.getAll,
  });
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!kegiatan) return [];
    let res = kegiatan;
    if (search) {
      res = res.filter((k) => k.title.toLowerCase().includes(search.toLowerCase()));
    }
    // Simplistic filter mock
    if (filterDate === "today") res = res.slice(0, 2);
    if (filterDate === "tomorrow") res = res.slice(2, 4);
    if (filterDate === "this_week") res = res.slice(0, 5);
    return res;
  }, [kegiatan, search, filterDate]);

  const columns: TableColumn<MockKegiatan>[] = [
    { key: "title", label: "Judul Kegiatan" },
    { key: "opdPenyelenggara", label: "OPD Penyelenggara", render: (val) => (val as string) || "—" },
    { key: "outputDibutuhkan", label: "Output", render: (val) => ((val as string[])?.join(", ") || "—") },
    { key: "prioritas", label: "Prioritas", render: (val) => (
      <Badge variant={val === "Tinggi" ? "warning" : val === "Sedang" ? "info" : "default"}>
        {val as string}
      </Badge>
    )},
    { key: "lokasi", label: "Lokasi" },
    { key: "deadline", label: "Tanggal" },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <Badge
          variant={
            val === "active" ? "success" : val === "review" ? "warning" : val === "done" ? "default" : "info"
          }
        >
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
          <h2 className="text-2xl font-bold text-gray-900">Agenda Kegiatan</h2>
          <p className="text-sm text-gray-500">Kelola jadwal kegiatan (Satu Kegiatan = Satu Data Induk)</p>
        </div>
        <Button variant="default" onClick={() => setIsModalOpen(true)}>+ Tambah Kegiatan</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
        <Input
          placeholder="Cari kegiatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <Button variant={filterDate === "today" ? "default" : "outline"} onClick={() => setFilterDate("today")}>Hari Ini</Button>
        <Button variant={filterDate === "tomorrow" ? "default" : "outline"} onClick={() => setFilterDate("tomorrow")}>Besok</Button>
        <Button variant={filterDate === "this_week" ? "default" : "outline"} onClick={() => setFilterDate("this_week")}>Minggu Ini</Button>
        <Button variant={filterDate === "all" ? "default" : "outline"} onClick={() => setFilterDate("all")}>Semua</Button>
      </div>

      <Card>
        <Table columns={columns} data={filtered} />
      </Card>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Kegiatan Baru">
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Kegiatan</label>
            <Input placeholder="Contoh: Upacara Hari Jadi Kota" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tanggal</label>
              <Input type="date" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Mulai</label>
                <Input type="time" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Selesai</label>
                <Input type="time" className="mt-1" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">OPD Penyelenggara</label>
            <Select 
              options={[
                { value: "diskominfo", label: "Diskominfo" },
                { value: "dispendik", label: "Dinas Pendidikan" },
                { value: "dinkes", label: "Dinas Kesehatan" }
              ]} 
              placeholder="Pilih OPD"
              className="mt-1" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Output yang Dibutuhkan</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" /> Naskah Berita</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Foto</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Video</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Reels</label>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="default" onClick={() => setIsModalOpen(false)}>Simpan Kegiatan</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default KegiatanPage;
