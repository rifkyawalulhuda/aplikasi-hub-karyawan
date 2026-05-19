#!/usr/bin/env bash
# =============================================================================
# Auto backup PostgreSQL untuk app-karyawan (Linux / Bash)
# Versi STANDALONE: pakai pg_dump yang ter-install langsung di host.
#
# Default credentials sesuai .env dev; override via env var.
# Output: app-karyawan/backups/hub_karyawan_YYYYMMDD_HHMMSS.sql.gz
# =============================================================================

set -euo pipefail

# --- Konfigurasi default ---
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5434}"
PG_DATABASE="${PG_DATABASE:-hub_karyawan}"
PG_USER="${PG_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Password jangan ada di history command. Pakai PGPASSWORD env var atau ~/.pgpass.
# Contoh ~/.pgpass:
#   localhost:5434:hub_karyawan:postgres:postgres
# lalu chmod 600 ~/.pgpass
export PGPASSWORD="${PGPASSWORD:-postgres}"

# --- Resolve folder script & root project ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/hub_karyawan_${TIMESTAMP}.sql.gz"

echo "[INFO] Host      : $PG_HOST:$PG_PORT"
echo "[INFO] Database  : $PG_DATABASE"
echo "[INFO] User      : $PG_USER"
echo "[INFO] Output    : $BACKUP_FILE"

# --- Cek pg_dump tersedia ---
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "[ERROR] pg_dump tidak ditemukan di PATH." >&2
  echo "        Install postgresql-client / postgresql-contrib terlebih dulu." >&2
  echo "        Contoh: sudo apt install postgresql-client" >&2
  exit 1
fi

# --- pg_dump langsung di-pipe ke gzip ---
if ! pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" \
        --no-owner --no-privileges --clean --if-exists \
    | gzip -9 > "$BACKUP_FILE.tmp"; then
  echo "[ERROR] pg_dump/gzip gagal." >&2
  rm -f "$BACKUP_FILE.tmp"
  exit 1
fi

mv "$BACKUP_FILE.tmp" "$BACKUP_FILE"
echo "[OK]   Backup tersimpan: $BACKUP_FILE"

# --- Retention: hapus backup > RETENTION_DAYS hari ---
if [[ -n "$RETENTION_DAYS" && "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "[INFO] Membersihkan backup lebih dari $RETENTION_DAYS hari..."
  find "$BACKUP_DIR" -maxdepth 1 -type f \
    -name 'hub_karyawan_*.sql.gz' \
    -mtime "+$RETENTION_DAYS" -print -delete || true
fi

exit 0
