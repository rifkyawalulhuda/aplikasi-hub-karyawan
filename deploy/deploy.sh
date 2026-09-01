#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Deploy aplikasi-hub-karyawan ke server production
# Jalankan dari root project: bash deploy/deploy.sh
#
# Requirements:
#   - Git Bash (Windows) atau bash Linux/Mac
#   - SSH access ke server (password: lihat .env.deploy atau ketik manual)
#   - sshpass (opsional, untuk non-interactive deploy)
#
# Usage:
#   bash deploy/deploy.sh              # deploy ke production
#   bash deploy/deploy.sh --skip-build # skip vite build (deploy server saja)
# =============================================================================

set -euo pipefail

# ── Konfigurasi ──────────────────────────────────────────────────────────────
SERVER_USER="rifky"
SERVER_HOST="100.100.220.113"
SERVER_PORT="22"
REMOTE_APP_DIR="/home/rifky/Public/aplikasi-hub-karyawan/app-karyawan"
PM2_APP_NAME="hub-karyawan-api"
PM2_INSTANCES=4

SKIP_BUILD=false
if [[ "${1:-}" == "--skip-build" ]]; then
  SKIP_BUILD=true
fi

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── SSH helper ───────────────────────────────────────────────────────────────
ssh_run() {
  ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" "$@"
}

# ── Step 1: Cek koneksi server ───────────────────────────────────────────────
log_info "Mengecek koneksi ke server ${SERVER_HOST}..."
ssh_run "echo 'Connected'" > /dev/null || log_error "Tidak bisa konek ke server."
log_success "Server reachable."

# ── Step 2: Git pull di server ───────────────────────────────────────────────
log_info "Git pull di server..."
ssh_run "
  cd /home/rifky/Public/aplikasi-hub-karyawan && \
  git fetch origin && \
  git reset --hard origin/main && \
  echo 'Git pull OK'
"
log_success "Source code updated."

# ── Step 3: npm install ──────────────────────────────────────────────────────
log_info "Installing dependencies..."
ssh_run "
  cd ${REMOTE_APP_DIR} && \
  npm install --no-audit --no-fund --prefer-offline 2>&1 | tail -3
"
log_success "Dependencies installed."

# ── Step 4: Prisma generate ──────────────────────────────────────────────────
log_info "Generating Prisma client..."
ssh_run "
  cd ${REMOTE_APP_DIR} && \
  npx prisma generate 2>&1 | tail -3
"
log_success "Prisma client generated."

# ── Step 5: Build frontend (Vite) ────────────────────────────────────────────
if [[ "$SKIP_BUILD" == "false" ]]; then
  log_info "Building frontend (Vite)..."
  ssh_run "
    cd ${REMOTE_APP_DIR} && \
    npm run build:prod 2>&1 | tail -5
  "
  log_success "Frontend built."
else
  log_warn "Skip build (--skip-build flag aktif)."
fi

# ── Step 6: Reload PM2 (zero-downtime) ──────────────────────────────────────
log_info "Reloading PM2 (zero-downtime)..."
ssh_run "
  cd ${REMOTE_APP_DIR} && \
  pm2 reload ${PM2_APP_NAME} --update-env 2>&1 | tail -5 && \
  pm2 scale ${PM2_APP_NAME} ${PM2_INSTANCES} 2>&1 | tail -3 && \
  pm2 save
"
log_success "PM2 reloaded."

# ── Step 7: Verifikasi ───────────────────────────────────────────────────────
log_info "Verifikasi status..."
ssh_run "pm2 list --no-color | grep ${PM2_APP_NAME}"

echo ""
echo -e "${BOLD}${GREEN}============================================${NC}"
echo -e "${BOLD}${GREEN}  Deploy selesai!${NC}"
echo -e "${BOLD}${GREEN}============================================${NC}"
echo -e "  App     : ${CYAN}${PM2_APP_NAME}${NC}"
echo -e "  Server  : ${CYAN}${SERVER_HOST}${NC}"
echo -e "  Instances: ${CYAN}${PM2_INSTANCES}${NC}"
echo ""
