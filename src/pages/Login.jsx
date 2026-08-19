import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import logoBatu from '../assets/logo-kota-batu.png';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bidangChoice, setBidangChoice] = useState('PRAHUM');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin({
        name: username,
        role: 'PETUGAS',
        bidang: bidangChoice
      });
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        {/* LOGO & INSTANSI */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src={logoBatu} alt="Logo Kota Batu" style={styles.logoHeader} />
          <h2 style={{ color: '#0f172a', margin: '10px 0 2px 0', fontSize: '20px', fontWeight: 'bold' }}>SIMIKP PETUGAS</h2>
          <p style={{ color: '#0284c7', fontSize: '12px', margin: '0 0 8px 0', fontWeight: '600', letterSpacing: '0.5px' }}>
            DISKOMINFO KOTA BATU
          </p>
          <span style={{ color: '#64748b', fontSize: '12px' }}>Silakan login untuk mengelola penugasan lapangan</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.label}>Username / NIP</label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Masukkan username atau NIP..."
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Kata Sandi</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Pilih Sektor / Bidang Kerja:</label>
            <select 
              value={bidangChoice} 
              onChange={(e) => setBidangChoice(e.target.value)} 
              style={styles.select}
            >
              <option value="PRAHUM">PRAHUM (Liputan & Penulisan)</option>
              <option value="FOTO_VIDEO">FOTO & VIDEO (Dokumentasi)</option>
              <option value="DESAINER_EDITOR">DESAINER & EDITOR (Desain/Revisi)</option>
            </select>
          </div>

          <button type="submit" style={styles.btnPrimary}>
            <LogIn size={16} /> Masuk Sistem
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  loginContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  loginCard: { background: '#ffffff', padding: '36px', borderRadius: '16px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)', border: '1px solid #e2e8f0' },
  logoHeader: { height: '64px', width: 'auto', marginBottom: '4px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' },
  select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' },
  btnPrimary: { background: '#0284c7', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }
};