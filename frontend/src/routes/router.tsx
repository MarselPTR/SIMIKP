import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import KegiatanPage from "../pages/kegiatan/KegiatanPage";
import PenugasanPage from "../pages/penugasan/PenugasanPage";
import ProduksiPage from "../pages/produksi/ProduksiPage";
import ReviewPage from "../pages/produksi/ReviewPage";
import PublikasiPage from "../pages/produksi/PublikasiPage";
import BankKontenPage from "../pages/bank-konten/BankKontenPage";
import LaporanPage from "../pages/laporan/LaporanPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "kegiatan", element: <KegiatanPage /> },
          { path: "penugasan", element: <PenugasanPage /> },
          { path: "produksi", element: <ProduksiPage /> },
          { path: "review", element: <ReviewPage /> },
          { path: "publikasi", element: <PublikasiPage /> },
          { path: "bank-konten", element: <BankKontenPage /> },
          { path: "laporan", element: <LaporanPage /> },
        ],
      },
    ],
  },
]);
