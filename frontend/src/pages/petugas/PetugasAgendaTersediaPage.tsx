import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, MapPin, Calendar } from "lucide-react";
import { apiFetch, ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";
import Button from "../../components/ui/Button";
import { LoadingSpinner, EmptyState, ErrorState } from "../../components/shared/StateComponents";
import { staffTypeMatchesContentType } from "../../lib/petugas-store";

// Jenis konten yang dibutuhkan agenda == role yang bisa diambil petugas.
// Cocok dengan checklist "Output yang Dibutuhkan" di form Kegiatan.
const ROLE_LABELS_ID: Record<string, string> = {
  "Naskah Berita": "Prahum",
  Foto: "Fotografer",
  Video: "Videografer",
  Reels: "Videografer",
  Infografis: "Editor/Desainer",
  Audio: "Editor/Desainer",
};

const ROLE_LABELS_EN: Record<string, string> = {
  "Naskah Berita": "Public Relations",
  Foto: "Photographer",
  Video: "Videographer",
  Reels: "Videographer",
  Infografis: "Editor/Designer",
  Audio: "Editor/Designer",
};

interface Activity {
  id: string;
  title: string;
  deadline: string;
  lokasi?: string;
  outputDibutuhkan: string[];
}

export default function PetugasAgendaTersediaPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const roleLabels = language === "en" ? ROLE_LABELS_EN : ROLE_LABELS_ID;

  const { data: activities = [], isLoading: loadingActivities, error: activitiesError, refetch: refetchActivities } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: Activity[] }>("/activities");
      return res.data || [];
    },
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: any[] }>("/assignments");
      return res.data || [];
    },
  });

  const claimMutation = useMutation({
    mutationFn: (vars: { activityId: string; contentType: string }) =>
      apiFetch<{ success: boolean; message: string }>("/assignments/claim", {
        method: "POST",
        body: JSON.stringify(vars),
      }),
    onSuccess: (res) => {
      addToast(res.message || (language === "en" ? "Task claimed successfully" : "Berhasil mengambil tugas"), "success");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : (language === "en" ? "Failed to claim task" : "Gagal mengambil tugas"), "error");
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onSettled: () => setClaimingKey(null),
  });

  // Agenda + slot role yang belum ada assignment-nya, dan cocok jabatan petugas ini
  // (petugas tanpa jabatan tetap bebas pilih role apapun).
  const openAgenda = useMemo(() => {
    return activities
      .map((a) => {
        const openTypes = (a.outputDibutuhkan || []).filter(
          (ct) =>
            !assignments.some((x) => x.activityId === a.id && x.contentType === ct && x.status !== "UNASSIGNED") &&
            staffTypeMatchesContentType(user?.staffType, ct)
        );
        return { ...a, openTypes };
      })
      .filter((a) => a.openTypes.length > 0);
  }, [activities, assignments, user?.staffType]);

  const isLoading = loadingActivities || loadingAssignments;

  const handleClaim = (activityId: string, contentType: string) => {
    setClaimingKey(`${activityId}:${contentType}`);
    claimMutation.mutate({ activityId, contentType });
  };

  return (
    <div className="space-y-6 pb-10 min-h-screen animate-fade-in text-gray-900 dark:text-gray-100">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0a1647] dark:text-sky-400">
          {language === "en" ? "Available Agenda" : "Agenda Tersedia"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {language === "en"
            ? "Pick an open role on any agenda below."
            : "Pilih role yang masih kosong pada agenda di bawah ini."}
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner text={language === "en" ? "Loading..." : "Memuat..."} />
      ) : activitiesError ? (
        <ErrorState onRetry={() => refetchActivities()} />
      ) : openAgenda.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title={language === "en" ? "No open slots" : "Belum ada slot terbuka"}
          description={
            language === "en"
              ? "All agenda are fully staffed right now."
              : "Semua agenda sudah terisi penuh saat ini."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {openAgenda.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-5 shadow-xs"
            >
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{a.title}</h3>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {a.deadline}
                </span>
                {a.lokasi && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {a.lokasi}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {a.openTypes.map((ct) => {
                  const key = `${a.id}:${ct}`;
                  return (
                    <Button
                      key={ct}
                      size="sm"
                      variant="outline"
                      isLoading={claimingKey === key && claimMutation.isPending}
                      onClick={() => handleClaim(a.id, ct)}
                    >
                      <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                      {language === "en" ? "Take as " : "Ambil sebagai "}
                      {roleLabels[ct] || ct}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
