# SIMIKP Kota Batu
Sistem Informasi Manajemen Informasi dan Komunikasi Publik (SIMIKP) Diskominfo Kota Batu.

## 🚀 Menjalankan Aplikasi (Fullstack)

Jalankan perintah berikut di direktori root:

```bash
npm run dev:web
```

Perintah di atas akan secara otomatis menjalankan:
1. **Backend (Fastify API)** di `http://127.0.0.1:3000` (Log prefix: `[BACKEND]`)
2. **Frontend (React + Vite)** di `http://localhost:5173` (Log prefix: `[FRONTEND]`)

### 📦 Perintah Tambahan di Root:
- `npm run dev:web` : Menjalankan backend dan frontend secara bersamaan.
- `npm run dev` : Alias untuk `npm run dev:web`.
- `npm run backend` : Hanya menjalankan backend.
- `npm run frontend` : Hanya menjalankan frontend.
- `npm run build:all` : Membangun bundle produksi untuk backend dan frontend.
