import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Settings,
  LogOut,
  Sparkles,
  BadgeCheck,
  FolderOpen,
  ClipboardList,
  Mail,
  User,
  KeyRound,
  FileCheck2,
  Globe,
  Camera,
  Pencil,
  Trash2,
  Upload,
  X,
  Phone,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";
import type { Language } from "../../lib/LanguageContext";
import logoKotaBatu from "../../assets/Logo_Kota_Batu.png";

const NAVY = "#0f1f5c";

const ROLE_LABELS_ID: Record<string, string> = {
  super_admin: "Super Admin",
  ahli_pertama: "Pranata Ahli Pertama",
  AHLI_PERTAMA: "Pranata Ahli Pertama",
  admin: "Administrator",
  manager: "Manajer / Pimpinan",
  staff: "Staff Operasional",
  reviewer: "Reviewer Konten",
  petugas: "Petugas Lapangan",
};

const ROLE_LABELS_EN: Record<string, string> = {
  super_admin: "Super Admin",
  ahli_pertama: "First Expert Officer",
  AHLI_PERTAMA: "First Expert Officer",
  admin: "Administrator",
  manager: "Manager / Executive",
  staff: "Operational Staff",
  reviewer: "Content Reviewer",
  petugas: "Field Officer",
};

const BIDANG_CONFIG_ID: Record<
  string,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  AHLI_PERTAMA: {
    label: "Pranata Komputer / Humas Ahli Pertama",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    desc: "Supervisi konten, telaah strategis naskah narasi publik, dan pengesahan akhir materi publikasi Diskominfo",
  },
  PRAHUM: {
    label: "Pranata Humas (PRAHUM)",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    desc: "Peliputan kegiatan pimpinan, penulisan siaran pers, dan komunikasi publik",
  },
  FOTOGRAFER: {
    label: "Fotografer",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Dokumentasi foto kegiatan dan highlight agenda",
  },
  VIDEOGRAFER: {
    label: "Videografer",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Dokumentasi video, liputan multimedia, dan highlight agenda",
  },
  DESAINER_EDITOR: {
    label: "Desainer & Editor",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    desc: "Perancangan grafis sosial media, infografis publik, dan materi publikasi",
  },
  // Nilai jabatan lama sebelum dipecah jadi Fotografer/Videografer.
  FOTO_VIDEO: {
    label: "Foto & Videografi",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Dokumentasi audio-visual, liputan multimedia, dan highlight agenda",
  },
};

const BIDANG_CONFIG_EN: Record<
  string,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  AHLI_PERTAMA: {
    label: "First Expert Computer / PR Officer",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    desc: "Content oversight, strategic public narrative review, and final endorsement of Diskominfo publications",
  },
  PRAHUM: {
    label: "Public Relations Officer (PRAHUM)",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    desc: "Executive coverage, press release drafting, and public communications",
  },
  FOTOGRAFER: {
    label: "Photographer",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Photo documentation and agenda highlights",
  },
  VIDEOGRAFER: {
    label: "Videographer",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Video documentation, multimedia coverage, and agenda highlights",
  },
  DESAINER_EDITOR: {
    label: "Designer & Editor",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    desc: "Social media graphics, public infographics, and publication assets",
  },
  // Legacy value from before the role was split into Photographer/Videographer.
  FOTO_VIDEO: {
    label: "Photo & Videography",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    desc: "Audio-visual documentation, multimedia coverage, and agenda highlights",
  },
};

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editUsername, setEditUsername] = useState(user?.username ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editNip, setEditNip] = useState(user?.nip ?? "");
  const [editBio, setEditBio] = useState(user?.bio ?? "");
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(user?.avatar ?? null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const isPetugas = user?.role?.toLowerCase() === "petugas";
  const userBidang = user?.staffType || (user as { bidang?: string })?.bidang;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  const roleKey = user?.role?.toLowerCase() ?? "";
  const roleLabelMap = language === "en" ? ROLE_LABELS_EN : ROLE_LABELS_ID;
  const roleLabel =
    roleLabelMap[roleKey] ??
    roleLabelMap[user?.role ?? ""] ??
    user?.role ??
    (language === "en" ? "Field Officer" : "Petugas Lapangan");

  const bidangMap = language === "en" ? BIDANG_CONFIG_EN : BIDANG_CONFIG_ID;
  const bidangData = userBidang ? bidangMap[userBidang] : null;

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    addToast(t("id_copied"), "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isPetugas ? "/petugas/dashboard" : "/dashboard");
    }
  };

  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast(
        language === "en" ? "Image size exceeds 5MB limit" : "Ukuran gambar melebihi batas 5MB",
        "warning"
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateUser({ avatar: base64 });
      setPreviewAvatar(base64);
      addToast(
        language === "en" ? "Profile photo updated successfully!" : "Foto profil berhasil diperbarui!",
        "success"
      );
    };
    reader.readAsDataURL(file);
  };

  const handleModalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast(
        language === "en" ? "Image size exceeds 5MB limit" : "Ukuran gambar melebihi batas 5MB",
        "warning"
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditModal = () => {
    setEditName(user?.name ?? "");
    setEditUsername(user?.username ?? "");
    setEditPhone(user?.phone ?? "");
    setEditNip(user?.nip ?? "");
    setEditBio(user?.bio ?? "");
    setPreviewAvatar(user?.avatar ?? null);
    setShowEditModal(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      addToast(language === "en" ? "Full name cannot be empty" : "Nama lengkap tidak boleh kosong", "warning");
      return;
    }

    updateUser({
      name: editName.trim(),
      username: editUsername.trim(),
      phone: editPhone.trim() || null,
      nip: editNip.trim() || null,
      bio: editBio.trim() || null,
      avatar: previewAvatar,
    });

    setShowEditModal(false);
    addToast(
      language === "en" ? "Profile and photo saved successfully!" : "Data profil & foto berhasil disimpan!",
      "success"
    );
  };

  const handleRemovePhoto = () => {
    setPreviewAvatar(null);
    updateUser({ avatar: null });
    addToast(
      language === "en" ? "Profile photo removed" : "Foto profil telah dihapus",
      "info"
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6 transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-top-1">
      {/* Hidden File Input for Direct Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDirectPhotoUpload}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {/* ── Top Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-[#0f1f5c] dark:hover:text-white transition px-3.5 py-2 rounded-xl bg-white dark:bg-[#161b22] border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer group self-start sm:self-auto"
        >
          <ArrowLeft
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            strokeWidth={2.2}
          />
          <span>{t("back_to_dashboard")}</span>
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#161b22] px-2.5 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-2xs">
            <Globe className="w-4 h-4 text-gray-400" />
            <select
              value={language}
              onChange={(e) => {
                const next = e.target.value as Language;
                setLanguage(next);
                addToast(next === "en" ? "Language switched to English" : "Bahasa diubah ke Bahasa Indonesia", "info");
              }}
              className="text-xs font-bold bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="id" className="dark:bg-[#161b22]">🇮🇩 ID</option>
              <option value="en" className="dark:bg-[#161b22]">🇬🇧 EN</option>
            </select>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t("system_active")}
          </span>
        </div>
      </div>

      {/* ── HERO BANNER: Premium Glassmorphism Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1647] via-[#0f1f5c] to-[#1e293b] text-white p-5 sm:p-8 shadow-xl border border-slate-700/50">
        {/* Subtle Background Elements */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <img
            src={logoKotaBatu}
            alt="Watermark"
            className="w-64 h-64 object-contain filter grayscale"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar with Interactive Photo Upload Overlay */}
          <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-amber-400 via-sky-300 to-indigo-400 p-1 shadow-2xl transition-transform group-hover/avatar:scale-105 duration-200">
              <div className="w-full h-full rounded-[14px] bg-[#0a1647] flex items-center justify-center text-white text-3xl font-extrabold tracking-wider shadow-inner overflow-hidden relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  initials
                )}

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 rounded-[14px] backdrop-blur-2xs">
                  <Camera className="w-5 h-5 text-sky-300" />
                  <span className="text-[10px] font-bold tracking-tight">
                    {language === "en" ? "Change Photo" : "Ganti Foto"}
                  </span>
                </div>
              </div>
            </div>

            {/* Online Status Badge */}
            <div
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-3 border-[#0a1647] flex items-center justify-center shadow-md z-10"
              title="Status: Online"
            >
              <BadgeCheck className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* User Details & Badges */}
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-sky-200 border border-white/15 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
                {roleLabel}
              </span>
              {bidangData && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 backdrop-blur-md text-emerald-200 border border-emerald-400/30 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  {bidangData.label}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.name ?? (language === "en" ? "Field Officer" : "Petugas Lapangan")}
              </h1>
              <p className="text-sm text-slate-300 flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.username ?? "-"}
              </p>
            </div>

            <p className="text-xs text-slate-300/90 max-w-xl leading-relaxed">
              {user?.bio ||
                bidangData?.desc ||
                (language === "en"
                  ? "Public information technical officer and public communications dissemination Diskominfo Batu City."
                  : "Petugas pelaksana teknis komunikasi dan diseminasi informasi publik Diskominfo Kota Batu.")}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-col gap-2.5 w-full md:w-auto mt-2 md:mt-0">
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 backdrop-blur-md border border-sky-400/30 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Pencil className="w-4 h-4" />
              <span>{language === "en" ? "Edit Profile & Photo" : "Edit Profil & Foto"}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(isPetugas ? "/petugas/pengaturan" : "/pengaturan")
              }
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Settings className="w-4 h-4" />
              <span>{t("settings")}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 backdrop-blur-md border border-rose-400/30 transition cursor-pointer shadow-xs active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3 Highlight Bento Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t("opd_instance")}
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {t("opd_name")}
            </p>
            <p className="text-[11px] text-gray-500">{t("pemkot_batu")}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t("task_sector")}
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {userBidang ? (language === "en" ? BIDANG_CONFIG_EN[userBidang]?.label : BIDANG_CONFIG_ID[userBidang]?.label) : "Operational"}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold">
              {t("production_line_active")}
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t("operational_area")}
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {t("batu_city_jt")}
            </p>
            <p className="text-[11px] text-gray-500">{t("among_tani")}</p>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Data Akun & Identitas Lengkap */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0f1f5c] text-white flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {t("officer_info")}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t("officer_info_desc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Row: Nama Lengkap */}
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {t("full_name")}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {user?.name ?? "-"}
                </span>
              </div>

              {/* Row: Username / Email */}
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {t("username_email")}
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {user?.username ?? "-"}
                </span>
              </div>

              {/* Row: Nomor Telepon */}
              {user?.phone && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {language === "en" ? "Phone Number" : "Nomor Telepon"}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {user.phone}
                  </span>
                </div>
              )}

              {/* Row: NIP */}
              {user?.nip && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    NIP / ID Pegawai
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {user.nip}
                  </span>
                </div>
              )}

              {/* Row: Role */}
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {t("system_role")}
                </span>
                <span
                  className="font-bold px-3 py-1 rounded-full text-xs"
                  style={{ backgroundColor: `${NAVY}15`, color: NAVY }}
                >
                  {roleLabel}
                </span>
              </div>

              {/* Row: Sektor Bidang */}
              {userBidang && (
                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {t("field_sector")}
                  </span>
                  <span className="font-bold px-3 py-1 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {bidangData?.label ?? userBidang}
                  </span>
                </div>
              )}

              {/* Row: ID Pengguna with Copy */}
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {t("user_id")}
                </span>
                <div className="flex items-center gap-2">
                  <code className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                    {user?.id ? user.id.slice(0, 16) + "..." : "-"}
                  </code>
                  {user?.id && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition cursor-pointer"
                      title={t("copy_id")}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instansi Info Box */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={logoKotaBatu}
                alt="Logo Kota Batu"
                className="w-10 h-10 object-contain"
              />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {language === "en" ? "Department of Communication and Information (Diskominfo)" : "Dinas Komunikasi dan Informatika (Diskominfo)"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {t("pemkot_batu")} • SIMIKP v1.0
                </p>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
              {t("official_team_notice")}
            </p>
          </div>
        </div>

        {/* Right Column (5 cols): Akses Cepat & Operasional */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {t("quick_access_officer")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("quick_access_desc")}
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Shortcut 1 */}
              <button
                type="button"
                onClick={() =>
                  navigate(isPetugas ? "/petugas/penugasan" : "/penugasan")
                }
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#0f1f5c] hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0f1f5c] transition">
                      {t("my_assignments")}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {t("view_update_task")}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#0f1f5c] transition" />
              </button>

              {/* Shortcut 2 */}
              <button
                type="button"
                onClick={() =>
                  navigate(isPetugas ? "/petugas/bank-konten" : "/bank-konten")
                }
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#0f1f5c] hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0f1f5c] transition">
                      {t("content_bank")}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {t("content_archive_desc")}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#0f1f5c] transition" />
              </button>

              {/* Shortcut 3 */}
              <button
                type="button"
                onClick={() =>
                  navigate(isPetugas ? "/petugas/pengaturan" : "/pengaturan")
                }
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {t("account_security")}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {t("session_prefs_desc")}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Logout Action Box */}
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                {t("user_session")}
              </p>
            </div>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
              {t("save_work_before_logout")}
            </p>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer active:scale-98"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Edit Profil & Foto ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#161b22] rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0f1f5c] dark:text-sky-400 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {language === "en" ? "Edit Profile & Photo" : "Edit Data & Foto Profil"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === "en" ? "Update your personal details and photo" : "Perbarui informasi identitas & foto Anda"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden File Input for Modal */}
            <input
              type="file"
              ref={modalFileInputRef}
              onChange={handleModalPhotoUpload}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Management Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                <div className="relative group/modalphoto cursor-pointer" onClick={() => modalFileInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-2xl bg-[#0a1647] flex items-center justify-center text-white text-2xl font-black shadow-md overflow-hidden border-2 border-sky-400/40">
                    {previewAvatar ? (
                      <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/modalphoto:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white">
                    <Camera className="w-5 h-5 text-sky-300" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {language === "en" ? "Profile Photo" : "Foto Profil"}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Format JPG, PNG, WEBP (Maks. 5MB)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0f1f5c] hover:bg-[#162a7a] text-white shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{language === "en" ? "Upload Photo" : "Pilih Foto"}</span>
                    </button>
                    {previewAvatar && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === "en" ? "Remove" : "Hapus Foto"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Input: Nama Lengkap */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t("full_name")} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="Nama Lengkap"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Form Input: Username / Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t("username_email")}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username@diskominfo.go.id"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Grid: Telepon & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    {language === "en" ? "Phone Number" : "Nomor WhatsApp / HP"}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    NIP / ID Pegawai
                  </label>
                  <input
                    type="text"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    placeholder="1990xxxx xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Form Input: Bio / Catatan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {language === "en" ? "Short Bio / Note" : "Bio Singkat / Catatan Petugas"}
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "Describe your duties and specializations..."
                      : "Jelaskan tugas dan spesialisasi liputan Anda..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-[#0f1f5c] hover:bg-[#162a7a] text-white transition cursor-pointer shadow-xs"
                >
                  {t("save_changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl max-w-sm w-full p-6 space-y-4 border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t("logout_confirm_title")}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("logout_confirm_desc")}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                  navigate("/login", { replace: true, state: {} });
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
              >
                {t("yes_logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
