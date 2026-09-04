import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isProfilePage = location.pathname.endsWith("/profil");

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0d1117] overflow-x-hidden">
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col min-h-screen lg:ml-64 transition-all duration-300 ease-in-out">
        <div
          className={`transition-all duration-300 ease-in-out transform origin-top z-30 ${
            isProfilePage
              ? "h-0 max-h-0 opacity-0 pointer-events-none -translate-y-4 overflow-hidden"
              : "h-16 opacity-100 translate-y-0 overflow-visible"
          }`}
        >
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        </div>
        <main className={`flex-1 overflow-y-auto min-w-0 transition-all duration-300 ease-in-out ${isProfilePage ? "p-4 sm:p-6 md:p-8 pt-6 sm:pt-8 md:pt-8" : "p-4 md:p-6"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
