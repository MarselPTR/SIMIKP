import { NavLink } from "react-router-dom";
import logoKotaBatu from "../assets/Logo_Kota_Batu.png";

const petugasMenuItems = [
  { path: "/petugas/dashboard", label: "Dashboard" },
  { path: "/petugas/penugasan", label: "Penugasan Saya" },
  { path: "/petugas/bank-konten", label: "Bank Konten" },
];

const NAVY = "#0f1f5c";

const PetugasSidebar = () => (
  <aside className="fixed left-0 top-0 z-40 h-full w-64 flex flex-col border-r border-gray-200 bg-white">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-10 h-10 object-contain" />
      <div className="leading-tight">
        <p className="text-sm font-bold" style={{ color: NAVY }}>
          SIMIKP
        </p>
        <p className="text-sm font-bold" style={{ color: NAVY }}>
          Petugas Lapangan
        </p>
      </div>
    </div>

    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
      {petugasMenuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
              isActive
                ? "font-semibold text-white bg-[#0f1f5c] shadow-xs"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="h-4" />
  </aside>
);

export default PetugasSidebar;
