import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";
import { useToast } from "../../contexts/ToastContext";
import { ArrowLeft } from "lucide-react";
import logoKotaBatu from "../../assets/Logo_Kota_Batu.png";
import { useLanguage } from "../../lib/LanguageContext";

export default function TambahPetugasPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    program: "",
    namaLengkap: "",
    email: "",
    password: "",
    jenisKelamin: "",
    pic: "",
    tempatLahir: "",
    tanggalLahir: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [pasFoto, setPasFoto] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("program", form.program);
      formData.append("name", form.namaLengkap);
      formData.append("username", form.email);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("gender", form.jenisKelamin);
      formData.append("nik", form.pic);
      formData.append("birthPlace", form.tempatLahir);
      formData.append("birthDate", form.tanggalLahir);

      if (pasFoto) formData.append("pasFoto", pasFoto);

      const res = await apiFetch<{ success: boolean; message: string }>("/users/petugas", {
        method: "POST",
        body: formData,
      });

      if (res.success) {
        addToast(res.message, "success");
        setForm({
          program: "",
          namaLengkap: "",
          email: "",
          password: "",
          jenisKelamin: "",
          pic: "",
          tempatLahir: "",
          tanggalLahir: "",
        });
        setPasFoto(null);
      }
    } catch (err: any) {
      addToast(err.message || (language === "en" ? "Failed to add officer" : "Gagal menambahkan petugas"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
        {language === "en" ? "Back" : "Kembali"}
      </button>

      <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-8 mb-8">
          <img src={logoKotaBatu} alt="Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {language === "en" ? "Registration Form" : "Form Registrasi"}
            </h1>
            <h2 className="text-2xl font-bold mb-2 text-[#0f1f5c] dark:text-sky-400">
              {language === "en" ? "SIMIKP Field Officer" : "Petugas SIMIKP"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Diskominfo Pemerintah Kota Batu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row: Program */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              {language === "en" ? "Officer Category" : "Kategori Petugas"}{" "}
              <span className="text-gray-400 font-normal">({language === "en" ? "optional" : "opsional"})</span>
            </label>
            <div className="md:col-span-8">
              <select
                name="program"
                value={form.program}
                onChange={handleInputChange}
                className="w-full md:w-64 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1"
              >
                <option value="">{language === "en" ? "Not set" : "Belum ditentukan"}</option>
                <option value="PRAHUM">{language === "en" ? "Public Relations (News)" : "Pranata Humas (Berita)"}</option>
                <option value="FOTOGRAFER">{language === "en" ? "Photographer" : "Fotografer"}</option>
                <option value="VIDEOGRAFER">{language === "en" ? "Videographer" : "Videografer"}</option>
                <option value="DESAINER_EDITOR">{language === "en" ? "Designer & Editor" : "Desainer & Editor"}</option>
              </select>
            </div>
          </div>

          {/* Row: Pas Foto */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              {language === "en" ? "Upload Photo (3x4)" : "Masukkan Pas Foto 3x4"}
            </label>
            <div className="md:col-span-8 flex items-center gap-3">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded px-6 py-2 text-sm font-medium transition">
                {language === "en" ? "Select Image" : "Pilih Foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPasFoto(e.target.files?.[0] || null)}
                />
              </label>
              <span className="text-xs text-gray-500 truncate max-w-xs">
                {pasFoto ? pasFoto.name : language === "en" ? "No file chosen" : "Tidak ada file dipilih"}
              </span>
            </div>
          </div>

          {/* Row: Password */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-8 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Row: Email */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              {language === "en" ? "Email Address" : "Alamat Email"} <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          {/* Row: Nama Lengkap */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              {language === "en" ? "Full Name" : "Nama Lengkap"} <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                name="namaLengkap"
                value={form.namaLengkap}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          {/* Row: Jenis Kelamin */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              {language === "en" ? "Gender" : "Jenis Kelamin"} <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-8 flex items-center gap-8">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="Laki - Laki"
                  checked={form.jenisKelamin === "Laki - Laki"}
                  onChange={handleInputChange}
                  required
                  className="w-4 h-4 text-blue-600"
                />
                {language === "en" ? "Male" : "Laki - Laki"}
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="Perempuan"
                  checked={form.jenisKelamin === "Perempuan"}
                  onChange={handleInputChange}
                  required
                  className="w-4 h-4 text-blue-600"
                />
                {language === "en" ? "Female" : "Perempuan"}
              </label>
            </div>
          </div>

          {/* Row: PIC */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              Person In Charge (PIC) <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                name="pic"
                value={form.pic}
                onChange={handleInputChange}
                required
                placeholder={language === "en" ? "Enter PIC identifier" : "Masukkan PIC"}
                className="w-full md:w-80 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          {/* Row: Tempat Lahir */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              {language === "en" ? "Place of Birth" : "Tempat Lahir"} <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                name="tempatLahir"
                value={form.tempatLahir}
                onChange={handleInputChange}
                required
                className="w-full md:w-64 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          {/* Row: Tanggal Lahir */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
            <label className="md:col-span-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              {language === "en" ? "Date of Birth" : "Tanggal Lahir"} <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="date"
                name="tanggalLahir"
                value={form.tanggalLahir}
                onChange={handleInputChange}
                required
                className="w-full md:w-64 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#0f1f5c] hover:bg-blue-900 text-white px-8 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? t("saving") : language === "en" ? "Register Officer" : "Daftarkan Petugas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
