@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ===========================================================================
REM Auto backup PostgreSQL untuk app-karyawan (Windows / CMD)
REM Versi STANDALONE: pakai pg_dump yang ter-install langsung di host.
REM
REM Kredensial dibaca dari env vars; default sesuai .env dev.
REM Output: app-karyawan\backups\hub_karyawan_YYYYMMDD_HHMMSS.sql.gz
REM ===========================================================================

REM --- Konfigurasi default (override via env var di shell jika perlu) ---
if not defined PG_HOST       set "PG_HOST=localhost"
if not defined PG_PORT       set "PG_PORT=5434"
if not defined PG_DATABASE   set "PG_DATABASE=hub_karyawan"
if not defined PG_USER       set "PG_USER=postgres"
if not defined PGPASSWORD    set "PGPASSWORD=postgres"
if not defined RETENTION_DAYS set "RETENTION_DAYS=30"

REM --- Resolve folder script & root project ---
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul
set "PROJECT_ROOT=%CD%"
popd >nul

set "BACKUP_DIR=%PROJECT_ROOT%\backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM --- Build timestamp YYYYMMDD_HHMMSS via PowerShell (lintas locale) ---
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"`) do set "TIMESTAMP=%%i"

set "BACKUP_FILE=%BACKUP_DIR%\hub_karyawan_%TIMESTAMP%.sql"
set "BACKUP_GZ=%BACKUP_FILE%.gz"

echo [INFO] Host      : %PG_HOST%:%PG_PORT%
echo [INFO] Database  : %PG_DATABASE%
echo [INFO] User      : %PG_USER%
echo [INFO] Output    : %BACKUP_GZ%

REM --- Cek pg_dump tersedia di PATH ---
where pg_dump >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pg_dump tidak ditemukan di PATH.
  echo         Pastikan PostgreSQL client tools ter-install.
  echo         Contoh PATH: C:\Program Files\PostgreSQL\16\bin
  exit /b 1
)

REM --- Jalankan pg_dump ---
pg_dump -h "%PG_HOST%" -p "%PG_PORT%" -U "%PG_USER%" -d "%PG_DATABASE%" --no-owner --no-privileges --clean --if-exists -f "%BACKUP_FILE%"
if errorlevel 1 (
  echo [ERROR] pg_dump gagal.
  if exist "%BACKUP_FILE%" del /q "%BACKUP_FILE%"
  exit /b 1
)

REM --- Kompres pakai PowerShell (gzip native, tanpa tool tambahan) ---
powershell -NoProfile -Command ^
  "$src='%BACKUP_FILE%'; $dst='%BACKUP_GZ%';" ^
  "$in=[System.IO.File]::OpenRead($src);" ^
  "$out=[System.IO.File]::Create($dst);" ^
  "$gz=New-Object System.IO.Compression.GzipStream($out,[System.IO.Compression.CompressionLevel]::Optimal);" ^
  "$in.CopyTo($gz); $gz.Dispose(); $out.Dispose(); $in.Dispose();"
if errorlevel 1 (
  echo [ERROR] Gzip gagal.
  exit /b 1
)
del /q "%BACKUP_FILE%"

echo [OK]   Backup tersimpan: %BACKUP_GZ%

REM --- Retention: hapus backup > RETENTION_DAYS hari ---
if "%RETENTION_DAYS%"=="" goto :EOF
echo [INFO] Membersihkan backup lebih dari %RETENTION_DAYS% hari...
forfiles /P "%BACKUP_DIR%" /M "hub_karyawan_*.sql.gz" /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul

endlocal
exit /b 0
