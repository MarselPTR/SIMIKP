import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Mail, Shield, User, Filter, ShieldCheck, Camera, Edit3, Image as ImageIcon, X, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api-client";
import { useToast } from "../../contexts/ToastContext";


interface Petugas {
  id: string;
  name: string;
  staffType: string;
  email: string | null;
  nik: string | null;
  gender: string | null;
  pasFotoUrl: string | null;
  active: boolean;
}

// Keys must match the values TambahPetugasPage sends as `program` / users.staff_type
const PROGRAM_LABELS: Record<string, string> = {
  FOTO_VIDEO: "Foto & Video",
  PRAHUM: "Pranata Humas (Berita)",
  DESAINER_EDITOR: "Desainer & Editor",
  ADMIN: "Admin",
};

const PROGRAM_ICONS: Record<string, any> = {
  FOTO_VIDEO: Camera,
  PRAHUM: Edit3,
  DESAINER_EDITOR: ImageIcon,
  ADMIN: ShieldCheck,
};

export default function DaftarAnggotaPage() {
  const [anggota, setAnggota] = useState<Petugas[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const [selectedPetugas, setSelectedPetugas] = useState<Petugas | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAnggota();
  }, []);

  const fetchAnggota = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: Petugas[] }>("/users/petugas");
      if (res.success) {
        setAnggota(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (petugas: Petugas) => {
    setSelectedPetugas(petugas);
    setIsDetailModalOpen(true);
  };

  const openDeleteModal = (petugas: Petugas) => {
    setSelectedPetugas(petugas);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPetugas) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/users/petugas/${selectedPetugas.id}`, {
        method: "DELETE",
      });
      if (res.success) {
        addToast(res.message, "success");
        setAnggota((prev) => prev.filter((p) => p.id !== selectedPetugas.id));
        setIsDeleteModalOpen(false);
      }
    } catch (err: any) {
      addToast(err.message || "Gagal menghapus petugas", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter options synced to whatever jabatan actually exist in the data
  const jabatanOptions = [...new Set(anggota.map((p) => p.staffType).filter(Boolean))].sort();

  const filteredAnggota = anggota.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.nik && p.nik.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === "ALL" || p.staffType === filterType;
    return matchSearch && matchType;
  });

  // Calculate initials for fallback avatar
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getProfileImageUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:3000/${url}`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-[#0f1f5c] dark:text-sky-400">Daftar Anggota Tim</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola dan lihat daftar seluruh petugas lapangan SIMIKP</p>
        </div>
        <Link
          to="/tambah-petugas"
          className="inline-flex items-center gap-2 bg-[#0f1f5c] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Tambah Anggota Baru
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau PIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-[#161b22] shadow-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <option value="ALL">Semua Jabatan</option>
            {jabatanOptions.map((t) => (
              <option key={t} value={t}>
                {PROGRAM_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f1f5c]"></div>
        </div>
      ) : filteredAnggota.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 dark:bg-sky-500/10 text-[#0f1f5c] dark:text-sky-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Tidak ada anggota</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada anggota yang terdaftar atau cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredAnggota.map((petugas) => {
            const IconComponent = PROGRAM_ICONS[petugas.staffType] || User;
            const imageUrl = getProfileImageUrl(petugas.pasFotoUrl);

            return (
              <div 
                key={petugas.id} 
                className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col"
              >
                {/* Profile Info */}
                <div className="p-6 flex-1 flex flex-col items-center text-center relative">
                  <button 
                    onClick={() => openDeleteModal(petugas)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition"
                    title="Hapus Petugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800/80 border border-transparent dark:border-slate-700 shadow-sm overflow-hidden mb-4">
                    {imageUrl ? (
                      <img src={imageUrl} alt={petugas.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-50 dark:bg-sky-950/50 flex items-center justify-center text-xl font-bold text-[#0f1f5c] dark:text-sky-300">
                        {getInitials(petugas.name)}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight mb-1 truncate w-full" title={petugas.name}>
                    {petugas.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-blue-50 dark:bg-sky-950/50 text-blue-700 dark:text-sky-300 border border-blue-100 dark:border-sky-800/50 rounded-md mb-4">
                    <IconComponent className="w-3.5 h-3.5" />
                    {PROGRAM_LABELS[petugas.staffType] || petugas.staffType}
                  </div>
                  
                  <div className="w-full space-y-2.5 text-left text-sm mt-auto border-t border-gray-100 dark:border-gray-800 pt-4">
                    {petugas.nik && (
                      <div className="flex items-start gap-2.5 text-gray-600 dark:text-gray-300">
                        <Shield className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="truncate flex-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">PIC</p>
                          <p className="truncate font-medium">{petugas.nik}</p>
                        </div>
                      </div>
                    )}
                    
                    {petugas.email && (
                      <div className="flex items-start gap-2.5 text-gray-600 dark:text-gray-300">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="truncate flex-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Email</p>
                          <p className="truncate font-medium">{petugas.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Card Footer */}
                <div className="px-5 py-3 bg-gray-50 dark:bg-slate-900/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${petugas.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {petugas.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <button 
                    onClick={() => openDetailModal(petugas)}
                    className="text-xs font-medium text-[#0f1f5c] dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedPetugas && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="my-auto bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/60">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Detail Anggota</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white shadow-sm overflow-hidden mb-3">
                  {getProfileImageUrl(selectedPetugas.pasFotoUrl) ? (
                    <img src={getProfileImageUrl(selectedPetugas.pasFotoUrl)!} alt={selectedPetugas.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#0f1f5c] dark:text-sky-300">
                      {getInitials(selectedPetugas.name)}
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">{selectedPetugas.name}</h4>
                <p className="text-sm font-medium text-blue-600 mt-1">{PROGRAM_LABELS[selectedPetugas.staffType] || selectedPetugas.staffType}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PIC</span>
                  <span className="col-span-2 text-sm text-gray-800 dark:text-gray-200 font-medium">{selectedPetugas.nik || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</span>
                  <span className="col-span-2 text-sm text-gray-800 dark:text-gray-200">{selectedPetugas.email || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</span>
                  <span className="col-span-2 text-sm text-gray-800 dark:text-gray-200">{selectedPetugas.gender || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                  <span className="col-span-2 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedPetugas.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedPetugas.active ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-slate-900/60 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 bg-gray-100 dark:bg-slate-800 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedPetugas && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="my-auto bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Hapus Petugas?</h3>
            <p className="text-gray-500 mb-6">
              Anda yakin ingin menghapus petugas <strong>{selectedPetugas.name}</strong> secara permanen? Data yang telah dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition flex-1"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 bg-red-600 rounded-lg transition flex-1 disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
