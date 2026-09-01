import { useState } from "react";
import { Outlet } from "react-router-dom";
import PetugasSidebar from "./PetugasSidebar";
import Topbar from "./Topbar";

const PetugasLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 transition-colors">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <PetugasSidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 min-w-0 bg-gray-50 dark:bg-[#0d1117]">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-gray-50 dark:bg-[#0d1117]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PetugasLayout;
