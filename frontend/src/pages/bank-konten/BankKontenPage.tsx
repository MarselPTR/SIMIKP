import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import type { MockBankKontenFolder } from "../../lib/mock-data";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import { LoadingSpinner, ErrorState, EmptyState } from "../../components/shared/StateComponents";

const jenisKontenOptions = [
  { value: "video", label: "Video" },
  { value: "foto", label: "Foto" },
];

const urutanOptions = [
  { value: "terbaru", label: "Terbaru dulu" },
  { value: "terlama", label: "Terlama dulu" },
];

const VideoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.6A1 1 0 0121 8.27v7.46a1 1 0 01-1.45.87L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
  </svg>
);

const PhotoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
    <circle cx="8" cy="9" r="1.5" />
  </svg>
);

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const summarizeJenis = (folder: MockBankKontenFolder) => {
  const jumlahFoto = folder.files.filter((f) => f.jenisKonten === "foto").length;
  const jumlahVideo = folder.files.filter((f) => f.jenisKonten === "video").length;
  const parts: string[] = [];
  if (jumlahVideo > 0) parts.push(`${jumlahVideo} Video`);
  if (jumlahFoto > 0) parts.push(`${jumlahFoto} Foto`);
  return { label: parts.join(" · "), jumlahFoto, jumlahVideo, mixed: jumlahFoto > 0 && jumlahVideo > 0 };
};

const BankKontenPage = () => {
  const { data: folders, isLoading, error, refetch } = useQuery({
    queryKey: ["bankKonten"],
    queryFn: mockApi.bankKonten.getAll,
  });

  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState("");
  const [urutan, setUrutan] = useState("terbaru");
  const [selectedFolder, setSelectedFolder] = useState<MockBankKontenFolder | null>(null);
  const [dialogJenisKonten, setDialogJenisKonten] = useState("");

  const openFolder = (folder: MockBankKontenFolder) => {
    setSelectedFolder(folder);
    setDialogJenisKonten("");
  };

  const tahunOptions = useMemo(() => {
    if (!folders) return [];
    const years = new Set(folders.map((f) => new Date(f.tanggal).getFullYear()));
    return [...years]
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: String(y) }));
  }, [folders]);

  const filtered = useMemo(() => {
    if (!folders) return [];
    let result = folders;
    if (search) {
      result = result.filter((f) => f.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (tahun) {
      result = result.filter((f) => String(new Date(f.tanggal).getFullYear()) === tahun);
    }
    result = [...result].sort((a, b) =>
      urutan === "terbaru"
        ? new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        : new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );
    return result;
  }, [folders, search, tahun, urutan]);

  const dialogFiles = useMemo(() => {
    if (!selectedFolder) return [];
    if (!dialogJenisKonten) return selectedFolder.files;
    return selectedFolder.files.filter((f) => f.jenisKonten === dialogJenisKonten);
  }, [selectedFolder, dialogJenisKonten]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bank Konten</h2>
          <p className="text-sm text-gray-500">Arsip hasil produksi per kegiatan</p>
        </div>
        <Button variant="outline">📤 Upload</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Cari kegiatan, lokasi, tokoh, keyword"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px]"
        />
        <div className="w-32 flex-shrink-0">
          <Select
            options={tahunOptions}
            placeholder="Tahun"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
          />
        </div>
        <div className="w-44 flex-shrink-0">
          <Select options={urutanOptions} value={urutan} onChange={(e) => setUrutan(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada konten" description="Tidak ada kegiatan yang cocok dengan pencarian." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((folder) => {
            const summary = summarizeJenis(folder);
            return (
              <button
                key={folder.id}
                onClick={() => openFolder(folder)}
                className="text-left bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition"
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 gap-2">
                  {summary.mixed ? (
                    <>
                      <VideoIcon className="w-7 h-7" />
                      <PhotoIcon className="w-7 h-7" />
                    </>
                  ) : summary.jumlahVideo > 0 ? (
                    <VideoIcon />
                  ) : (
                    <PhotoIcon />
                  )}
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{folder.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTanggal(folder.tanggal)} · {summary.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Petugas: {folder.petugas}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={selectedFolder !== null}
        onClose={() => setSelectedFolder(null)}
        title={selectedFolder?.title}
        size="lg"
      >
        {selectedFolder && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {formatTanggal(selectedFolder.tanggal)} · Petugas: {selectedFolder.petugas}
              </p>
              <div className="w-40 flex-shrink-0">
                <Select
                  options={jenisKontenOptions}
                  placeholder="Semua jenis"
                  value={dialogJenisKonten}
                  onChange={(e) => setDialogJenisKonten(e.target.value)}
                />
              </div>
            </div>
            {dialogFiles.length === 0 ? (
              <EmptyState title="Tidak ada file" description="Tidak ada file dengan jenis konten ini." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dialogFiles.map((file) => (
                  <div key={file.id} className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="h-20 bg-gray-100 flex items-center justify-center text-gray-400">
                      {file.jenisKonten === "video" ? <VideoIcon /> : <PhotoIcon />}
                    </div>
                    <p className="px-2 py-1.5 text-xs text-gray-600 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default BankKontenPage;
