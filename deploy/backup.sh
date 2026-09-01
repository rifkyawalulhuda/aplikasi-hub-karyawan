#!/usr/bin/env bash
# aplikasi-hub-karyawan/deploy/backup.sh
# Backup otomatis database PostgreSQL + folder uploads + config
# Retensi: 7 hari terakhir
#
# Usage:
#   ./backup.sh                          - Backup (Docker mode)
#   ./backup.sh --backup-dir /path/to/   - Custom backup dir

# ── Default values ───────────────────────────────────────────────────────────
BACKUP_DIR="${HOME}/backups/hub-karyawan"
PG_CONTAINER="app-karyawan-postgres"
PG_DATABASE="hub_karyawan"
PG_USER="postgres"
RETAIN_DAYS=7

TIMESTAMP="$(date +%Y-%m-%d_%H-%M)"
BACKUP_NAME="backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# ── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --backup-dir)
      BACKUP_DIR="$2"
      BACKUP_NAME="backup_$(date +%Y-%m-%d_%H-%M)"
      BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
      LOG_FILE="${BACKUP_DIR}/backup.log"
      shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--backup-dir DIR]"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Functions ────────────────────────────────────────────────────────────────
write_log() {
  local level="${2:-INFO}"
  local line="[$(date '+%Y-%m-%d %H:%M:%S') $level] $1"
  echo "$line"
  mkdir -p "$BACKUP_DIR"
  echo "$line" >> "$LOG_FILE"
}

# ── Pastikan folder backup ada ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

write_log "===== Backup started: $BACKUP_NAME ====="
mkdir -p "$BACKUP_PATH"

# ── 1. Backup PostgreSQL via Docker ─────────────────────────────────────────
write_log "Backing up PostgreSQL database..."

DB_FILE="${BACKUP_PATH}/hub_karyawan.sql"

if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  write_log "Container '${PG_CONTAINER}' tidak running, skip DB backup." "WARN"
else
  if docker exec -i "$PG_CONTAINER" \
      pg_dump -U "$PG_USER" -d "$PG_DATABASE" \
              --no-owner --no-privileges --clean --if-exists \
      > "$DB_FILE" 2>/dev/null; then
    DB_SIZE=$(du -sh "$DB_FILE" 2>/dev/null | cut -f1)
    write_log "Database backup OK: hub_karyawan.sql (${DB_SIZE})"
  else
    write_log "Database backup GAGAL." "ERROR"
    rm -f "$DB_FILE"
  fi
fi

# ── 2. Backup uploads/files ──────────────────────────────────────────────────
write_log "Backing up uploads folder..."

PROJECT_DIR="/home/rifky/Public/aplikasi-hub-karyawan"
UPLOADS_SRC="${PROJECT_DIR}/app-karyawan/uploads"
UPLOADS_DST="${BACKUP_PATH}/uploads"

if [[ -d "$UPLOADS_SRC" ]]; then
  cp -r "$UPLOADS_SRC" "$UPLOADS_DST" 2>/dev/null
  FILE_COUNT=$(find "$UPLOADS_DST" -type f 2>/dev/null | wc -l)
  write_log "Uploads backup OK: ${FILE_COUNT} file(s) copied"
else
  write_log "Uploads folder tidak ditemukan, skip." "WARN"
fi

# ── 3. Backup config files ───────────────────────────────────────────────────
write_log "Backing up config files..."

CONFIG_DST="${BACKUP_PATH}/config"
mkdir -p "$CONFIG_DST"
COPIED=0

for ENV_FILE in \
  "${PROJECT_DIR}/app-karyawan/.env" \
  "${PROJECT_DIR}/app-karyawan/.env.production" \
  "${PROJECT_DIR}/.env" \
  "${PROJECT_DIR}/docker-compose.yml"; do
  if [[ -f "$ENV_FILE" ]]; then
    cp "$ENV_FILE" "$CONFIG_DST/" 2>/dev/null
    write_log "Config backup OK: $(basename $ENV_FILE)"
    COPIED=$((COPIED + 1))
  fi
done

write_log "Config backup complete: ${COPIED} file(s) copied"

# ── 4. Cleanup old backups ───────────────────────────────────────────────────
write_log "Cleaning up backups older than ${RETAIN_DAYS} days..."

DELETED=0
CUTOFF_EPOCH=$(date -d "${RETAIN_DAYS} days ago" +%s 2>/dev/null || echo 0)

for DIR in "${BACKUP_DIR}"/backup_*; do
  [[ -d "$DIR" ]] || continue
  DIR_NAME=$(basename "$DIR")
  if [[ "$DIR_NAME" =~ ^backup_([0-9]{4}-[0-9]{2}-[0-9]{2}) ]]; then
    BACKUP_DATE="${BASH_REMATCH[1]}"
    BACKUP_EPOCH=$(date -d "$BACKUP_DATE" +%s 2>/dev/null || echo 0)
    if [[ "$BACKUP_EPOCH" -gt 0 && "$CUTOFF_EPOCH" -gt 0 && "$BACKUP_EPOCH" -lt "$CUTOFF_EPOCH" ]]; then
      rm -rf "$DIR"
      write_log "Deleted old backup: $DIR_NAME"
      DELETED=$((DELETED + 1))
    fi
  fi
done
write_log "Deleted $DELETED old backup(s)"

# ── 5. Summary ──────────────────────────────────────────────────────────────
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" | wc -l)
write_log "===== Backup completed: $BACKUP_PATH ====="
write_log "Total backups retained: $TOTAL_BACKUPS"
echo ""
echo "Backup selesai: $BACKUP_PATH"
