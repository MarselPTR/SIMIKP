import React, { useState } from 'react';
import { Upload, ArrowLeft, CheckCircle2, Clock, MapPin, FileText } from 'lucide-react';
import { WORKFLOWS } from '../data/mockData';

export default function Penugasan({ currentUser, userTasks, selectedTask, setSelectedTask, onUpdateStatus }) {
  const [uploadLink, setUploadLink] = useState('');

  if (!selectedTask) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: '22px' }}>Penugasan Saya</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Daftar seluruh tugas operasional yang dialokasikan untuk kamu.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {userTasks.map(t => (
            <div key={t.id} style={styles.taskCard}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={styles.statusBadge(t.status)}>{t.status.replace('_', ' ')}</span>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px' }}>{t.kegiatan}</h4>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px' }}>
                  <span>📍 {t.lokasi}</span>
                  <span>⏰ Deadline: {t.deadline}</span>
                </div>
              </div>

              <button style={styles.btnPrimary} onClick={() => setSelectedTask(t)}>
                Kelola Tugas
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button style={styles.btnBack} onClick={() => setSelectedTask(null)}>
        <ArrowLeft size={16} /> Kembali ke Daftar Penugasan
      </button>
      
      <div style={styles.detailCard}>
        {/* HEADER TUGAS */}
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
          <span style={styles.statusBadge(selectedTask.status)}>{selectedTask.status.replace('_', ' ')}</span>
          <h2 style={{ color: '#0f172a', margin: '8px 0 6px 0', fontSize: '20px' }}>{selectedTask.kegiatan}</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Tipe Pekerjaan: <strong>{selectedTask.jenisPekerjaan}</strong></p>
        </div>

        {/* METADATA INFORMASI */}
        <div style={styles.metaGrid}>
          <div>
            <span style={styles.metaLabel}><MapPin size={14} /> Lokasi Pelaksanaan</span>
            <div style={styles.metaValue}>{selectedTask.lokasi}</div>
          </div>
          <div>
            <span style={styles.metaLabel}><Clock size={14} /> Batas Waktu (Deadline)</span>
            <div style={styles.metaValue}>{selectedTask.deadline}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={styles.metaLabel}><FileText size={14} /> Catatan & Instruksi Khusus</span>
            <div style={{ ...styles.metaValue, fontWeight: 'normal', marginTop: '4px' }}>{selectedTask.instruksi}</div>
          </div>
        </div>

        {/* ALUR WORKFLOW PRODUKSI (PANDUAN POIN 4) */}
        <div style={{ marginTop: '28px' }}>
          <h3 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 4px 0' }}>Update Status Produksi</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
            {currentUser.bidang === 'DESAINER_EDITOR' 
              ? 'Klik tahapan di bawah untuk memperbarui progress. Sektor Anda memiliki akses fitur REVISI.' 
              : 'Klik tahapan di bawah untuk memperbarui progress pekerjaan kamu secara berurutan.'}
          </p>

          <div style={styles.workflowStepContainer}>
            {WORKFLOWS[currentUser.bidang].map((step, idx) => {
              const isActive = selectedTask.status === step;
              return (
                <button
                  key={step}
                  onClick={() => onUpdateStatus(selectedTask.id, step)}
                  style={isActive ? styles.wfActive : styles.wfBtn}
                >
                  {isActive && <CheckCircle2 size={14} />} {idx + 1}. {step.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* INPUT UNGGAH LUARAN/HASIL */}
        <div style={styles.uploadBox}>
          <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '14px' }}>Kirimkan Luaran / Hasil Kerja</h4>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
            Tempelkan link tautan Google Drive / Cloud Penyimpanan hasil dokumentasi/file kamu.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="https://drive.google.com/..." 
              style={styles.inputLink}
              value={uploadLink}
              onChange={(e) => setUploadLink(e.target.value)}
            />
            <button style={styles.btnPrimary} onClick={() => alert('Berhasil! Link luaran kerja telah tersimpan.')}>
              <Upload size={16} /> Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  taskCard: { background: '#ffffff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
  btnPrimary: { background: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' },
  btnBack: { background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginBottom: '16px', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' },
  detailCard: { background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #f1f5f9' },
  metaLabel: { fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' },
  metaValue: { fontSize: '14px', color: '#0f172a', fontWeight: '600', marginTop: '2px' },
  workflowStepContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  wfBtn: { padding: '8px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
  wfActive: { padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
  uploadBox: { marginTop: '24px', background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  inputLink: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', flex: 1, background: '#ffffff' },
  statusBadge: (status) => ({
    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-block',
    background: status === 'SELESAI' ? '#dcfce7' : '#e0f2fe',
    color: status === 'SELESAI' ? '#15803d' : '#0369a1'
  })
};