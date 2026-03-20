@echo off
echo [1/4] Menginstal library Node.js (npm install)...
cd app-karyawan
call npm install

echo.
echo [2/4] Menyiapkan file konfigurasi (.env)...
if not exist .env (
    copy .env.example .env
    echo File .env berhasil dibuat dari template.
) else (
    echo File .env sudah ada, melewati langkah ini.
)

echo.
echo [3/4] Menjalankan Database Postgres...
REM call npm run db:up
echo Langkah Docker dilewati karena menggunakan Postgres lokal. Pastikan servis Postgres sudah jalan.

echo.
echo [4/4] Sinkronisasi Schema Database (Prisma db push)...
echo Mohon pastikan file .env sudah sesuai dengan username/password Postgres Bapak.
pause
call npx prisma db push

echo.
echo ======================================================
echo Setup Selesai! Bapak sekarang bisa menjalankan 
echo aplikasi dengan klik file 'run-dev.bat' di folder utama.
echo ======================================================
pause
