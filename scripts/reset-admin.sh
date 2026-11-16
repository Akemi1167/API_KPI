#!/usr/bin/env bash
# Reset admin: nếu MONGODB_URI trỏ host Docker (mongodb) thì chạy trong network Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASSWORD="${ADMIN_PASSWORD:-}"
NETWORK="${KPI_DOCKER_NETWORK:-kpi_network}"

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

run_in_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "MONGODB_URI dùng host '${mongo_host}' (chỉ resolve trong Docker),"
    echo "nhưng máy này không có lệnh docker."
    echo "Chạy bằng một trong hai cách:"
    echo "  1) docker run --rm --network ${NETWORK} -v ${ROOT}:/app -w /app -e ADMIN_PASSWORD='...' node:20-alpine sh -c \"npm i bcryptjs mongoose --omit=dev && node scripts/reset-admin.cjs\""
    echo "  2) Đổi tạm MONGODB_URI sang IP/host reachable rồi chạy lại"
    exit 1
  fi

  echo "Phát hiện Mongo host Docker '${mongo_host}' → chạy reset trong network '${NETWORK}'..."

  # Ưu tiên container API đang chạy (đã có node_modules)
  local cid
  cid="$(docker ps -q -f name=kpi_api_api | head -n1 || true)"
  if [[ -n "${cid}" ]]; then
    docker exec "${cid}" mkdir -p /app/scripts >/dev/null 2>&1 || true
    docker cp "${ROOT}/scripts/reset-admin.cjs" "${cid}:/app/scripts/reset-admin.cjs"
    if docker exec -e ADMIN_PASSWORD="${PASSWORD}" "${cid}" node scripts/reset-admin.cjs; then
      return 0
    fi
    echo "docker exec thất bại — thử docker run one-off..."
  fi

  docker run --rm \
    --network "${NETWORK}" \
    -v "${ROOT}:/app" \
    -w /app \
    -e ADMIN_PASSWORD="${PASSWORD}" \
    -e ADMIN_EMAIL \
    -e ADMIN_EMPLOYEE_CODE \
    -e ADMIN_FULL_NAME \
    -e BCRYPT_SALT_ROUNDS \
    node:20-alpine \
    sh -c "npm install bcryptjs mongoose --omit=dev --no-audit --no-fund >/dev/null && node scripts/reset-admin.cjs"
}

if [[ "${mongo_host}" == "mongodb" || "${mongo_host}" == "mongo" ]]; then
  run_in_docker
else
  run_local
fi
