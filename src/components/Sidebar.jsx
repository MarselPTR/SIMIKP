import React from 'react';
import { LayoutDashboard, ClipboardList, FolderArchive, User, LogOut } from 'lucide-react';
import logoBatu from '../assets/logo-kota-batu.png'; // Importing logo

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, setSelectedTask }) {
  const handleNav = (tab) => {
    setActiveTab(tab);
    if (setSelectedTask) setSelectedTask(null);
  };

  return (
    <aside style={styles.sidebar}>
      <div>
        {/* BRAND LOGO KOTA BATU */}
        <div style={styles.brandContainer}>
          <img src={logoBatu} alt="Logo Kota Batu" style={styles.logoImage} />
          <div>
            <h1 style={styles.brandTitle}>SIMIKP PETUGAS</h1>
            <p style={styles.brandSub}>Diskominfo Kota Batu</p>
          </div>
        </div>

        {/* NAVIGASI MENU */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button 
            onClick={() => handleNav('dashboard')}
            style={activeTab === 'dashboard' ? styles.navActive : styles.navBtn}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => handleNav('penugasan')}
            style={activeTab === 'penugasan' ? styles.navActive : styles.navBtn}
          >
            <ClipboardList size={18} /> Penugasan Saya
          </button>
          <button 
            onClick={() => handleNav('bank_konten')}
            style={activeTab === 'bank_konten' ? styles.navActive : styles.navBtn}
          >
            <FolderArchive size={18} /> Bank Konten
          </button>
        </nav>
      </div>

      {/* USER PROFILE BOX */}
      <div style={styles.profileBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.avatar}>
            <User size={16} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#ffffff' }}>{currentUser.name}</div>
            <div style={styles.badgeBidang}>{currentUser.bidang}</div>
          </div>
        </div>
        <button onClick={onLogout} style={styles.btnLogout} title="Keluar dari sistem">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: { width: '250px', background: '#0f172a', padding: '20px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh', boxSizing: 'border-box' },
  brandContainer: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px', marginBottom: '28px' },
  logoImage: { width: '38px', height: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' },
  brandTitle: { color: '#ffffff', fontSize: '15px', margin: 0, fontWeight: 'bold', letterSpacing: '0.5px' },
  brandSub: { color: '#38bdf8', fontSize: '11px', margin: 0, fontWeight: '500' },
  navBtn: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '500' },
  navActive: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: '600' },
  profileBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' },
  avatar: { background: '#0284c7', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badgeBidang: { fontSize: '10px', background: '#0f172a', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px', fontWeight: '600' },
  btnLogout: { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' },
};