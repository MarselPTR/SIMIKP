import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";
import logoKotaBatu from "../../assets/Logo_Kota_Batu.png";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  ShieldCheck
} from "lucide-react";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userName, setUserName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("Tautan reset kata sandi tidak lengkap atau tidak valid.");
      return;
    }

    const checkToken = async () => {
      try {
        const res = await apiFetch<{ success: boolean; valid: boolean; userName?: string; message?: string }>(
          `/auth/verify-reset-token?token=${encodeURIComponent(token)}`
        );
        if (res.valid) {
          setTokenValid(true);
          setUserName(res.userName || "Pegawai");
        } else {
          setTokenValid(false);
          setTokenError(res.message || "Tautan reset kata sandi tidak valid atau telah kedaluwarsa.");
        }
      } catch (err: any) {
        setTokenValid(false);
        setTokenError(err.message || "Tautan reset kata sandi tidak valid atau telah kedaluwarsa.");
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 6) {
      setFormError("Kata sandi baru minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<{ success: boolean; message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setFormError(err.message || "Gagal memperbarui kata sandi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex relative bg-gray-50 dark:bg-[#0d1117]">
      {/* ── Left panel – centered logo with modern navy gradient & watermark ── */}
      <div
        className="hidden md:flex flex-col items-center justify-center flex-1 px-12 relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(135deg, #091338 0%, #0f1f5c 50%, #173282 100%)",
        }}
      >
        {/* Subtle decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Large watermark logo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5"
          aria-hidden="true"
        >
          <img
            src={logoKotaBatu}
            alt=""
            className="w-[520px] h-[520px] object-contain filter grayscale"
          />
        </div>

        {/* Centered content block */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl transform scale-110" />
            <div className="relative bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
              <img
                src={logoKotaBatu}
                alt="Logo Pemerintah Kota Batu"
                className="w-24 h-24 object-contain drop-shadow-md"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider uppercase text-blue-200 mb-3">
            Pemerintah Kota Batu
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            SIMIKP
          </h1>

          <p className="text-xs text-blue-200/80 uppercase tracking-widest font-semibold mb-4">
            Diskominfo Kota Batu
          </p>

          <p className="text-sm text-blue-100/70 leading-relaxed font-light">
            Sistem Informasi Manajemen Integrasi Komunikasi Publik
          </p>

          <div className="mt-8 flex items-center gap-2 text-xs text-blue-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pemulihan Akun Resmi & Terenkripsi</span>
          </div>
        </div>
      </div>

      {/* ── Right panel – Reset Password Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 lg:max-w-xl mx-auto w-full z-10">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Login</span>
          </Link>

          {/* Loading state */}
          {verifying && (
            <div className="py-16 text-center">
              <Loader2 className="w-10 h-10 text-[#0f1f5c] dark:text-sky-400 animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Memverifikasi tautan reset kata sandi...
              </p>
            </div>
          )}

          {/* Invalid or expired token */}
          {!verifying && !tokenValid && (
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-rose-950/40 text-red-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Tautan Tidak Berlaku
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {tokenError}
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-[#0f1f5c] hover:bg-[#0a1645] text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-md"
              >
                Minta Tautan Baru di Halaman Login
              </button>
            </div>
          )}

          {/* Success state */}
          {!verifying && tokenValid && success && (
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-xl text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Kata Sandi Berhasil Diperbarui!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Kata sandi baru akun Anda telah tersimpan dengan aman. Silakan masuk menggunakan kata sandi baru Anda.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-[#0f1f5c] hover:bg-[#0a1645] text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-md"
              >
                Masuk Sekarang
              </button>
            </div>
          )}

          {/* Reset password form */}
          {!verifying && tokenValid && !success && (
            <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-sky-300 mb-2">
                  Atur Ulang Sandi
                </span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Buat Kata Sandi Baru
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed">
                  Halo <strong className="text-gray-800 dark:text-gray-200">{userName}</strong>, masukkan kata sandi baru yang kuat untuk akun SIMIKP Anda.
                </p>
              </div>

              {formError && (
                <div className="mb-5 p-3.5 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Kata Sandi Baru */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-11 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-11 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full py-3 bg-[#0f1f5c] hover:bg-[#0a1645] text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Kata Sandi...</span>
                    </>
                  ) : (
                    <span>Simpan Kata Sandi Baru</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
