import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import HomeRedirect from "./HomeRedirect";
import AppLayout from "../layouts/AppLayout";
import PetugasLayout from "../layouts/PetugasLayout";
import LoginPage from "../pages/auth/LoginPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import KegiatanPage from "../pages/kegiatan/KegiatanPage";
import PenugasanPage from "../pages/penugasan/PenugasanPage";
import ProduksiPage from "../pages/produksi/ProduksiPage";
import ReviewPage from "../pages/produksi/ReviewPage";
import PublikasiPage from "../pages/produksi/PublikasiPage";
import BankKontenPage from "../pages/bank-konten/BankKontenPage";
import LaporanPage from "../pages/laporan/LaporanPage";
import TambahPetugasPage from "../pages/petugas/TambahPetugasPage";
import DaftarAnggotaPage from "../pages/petugas/DaftarAnggotaPage";
import PetugasDashboardPage from "../pages/petugas/PetugasDashboardPage";
import PetugasPenugasanPage from "../pages/petugas/PetugasPenugasanPage";
import PetugasAgendaTersediaPage from "../pages/petugas/PetugasAgendaTersediaPage";
import ProfilPage from "../pages/profil/ProfilPage";
import PengaturanPage from "../pages/pengaturan/PengaturanPage";
import { Role } from "../lib/mock-data";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <HomeRedirect /> },

      {
        element: <RoleRoute allow={[Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF, Role.REVIEWER]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "dashboard", element: <DashboardPage /> },
              { path: "kegiatan", element: <KegiatanPage /> },
              { path: "penugasan", element: <PenugasanPage /> },
              { path: "produksi", element: <ProduksiPage /> },
              { path: "review", element: <ReviewPage /> },
              { path: "publikasi", element: <PublikasiPage /> },
              { path: "bank-konten", element: <BankKontenPage /> },
              { path: "laporan", element: <LaporanPage /> },
              { path: "daftar-anggota", element: <DaftarAnggotaPage /> },
              { path: "tambah-petugas", element: <TambahPetugasPage /> },
              { path: "profil", element: <ProfilPage /> },
              { path: "pengaturan", element: <PengaturanPage /> },
            ],
          },
        ],
      },

      // Area petugas lapangan — login sama (satu port), tapi dashboard & menu terpisah.
      {
        element: <RoleRoute allow={[Role.PETUGAS]} />,
        children: [
          {
            element: <PetugasLayout />,
            children: [
              { path: "petugas", element: <Navigate to="/petugas/dashboard" replace /> },
              { path: "petugas/dashboard", element: <PetugasDashboardPage /> },
              { path: "petugas/agenda-tersedia", element: <PetugasAgendaTersediaPage /> },
              { path: "petugas/penugasan", element: <PetugasPenugasanPage /> },
              { path: "petugas/bank-konten", element: <BankKontenPage /> },
              { path: "petugas/profil", element: <ProfilPage /> },
              { path: "petugas/pengaturan", element: <PengaturanPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
