@echo off
echo =======================================================
echo          Menjalankan SIMIKP (Backend ^& Frontend)
echo =======================================================
echo.

echo [1/2] Menyalakan Backend (Fastify)...
start "SIMIKP - Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Menyalakan Frontend (React/Vite)...
start "SIMIKP - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Selesai! Dua jendela terminal baru telah terbuka.
echo - Jendela pertama menjalankan Backend di port 3000
echo - Jendela kedua menjalankan Frontend di port 5173
echo.
echo Biarkan kedua jendela tersebut terbuka selama Anda menggunakan aplikasi.
echo Untuk mematikan, cukup tutup (X) kedua jendela terminal tersebut.
echo.
pause
