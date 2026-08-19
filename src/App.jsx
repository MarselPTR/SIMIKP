import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

import Sidebar from './components/layout/Sidebar';
import Topbar  from './components/layout/Topbar';
import { LoadingSpinner } from './components/shared/StateComponents';

import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KegiatanPage  from './pages/KegiatanPage';
import PenugasanPage from './pages/PenugasanPage';
import ProduksiPage  from './pages/ProduksiPage';
import ReviewPage    from './pages/ReviewPage';
import PublikasiPage from './pages/PublikasiPage';
import BankKontenPage from './pages/BankKontenPage';
import LaporanPage   from './pages/LaporanPage';

// ── Query client ──────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ── Inner app (needs AuthContext) ─────────────────────────────
const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = (path) => {
    setCurrentPath(path);
    setMobileMenuOpen(false);
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard':   return <DashboardPage />;
      case '/kegiatan':    return <KegiatanPage />;
      case '/penugasan':   return <PenugasanPage />;
      case '/produksi':    return <ProduksiPage />;
      case '/review':      return <ReviewPage />;
      case '/publikasi':   return <PublikasiPage />;
      case '/bank-konten': return <BankKontenPage />;
      case '/laporan':     return <LaporanPage />;
      default:             return <DashboardPage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          currentPath={currentPath}
          onNavigate={navigate}
        />
      </div>

      {/* Main content — always offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Topbar
          onMenuClick={() => setMobileMenuOpen(true)}
          user={user}
        />
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

// ── Root app ──────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;
