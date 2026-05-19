#!/usr/bin/env bash
# =============================================================================
# Auto backup PostgreSQL untuk app-karyawan (Linux / Bash)
# Default credentials sesuai docker-compose.yml; override via env var.
# Output: app-karyawan/backups/hub_karyawan_YYYYMMDD_HHMMSS.sql.gz
# =============================================================================

set -euo pipefail

# --- Konfigurasi default ---
PG_CONTAINER="${PG_CONTAINER:-app-karyawan-postgres}"
PG_DATABASE="${PG_DATABASE:-hub_karyawan}"
PG_USER="${PG_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# --- Resolve folder script & root project ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/hub_karyawan_${TIMESTAMP}.sql.gz"

echo "[INFO] Container : $PG_CONTAINER"
echo "[INFO] Database  : $PG_DATABASE"
echo "[INFO] User      : $PG_USER"
echo "[INFO] Output    : $BACKUP_FILE"

# --- Cek docker tersedia ---
if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] docker tidak ditemukan di PATH." >&2
  exit 1
fi

# --- Cek container running ---
if ! docker ps --filter "name=^/${PG_CONTAINER}$" --format '{{.Names}}' \
  | grep -qx "$PG_CONTAINER"; then
  echo "[ERROR] Container '$PG_CONTAINER' tidak running." >&2
  exit 1
fi

# --- pg_dump dalam container, langsung gzip ke file host ---
# Gunakan -i (stdin attached) supaya tidak menambahkan CR yang merusak gzip.
if ! docker exec -i "$PG_CONTAINER" \
      pg_dump -U "$PG_USER" -d "$PG_DATABASE" \
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
