#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/app-karyawan"

echo "Memulai frontend dan backend development..."
echo "Pastikan DATABASE_URL di app-karyawan/.env sesuai database yang dipakai."
echo "Jika memakai Docker Compose project ini, gunakan:"
echo '  DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hub_karyawan?schema=public"'

npm run dev:full:host
