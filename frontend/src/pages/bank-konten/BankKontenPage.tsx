import { useState } from "react";
import { Folder, Image as ImageIcon, FileVideo, ExternalLink, ChevronRight, Search, LayoutGrid, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";

const NAVY = "#0f1f5c";

interface BankKontenFile {
  id: string;
  name: string;
  jenisKonten: "foto" | "video";
  workLink: string;
}

interface BankKontenFolder {
  id: string;
  title: string;
  tanggal: string;
  petugas: string;
  files: BankKontenFile[];
}

const BankKontenPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const { data: folders, isLoading, error, refetch } = useQuery({
    queryKey: ["bank-konten"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: BankKontenFolder[] }>("/productions/bank-konten");
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const allFolders = folders || [];
  const filteredFolders = allFolders.filter(
    (f) => f.title.toLowerCase().includes(searchTerm.toLowerCase()) || f.petugas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeFolderData = allFolders.find((f) => f.id === selectedFolder);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>
            Bank Konten
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gudang penyimpanan aset digital produksi SIMIKP.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari folder kegiatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 transition-all"
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {selectedFolder && activeFolderData && (
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setSelectedFolder(null)} className="text-gray-500 hover:text-gray-900 font-medium">
            Root
          </button>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="font-bold text-gray-900">{activeFolderData.title}</span>
        </div>
      )}

      {/* Content Area */}
      {!selectedFolder ? (
        /* FOLDER VIEW */
        filteredFolders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Folder size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada folder bank konten tersedia.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Folder fill="currentColor" size={24} className="opacity-80" />
                  </div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                    {folder.files.length} Item
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-700 transition-colors">
                  {folder.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {folder.tanggal} • Oleh {folder.petugas}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nama Folder (Kegiatan)</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Petugas</th>
                  <th className="px-6 py-4 text-center">Jumlah Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFolders.map((folder) => (
                  <tr
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                      <Folder size={18} className="text-blue-500 fill-blue-500" />
                      {folder.title}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{folder.tanggal}</td>
                    <td className="px-6 py-4 text-gray-600">{folder.petugas}</td>
                    <td className="px-6 py-4 text-center text-gray-900 font-bold">{folder.files.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* FILE VIEW (INSIDE FOLDER) */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">{activeFolderData?.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Daftar tautan luaran kerja untuk kegiatan ini.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFolderData?.files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.jenisKonten === "video" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
                  {file.jenisKonten === "video" ? <FileVideo size={20} /> : <ImageIcon size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 uppercase">{file.jenisKonten}</p>
                </div>
                <a
                  href={file.workLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors shrink-0"
                  title="Buka Link"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
            {activeFolderData?.files.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-500">
                Belum ada file di dalam folder ini.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankKontenPage;
