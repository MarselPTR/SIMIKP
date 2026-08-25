import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
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
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: MockKegiatan[] }>("/activities");
      return res.data;
    },
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

  const { data: opds } = useQuery({
    queryKey: ["opds"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: any[] }>("/master/opds");
      return res.data;
    },
  });

  const { data: contentTypes } = useQuery({
    queryKey: ["contentTypes"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: any[] }>("/master/content-types");
      return res.data;
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    activityDate: "",
    activityTime: "",
    opdId: "",
    outputDibutuhkan: [] as string[],
  });

  const handleSubmit = async () => {
    try {
      await apiFetch("/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setIsModalOpen(false);
      refetch(); // Reload table
      setFormData({ title: "", activityDate: "", activityTime: "", opdId: "", outputDibutuhkan: [] });
    } catch (e) {
      alert("Gagal menyimpan kegiatan");
    }
  };

  const handleToggleOutput = (id: string) => {
    setFormData((prev) => {
      const isSelected = prev.outputDibutuhkan.includes(id);
      return {
        ...prev,
        outputDibutuhkan: isSelected
          ? prev.outputDibutuhkan.filter((x) => x !== id)
          : [...prev.outputDibutuhkan, id],
      };
    });
  };

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
            <Input 
              placeholder="Contoh: Upacara Hari Jadi Kota" 
              className="mt-1" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tanggal</label>
              <Input type="date" className="mt-1" value={formData.activityDate} onChange={e => setFormData({ ...formData, activityDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jam Mulai</label>
              <Input type="time" className="mt-1" value={formData.activityTime} onChange={e => setFormData({ ...formData, activityTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">OPD Penyelenggara</label>
            <Select 
              options={(opds || []).map(o => ({ value: o.id, label: o.name }))} 
              placeholder="Pilih OPD"
              className="mt-1"
              value={formData.opdId}
              onChange={e => setFormData({ ...formData, opdId: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Output yang Dibutuhkan</label>
            <div className="grid grid-cols-2 gap-2">
              {(contentTypes || []).map(ct => (
                <label key={ct.id} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.outputDibutuhkan.includes(ct.id)}
                    onChange={() => handleToggleOutput(ct.id)} 
                  /> 
                  {ct.name}
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="default" onClick={handleSubmit}>Simpan Kegiatan</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default KegiatanPage;
