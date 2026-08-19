import React from 'react';
import { AlertTriangle, Calendar, MapPin, CheckCircle, Clock, ChevronRight } from 'lucide-react';

export default function Dashboard({ currentUser, userTasks, onSelectTask }) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* HEADER SAPAAN PERSONAL */}
      <div style={styles.headerBox}>
        <div>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: '22px' }}>
            Selamat datang kembali, {currentUser.name}! 👋
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Berikut adalah daftar tugas dan aktivitas kamu di bidang <strong>{currentUser.bidang}</strong> hari ini.
          </p>
        </div>
      </div>

      {/* RINGKASAN STATISTIK (CARD MODERN) */}
      <div style={styles.gridStats}>
        <div style={{ ...styles.cardStat, borderLeft: '4px solid #64748b' }}>
          <span style={styles.statLabel}>Total Tugas</span>
          <span style={styles.statNumber}>{userTasks.length}</span>
        </div>
        <div style={{ ...styles.cardStat, borderLeft: '4px solid #0284c7' }}>
          <span style={{ ...styles.statLabel, color: '#0284c7' }}>Sedang Dikerjakan</span>
          <span style={{ ...styles.statNumber, color: '#0284c7' }}>
            {userTasks.filter(t => t.status !== 'SELESAI' && t.status !== 'BELUM').length}
          </span>
        </div>
        <div style={{ ...styles.cardStat, borderLeft: '4px solid #16a34a' }}>
          <span style={{ ...styles.statLabel, color: '#16a34a' }}>Selesai</span>
          <span style={{ ...styles.statNumber, color: '#16a34a' }}>
            {userTasks.filter(t => t.status === 'SELESAI').length}
          </span>
        </div>
      </div>

      {/* BANNER BENTROK JADWAL (FRIENDLY WARNING) */}
      {userTasks.some(t => t.hasConflict) && (
        <div style={styles.conflictBanner}>
          <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '14px', color: '#92400e' }}>Perhatian: Ada Jadwal Bentrok</strong>
            {userTasks.filter(t => t.hasConflict).map(t => (
              <div key={t.id} style={{ fontSize: '13px', marginTop: '2px', color: '#b45309' }}>
                • {t.conflictMessage}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DAFTAR TUGAS */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ color: '#1e293b', fontSize: '16px', margin: 0 }}>Daftar Tugas Kamu</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Menampilkan bidang: {currentUser.bidang}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {userTasks.length === 0 ? (
            <div style={styles.emptyState}>
              ☕ Belum ada tugas baru untuk kamu di bidang ini.
            </div>
          ) : (
            userTasks.map(t => (
              <div key={t.id} style={styles.taskCard}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={styles.statusBadge(t.status)}>{t.status.replace('_', ' ')}</span>
                    <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: '600' }}>{t.kegiatan}</h4>
                  </div>
                  
                  <div style={styles.taskMeta}>
                    <span style={styles.metaItem}><MapPin size={14} color="#64748b" /> {t.lokasi}</span>
                    <span style={styles.metaItem}><Clock size={14} color="#64748b" /> Deadline: {t.deadline}</span>
                  </div>
                </div>

                <button style={styles.btnAction} onClick={() => onSelectTask(t)}>
                  Buka Detail <ChevronRight size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  headerBox: { background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  gridStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  cardStat: { background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
  statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statNumber: { fontSize: '26px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' },
  conflictBanner: { background: '#fffbeb', border: '1px solid #fde68a', padding: '14px 18px', borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '20px' },
  taskCard: { background: '#ffffff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
  taskMeta: { display: 'flex', gap: '18px', fontSize: '13px', color: '#64748b', marginTop: '4px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px' },
  btnAction: { background: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
  statusBadge: (status) => ({
    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
    background: status === 'SELESAI' ? '#dcfce7' : '#e0f2fe',
    color: status === 'SELESAI' ? '#15803d' : '#0369a1'
  }),
  emptyState: { padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }
};