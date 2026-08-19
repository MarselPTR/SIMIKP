import React, { useState } from 'react';
import { Search, ExternalLink, FileText, Image, Film } from 'lucide-react';

export default function BankKonten() {
  const [searchQuery, setSearchQuery] = useState('');

  const archives = [
    { title: 'Liputan Peresmian RPTRA', type: 'FOTO', date: '10 Aug 2026', opd: 'Dinas Kebersihan' },
    { title: 'Video Teaser HUT Kota Ke-499', type: 'VIDEO', date: '12 Aug 2026', opd: 'Diskominfo' },
    { title: 'Siaran Pers Penanganan Stunting', type: 'DOKUMEN', date: '15 Aug 2026', opd: 'Dinas Kesehatan' },
  ];

  const renderTypeIcon = (type) => {
    if (type === 'FOTO') return <Image size={16} color="#0284c7" />;
    if (type === 'VIDEO') return <Film size={16} color="#d97706" />;
    return <FileText size={16} color="#16a34a" />;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#0f172a', margin: 0, fontSize: '22px' }}>Bank Konten & Arsip</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Cari dan ambil berkas arsip dokumentasi, rilis pers, atau media foto/video kapan saja.
        </p>
      </div>

      {/* INPUT PENCARIAN DENGAN LOOK MODERN */}
      <div style={styles.searchBox}>
        <Search size={20} color="#94a3b8" />
        <input 
          type="text" 
          placeholder="Ketik nama kegiatan, lokasi, instansi/OPD, atau jenis berkas..." 
          style={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* GRID KONTEN ARSIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {archives
          .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((item, i) => (
            <div key={i} style={styles.archiveCard}>
              <div>
                <div style={styles.cardHeader}>
                  <span style={styles.typeBadge}>
                    {renderTypeIcon(item.type)} {item.type}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.date}</span>
                </div>
                <h4 style={{ margin: '12px 0 6px 0', fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{item.title}</h4>
                <div style={{ fontSize: '13px', color: '#64748b' }}>OPD: {item.opd}</div>
              </div>

              <button style={styles.btnDownload}>
                <ExternalLink size={14} /> Lihat Berkas
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

const styles = {
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '12px 18px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#0f172a' },
  archiveCard: { background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' },
  btnDownload: { background: '#f8fafc', color: '#0284c7', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginTop: '14px' }
};