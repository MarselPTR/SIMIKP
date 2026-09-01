import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Mail, Shield, User, Filter, ShieldCheck, Camera, Video, Edit3, Image as ImageIcon, X, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api-client";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";

const PROGRAM_LABELS_ID: Record<string, string> = {
  FOTOGRAFER: "Fotografer",
  VIDEOGRAFER: "Videografer",
  DESAINER_EDITOR: "Desainer & Editor",
  REPORTER: "Reporter",
  KONTRIBUTOR: "Kontributor",
  ADMIN: "Admin",
};

const PROGRAM_LABELS_EN: Record<string, string> = {
  FOTOGRAFER: "Photographer",
  VIDEOGRAFER: "Videographer",
  DESAINER_EDITOR: "Designer & Editor",
  REPORTER: "Reporter",
  KONTRIBUTOR: "Contributor",
  ADMIN: "Admin",
};

const PROGRAM_ICONS: Record<string, any> = {
  FOTOGRAFER: Camera,
  VIDEOGRAFER: Video,
  DESAINER_EDITOR: ImageIcon,
  REPORTER: Edit3,
  KONTRIBUTOR: User,
  ADMIN: ShieldCheck,
};

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

export default function DaftarAnggotaPage() {
  const [anggota, setAnggota] = useState<Petugas[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { t, language } = useLanguage();

  const programLabels = language === "en" ? PROGRAM_LABELS_EN : PROGRAM_LABELS_ID;

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
      addToast(err.message || (language === "en" ? "Failed to delete officer" : "Gagal menghapus petugas"), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAnggota = anggota.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nik && p.nik.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === "ALL" || p.staffType === filterType;
    return matchSearch && matchType;
  });

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
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400 mb-1">{t("member_title")}</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("member_subtitle")}</p>
        </div>
        <Link
          to="/tambah-petugas"
          className="inline-flex items-center gap-2 bg-[#0f1f5c] dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          {t("member_add_btn")}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t("member_search_ph")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]/20 dark:focus:ring-sky-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]/20 dark:focus:ring-sky-500/20 bg-white dark:bg-[#161b22] text-gray-800 dark:text-gray-200 font-bold cursor-pointer"
          >
            <option value="ALL">{t("member_filter_all_roles")}</option>
            <option value="FOTOGRAFER">{programLabels.FOTOGRAFER}</option>
            <option value="VIDEOGRAFER">{programLabels.VIDEOGRAFER}</option>
            <option value="DESAINER_EDITOR">{programLabels.DESAINER_EDITOR}</option>
            <option value="REPORTER">{programLabels.REPORTER}</option>
            <option value="KONTRIBUTOR">{programLabels.KONTRIBUTOR}</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#0f1f5c] dark:border-t-sky-400"></div>
        </div>
      ) : filteredAnggota.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 text-[#0f1f5c] dark:text-sky-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">{t("member_empty")}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {language === "en" ? "No officers registered or matching your search criteria." : "Belum ada anggota yang terdaftar atau cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAnggota.map((petugas) => {
            const IconComponent = PROGRAM_ICONS[petugas.staffType] || User;
            const imageUrl = getProfileImageUrl(petugas.pasFotoUrl);

            return (
              <div
                key={petugas.id}
                className="bg-white dark:bg-[#161b22] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Profile Info */}
                <div className="p-6 flex-1 flex flex-col items-center text-center relative">
                  <button
                    onClick={() => openDeleteModal(petugas)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={t("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/60 shadow-xs overflow-hidden mb-4 border-2 border-white dark:border-gray-800">
                    {imageUrl ? (
                      <img src={imageUrl} alt={petugas.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-black text-[#0f1f5c] dark:text-sky-300">
                        {getInitials(petugas.name)}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight mb-1 truncate w-full" title={petugas.name}>
                    {petugas.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#0f1f5c] dark:text-sky-300 rounded-lg mb-4 border border-blue-100 dark:border-blue-900/60">
                    <IconComponent className="w-3.5 h-3.5" />
                    {programLabels[petugas.staffType] || petugas.staffType}
                  </div>

                  <div className="w-full space-y-2.5 text-left text-xs mt-auto border-t border-gray-100 dark:border-gray-800 pt-4">
                    {petugas.nik && (
                      <div className="flex items-start gap-2.5 text-gray-600 dark:text-gray-400">
                        <Shield className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="truncate flex-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 leading-none mb-1">PIC</p>
                          <p className="truncate font-semibold text-gray-800 dark:text-gray-200">{petugas.nik}</p>
                        </div>
                      </div>
                    )}

                    {petugas.email && (
                      <div className="flex items-start gap-2.5 text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="truncate flex-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 leading-none mb-1">Email</p>
                          <p className="truncate font-semibold text-gray-800 dark:text-gray-200">{petugas.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${petugas.active ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {petugas.active ? (language === "en" ? "Active" : "Aktif") : (language === "en" ? "Inactive" : "Nonaktif")}
                    </span>
                  </div>
                  <button
                    onClick={() => openDetailModal(petugas)}
                    className="text-xs font-bold text-[#0f1f5c] dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {t("member_view_details")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{t("member_view_details")}</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/60 border-4 border-white dark:border-gray-800 shadow-sm overflow-hidden mb-3">
                  {getProfileImageUrl(selectedPetugas.pasFotoUrl) ? (
                    <img src={getProfileImageUrl(selectedPetugas.pasFotoUrl)!} alt={selectedPetugas.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[#0f1f5c] dark:text-sky-300">
                      {getInitials(selectedPetugas.name)}
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">{selectedPetugas.name}</h4>
                <p className="text-xs font-bold text-blue-600 dark:text-sky-400 mt-1">
                  {programLabels[selectedPetugas.staffType] || selectedPetugas.staffType}
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">PIC</span>
                  <span className="col-span-2 text-gray-800 dark:text-gray-200 font-semibold">{selectedPetugas.nik || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Email</span>
                  <span className="col-span-2 text-gray-800 dark:text-gray-200 font-semibold">{selectedPetugas.email || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{language === "en" ? "Gender" : "Jenis Kelamin"}</span>
                  <span className="col-span-2 text-gray-800 dark:text-gray-200 font-semibold">{selectedPetugas.gender || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t("status")}</span>
                  <span className="col-span-2 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedPetugas.active ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedPetugas.active ? (language === "en" ? "Active" : "Aktif") : (language === "en" ? "Inactive" : "Nonaktif")}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 bg-gray-100 dark:bg-gray-800 rounded-xl transition cursor-pointer"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center border border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {language === "en" ? "Delete Officer?" : "Hapus Petugas?"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {language === "en"
                ? `Are you sure you want to permanently delete officer ${selectedPetugas.name}? This action cannot be undone.`
                : `Anda yakin ingin menghapus petugas ${selectedPetugas.name} secara permanen? Tindakan ini tidak dapat dikembalikan.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl transition flex-1 cursor-pointer"
                disabled={isDeleting}
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 bg-rose-600 rounded-xl transition flex-1 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? t("saving") : language === "en" ? "Yes, Delete" : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
