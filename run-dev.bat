@echo off
echo Memulai Frontend (Host) dan Backend Server...
echo Jika perlu regenerate Prisma, gunakan npm run prisma:generate:safe agar backend tidak mati total.
cd app-karyawan
npm run dev:full:host
pause
