#!/usr/bin/env bash
# Reset admin. Nếu Mongo host là Docker service name → docker exec vào container API.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASSWORD="${ADMIN_PASSWORD:-}"

mongo_host="$(
  node -e "
    const fs=require('fs'); const path=require('path');
    const envPath=path.join(process.cwd(),'.env');
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath,'utf8').split(/\\r?\\n/)) {
        const t=line.trim();
        if (!t || t.startsWith('#') || !t.includes('=')) continue;
        const i=t.indexOf('=');
        const k=t.slice(0,i).trim();
        let v=t.slice(i+1).trim().replace(/^['\\\"]|['\\\"]$/g,'');
        if (process.env[k]===undefined) process.env[k]=v;
      }
    }
    try { console.log(new URL(process.env.MONGODB_URI||'').hostname); }
    catch { console.log(''); }
  "
)"

run_local() {
  node scripts/reset-admin.cjs
}

run_via_api_container() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "MONGODB_URI dùng host '${mongo_host}' (chỉ resolve trong Docker)."
    echo "Không có lệnh docker trên máy này."
    exit 1
  fi

  local cid
  cid="$(docker ps -q -f name=kpi_api_api | head -n1 || true)"
  if [[ -z "${cid}" ]]; then
    echo "Không tìm thấy container đang chạy (name chứa kpi_api_api)."
    echo "Kiểm tra: docker ps | grep kpi_api"
    exit 1
  fi

  echo "Phát hiện Mongo host Docker '${mongo_host}' → reset trong container ${cid}..."
  docker exec "${cid}" mkdir -p /app/scripts
  docker cp "${ROOT}/scripts/reset-admin.cjs" "${cid}:/app/scripts/reset-admin.cjs"

  # Container API đã có bcrypt + mongoose; truyền ADMIN_PASSWORD qua -e
  if [[ -n "${PASSWORD}" ]]; then
    docker exec -e ADMIN_PASSWORD="${PASSWORD}" "${cid}" node scripts/reset-admin.cjs
  else
    docker exec "${cid}" node scripts/reset-admin.cjs
  fi
}

if [[ "${mongo_host}" == "mongodb" || "${mongo_host}" == "mongo" ]]; then
  run_via_api_container
else
  run_local
fi
