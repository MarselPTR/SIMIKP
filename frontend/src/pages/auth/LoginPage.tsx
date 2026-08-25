import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { Role } from "../../lib/mock-data";
import logoKotaBatu from "../../assets/Logo_Kota_Batu.png";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error ?? "Login gagal");
      return;
    }
    const destination = result.user?.role === Role.PETUGAS ? "/petugas/dashboard" : "/dashboard";
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel – navy background ── */}
      <div
        className="hidden md:flex flex-col items-center justify-center flex-1 px-12"
        style={{ backgroundColor: "#0f1f5c" }}
      >
        <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-44 h-auto mb-8 drop-shadow-lg" />

        <h1 className="text-3xl font-bold text-white text-center leading-snug">SIMIKP Kota Batu</h1>
        <p className="mt-4 text-blue-200 text-center text-base leading-relaxed max-w-sm">
          Sistem Informasi Manajemen Informasi dan Komunikasi Publik
        </p>
      </div>

      {/* ── Right panel – white form ── */}
      <div className="w-full md:w-[420px] lg:w-[480px] flex flex-col justify-center px-10 py-16 bg-white">
        {/* Mobile: show logo on top */}
        <div className="flex md:hidden justify-center mb-8">
          <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-24 h-auto" />
        </div>

        <h2 className="text-3xl font-bold mb-1" style={{ color: "#1a2a6c" }}>
          Masuk
        </h2>
        <p className="text-gray-500 text-sm mb-8">Gunakan akun SIMIKP Kota Batu Anda</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username Anda (cth: admin)"
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a2a6c";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,42,108,0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none transition"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a2a6c";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,42,108,0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

          {/* Forgot password */}
          <div className="text-right -mt-2">
            <button type="button" className="text-sm font-medium hover:underline" style={{ color: "#1a2a6c" }}>
              Lupa password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#1a2a6c" }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
