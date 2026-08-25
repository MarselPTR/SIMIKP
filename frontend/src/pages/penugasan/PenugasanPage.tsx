import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
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

interface AssignmentRow {
  id: string;
  activityTitle: string;
  activityDate: string;
  picName: string;
  contentType: string;
  startTime: string;
  endTime: string;
  status: string;
}

const PenugasanPage = () => {
  const { data: penugasan, isLoading, error, refetch } = useQuery({
    queryKey: ["penugasan"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: AssignmentRow[] }>("/assignments");
      return res.data;
    },
  });

  const { data: petugasList } = useQuery({
    queryKey: ["petugas"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: any[] }>("/users/petugas");
      return res.data;
    },
  });

  const { data: activities } = useQuery({
    queryKey: ["kegiatanList"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: any[] }>("/activities");
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    activityId: "",
    userId: "",
    contentTypeId: "",
    startTime: "",
    endTime: "",
    deadline: "",
  });

  const columns: TableColumn<AssignmentRow>[] = [
    { key: "activityTitle", label: "Kegiatan Terkait" },
    { 
      key: "activityDate", 
      label: "Tanggal", 
      render: (_, row) => row.activityDate ? new Date(row.activityDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-" 
    },
    { key: "contentType", label: "Output (Jenis Konten)", render: (val) => <span className="font-semibold text-gray-700">{val as string}</span> },
    { key: "picName", label: "PIC" },
    { key: "startTime", label: "Waktu", render: (_, row) => `${row.startTime?.substring(0,5) || "-"} s/d ${row.endTime?.substring(0,5) || "-"}` },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <Badge variant={val === "COMPLETED" ? "success" : val === "ASSIGNED" ? "warning" : "default"}>
          {val as string}
        </Badge>
      ),
    },
  ];

  const handleSimpan = async () => {
    try {
      // Adding seconds since backend requires HH:mm:ss for time fields
      const payload = {
        ...formData,
        startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      };

      const res = await fetch("/api/v1/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      
      if (res.status === 409) {
        setConflictWarning(json.error);
        return;
      }
      
      if (!res.ok) {
        alert("Gagal menyimpan penugasan");
        return;
      }

      setIsModalOpen(false);
      setConflictWarning(null);
      refetch();
      setFormData({ activityId: "", userId: "", contentTypeId: "", startTime: "", endTime: "", deadline: "" });
    } catch (e) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleForceSimpan = async () => {
      // For this MVP, if forced, maybe we hit an endpoint that bypasses conflict check.
      // But for now, we just close it since we don't have bypass implemented yet in backend MVP.
      alert("Peringatan diabaikan (Bypass belum diimplementasikan di purwarupa).");
      setIsModalOpen(false);
      setConflictWarning(null);
      setFormData({ activityId: "", userId: "", contentTypeId: "", startTime: "", endTime: "", deadline: "" });
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

      <Dialog open={isModalOpen} onClose={() => { setIsModalOpen(false); setConflictWarning(null); }} title="Buat Penugasan Baru">
        <div className="space-y-4 mt-4">
          {conflictWarning && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">⚠️ Peringatan: {conflictWarning}</p>
                <p className="text-xs text-amber-700 mt-1">Sistem mendeteksi jadwal ganda pada jam ini. Anda tetap dapat menyimpan tugas jika diperlukan.</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Pilih PIC (Pegawai)</label>
            <Select 
              options={(petugasList || []).map((p: any) => ({ value: p.id, label: `${p.name} (${p.staffType})` }))} 
              placeholder="Pilih PIC"
              className="mt-1"
              value={formData.userId}
              onChange={e => setFormData({ ...formData, userId: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Kegiatan Terkait</label>
            <Select 
              options={(activities || []).map((a: any) => ({ value: a.id, label: a.title || "Kegiatan Tanpa Judul" }))} 
              placeholder="Pilih Kegiatan"
              className="mt-1"
              value={formData.activityId}
              onChange={e => setFormData({ ...formData, activityId: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Jenis Konten (Output)</label>
            <Select 
              options={(contentTypes || []).map((ct: any) => ({ value: ct.id, label: ct.name }))} 
              placeholder="Pilih Output"
              className="mt-1"
              value={formData.contentTypeId}
              onChange={e => setFormData({ ...formData, contentTypeId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Jam Mulai</label>
              <Input type="time" className="mt-1" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jam Selesai</label>
              <Input type="time" className="mt-1" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Deadline Pengumpulan</label>
            <Input type="datetime-local" className="mt-1" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setConflictWarning(null); }}>Batal</Button>
            <Button variant={conflictWarning ? "warning" : "default"} onClick={conflictWarning ? handleForceSimpan : handleSimpan}>
              {conflictWarning ? "Tetap Simpan" : "Simpan Penugasan"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PenugasanPage;
