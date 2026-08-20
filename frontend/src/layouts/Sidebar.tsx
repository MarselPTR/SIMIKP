import { NavLink } from "react-router-dom";
import logoKotaBatu from "../assets/Logo_Kota_Batu.png";

interface MenuItem {
  path: string;
  label: string;
  group: string | null;
}

export const menuItems: MenuItem[] = [
  { path: "/dashboard", label: "Dashboard", group: null },
  { path: "/kegiatan", label: "Kegiatan", group: null },
  { path: "/penugasan", label: "Penugasan", group: "MANAJEMEN" },
  { path: "/produksi", label: "Produksi", group: "MANAJEMEN" },
  { path: "/publikasi", label: "Publikasi", group: "KONTEN" },
  { path: "/bank-konten", label: "Bank Konten", group: "KONTEN" },
  { path: "/laporan", label: "Laporan", group: "KONTEN" },
];

const NAVY = "#0f1f5c";

const Sidebar = () => {
  const groups: string[] = [];
  const seen = new Set<string>();

  menuItems.forEach((item) => {
    const g = item.group ?? "__top__";
    if (!seen.has(g)) {
      seen.add(g);
      groups.push(g);
    }
  });

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-64 flex flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-10 h-10 object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-bold" style={{ color: NAVY }}>
            SIMIKP
          </p>
          <p className="text-sm font-bold" style={{ color: NAVY }}>
            Kota Batu
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {groups.map((group) => {
          const items = menuItems.filter((i) => (i.group ?? "__top__") === group);
          return (
            <div key={group}>
              {group !== "__top__" && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                  {group}
                </p>
              )}
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                      isActive ? "font-semibold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                  style={({ isActive }) => (isActive ? { backgroundColor: `${NAVY}15`, color: NAVY } : {})}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ backgroundColor: NAVY }}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom spacer so nav doesn't get cut off */}
      <div className="h-4" />
    </aside>
  );
};

export default Sidebar;
